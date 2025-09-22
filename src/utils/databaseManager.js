/**
 * Database Manager - Production-Ready SQLite Implementation
 * 
 * Replaces AsyncStorage with SQLite for:
 * - Better performance and scalability
 * - ACID transactions
 * - Complex queries and indexing
 * - Data integrity and relationships
 */

import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'AlarmApp.db';
const DATABASE_VERSION = 1;

// Database instance
let db = null;
let isInitializing = false;
let initializationPromise = null;

/**
 * Initialize database connection and create tables
 */
export const initializeDatabase = async () => {
  // If already initializing, wait for that to complete
  if (isInitializing && initializationPromise) {
    console.log('🔄 Database initialization already in progress, waiting...');
    return await initializationPromise;
  }

  // If database is already initialized, test it
  if (db) {
    try {
      await db.runAsync('SELECT 1');
      console.log('✅ Database already initialized and working');
      return { success: true };
    } catch (error) {
      console.log('❌ Existing database connection is broken, reinitializing...');
      db = null;
    }
  }

  // Start initialization
  isInitializing = true;
  
  initializationPromise = (async () => {
    try {
      console.log('🗄️ Initializing SQLite database...');
      
      // Close existing connection if any
      if (db) {
        try {
          await db.closeAsync();
        } catch (e) {
          console.log('Old database connection cleanup:', e.message);
        }
      }
      
      // Open database with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          db = await SQLite.openDatabaseAsync(DATABASE_NAME);
          break;
        } catch (error) {
          retries--;
          console.log(`Database open failed, retries left: ${retries}`, error.message);
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Test database connection
      await db.runAsync('SELECT 1');
      console.log('🔗 Database connection established');
      
      // Enable foreign keys and WAL mode for better performance
      await db.execAsync(`
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
      `);
      console.log('⚙️ Database pragmas configured');
      
      // Create tables
      await createTables();
      console.log('📋 Database tables created/verified');
      
      // Final connectivity test
      await db.runAsync('SELECT COUNT(*) FROM recordings');
      console.log('🧪 Database functionality test passed');
      
      console.log('✅ Database initialized and tested successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      db = null; // Reset db variable on failure
      return { success: false, error: error.message };
    } finally {
      isInitializing = false;
      initializationPromise = null;
    }
  })();

  return await initializationPromise;
};

/**
 * Create database tables
 */
const createTables = async () => {
  // Recordings table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      audioUri TEXT NOT NULL,
      duration INTEGER NOT NULL,
      fileSize INTEGER DEFAULT 0,
      uploadedAt INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );
  `);

  // Alarms table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS alarms (
      id TEXT PRIMARY KEY,
      recordingId TEXT,
      hour INTEGER NOT NULL,
      minute INTEGER NOT NULL,
      ampm TEXT NOT NULL,
      days TEXT NOT NULL, -- JSON array of selected days
      enabled INTEGER DEFAULT 1,
      audioUri TEXT,
      enhancedIds TEXT, -- JSON object with expo/native IDs
      createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (recordingId) REFERENCES recordings (id) ON DELETE SET NULL
    );
  `);

  // Create indexes for better performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_recordings_uploadedAt ON recordings (uploadedAt);
    CREATE INDEX IF NOT EXISTS idx_recordings_createdAt ON recordings (createdAt);
    CREATE INDEX IF NOT EXISTS idx_alarms_enabled ON alarms (enabled);
    CREATE INDEX IF NOT EXISTS idx_alarms_recordingId ON alarms (recordingId);
  `);

  console.log('✅ Database tables created');
};

/**
 * Recording operations
 */
export const recordingOperations = {
  // Get all recordings
  getAll: async () => {
    try {
      const recordings = await db.getAllAsync(
        'SELECT * FROM recordings ORDER BY uploadedAt DESC'
      );
      return recordings.map(recording => ({
        ...recording,
        uploadedAt: recording.uploadedAt,
        createdAt: recording.createdAt,
        updatedAt: recording.updatedAt
      }));
    } catch (error) {
      console.error('Error getting recordings:', error);
      return [];
    }
  },

  // Add new recording
  add: async (recording) => {
    try {
      // Ensure database is initialized and ready
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        
        if (!db) {
          console.log(`⚠️ Database not initialized (attempt ${attempts}), initializing now...`);
          const initResult = await initializeDatabase();
          if (!initResult.success) {
            if (attempts === maxAttempts) {
              throw new Error('Database initialization failed after multiple attempts: ' + initResult.error);
            }
            console.log(`Initialization failed, retrying... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        // Test database connection before proceeding
        try {
          await db.runAsync('SELECT 1');
          console.log(`✅ Database connection verified (attempt ${attempts})`);
          break;
        } catch (testError) {
          console.log(`❌ Database connection test failed (attempt ${attempts}):`, testError.message);
          db = null;
          if (attempts === maxAttempts) {
            throw new Error('Database connection test failed after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const now = Date.now();
      await db.runAsync(
        `INSERT INTO recordings (id, name, audioUri, duration, fileSize, uploadedAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recording.id,
          recording.name || 'Unnamed Recording',
          recording.audioUri,
          recording.duration || 0,
          recording.fileSize || 0,
          recording.uploadedAt || now,
          now,
          now
        ]
      );
      console.log('✅ Recording added to database:', recording.id);
      return { success: true };
    } catch (error) {
      console.error('Error adding recording:', error);
      return { success: false, error: error.message };
    }
  },

  // Update recording
  update: async (id, updates) => {
    try {
      const now = Date.now();
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), now, id];
      
      await db.runAsync(
        `UPDATE recordings SET ${setClause}, updatedAt = ? WHERE id = ?`,
        values
      );
      console.log('✅ Recording updated:', id);
      return { success: true };
    } catch (error) {
      console.error('Error updating recording:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete recording
  delete: async (id) => {
    try {
      await db.runAsync('DELETE FROM recordings WHERE id = ?', [id]);
      console.log('✅ Recording deleted:', id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting recording:', error);
      return { success: false, error: error.message };
    }
  },

  // Get recording by ID
  getById: async (id) => {
    try {
      const recording = await db.getFirstAsync(
        'SELECT * FROM recordings WHERE id = ?',
        [id]
      );
      return recording;
    } catch (error) {
      console.error('Error getting recording by ID:', error);
      return null;
    }
  },

  // Get storage statistics
  getStats: async () => {
    try {
      const stats = await db.getFirstAsync(`
        SELECT 
          COUNT(*) as totalRecordings,
          SUM(fileSize) as totalSizeBytes,
          ROUND(SUM(fileSize) / 1024.0 / 1024.0, 2) as totalSizeMB
        FROM recordings
      `);
      return {
        totalRecordings: stats.totalRecordings || 0,
        totalSizeBytes: stats.totalSizeBytes || 0,
        totalSizeMB: stats.totalSizeMB || 0
      };
    } catch (error) {
      console.error('Error getting recording stats:', error);
      return { totalRecordings: 0, totalSizeBytes: 0, totalSizeMB: 0 };
    }
  }
};

/**
 * Alarm operations
 */
export const alarmOperations = {
  // Get all alarms
  getAll: async () => {
    try {
      const alarms = await db.getAllAsync(`
        SELECT a.*, r.name as recordingName, r.audioUri as recordingAudioUri 
        FROM alarms a
        LEFT JOIN recordings r ON a.recordingId = r.id
        ORDER BY a.hour, a.minute
      `);
      return alarms.map(alarm => ({
        ...alarm,
        days: alarm.days ? JSON.parse(alarm.days) : [],
        enhancedIds: alarm.enhancedIds ? JSON.parse(alarm.enhancedIds) : { expoIds: [], nativeIds: [] },
        enabled: Boolean(alarm.enabled)
      }));
    } catch (error) {
      console.error('Error getting alarms:', error);
      return [];
    }
  },

  // Add new alarm
  add: async (alarm) => {
    try {
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO alarms (id, recordingId, hour, minute, ampm, days, enabled, audioUri, enhancedIds, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alarm.id,
          alarm.recordingId || null,
          alarm.hour,
          alarm.minute,
          alarm.ampm,
          JSON.stringify(alarm.days || []),
          alarm.enabled ? 1 : 0,
          alarm.audioUri || null,
          JSON.stringify(alarm.enhancedIds || { expoIds: [], nativeIds: [] }),
          now,
          now
        ]
      );
      console.log('✅ Alarm added to database:', alarm.id);
      return { success: true };
    } catch (error) {
      console.error('Error adding alarm:', error);
      return { success: false, error: error.message };
    }
  },

  // Update alarm
  update: async (id, updates) => {
    try {
      const now = Date.now();
      const processedUpdates = { ...updates };
      
      // Process special fields
      if (processedUpdates.days) {
        processedUpdates.days = JSON.stringify(processedUpdates.days);
      }
      if (processedUpdates.enhancedIds) {
        processedUpdates.enhancedIds = JSON.stringify(processedUpdates.enhancedIds);
      }
      if (processedUpdates.enabled !== undefined) {
        processedUpdates.enabled = processedUpdates.enabled ? 1 : 0;
      }
      
      const setClause = Object.keys(processedUpdates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(processedUpdates), now, id];
      
      await db.runAsync(
        `UPDATE alarms SET ${setClause}, updatedAt = ? WHERE id = ?`,
        values
      );
      console.log('✅ Alarm updated:', id);
      return { success: true };
    } catch (error) {
      console.error('Error updating alarm:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete alarm
  delete: async (id) => {
    try {
      await db.runAsync('DELETE FROM alarms WHERE id = ?', [id]);
      console.log('✅ Alarm deleted:', id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting alarm:', error);
      return { success: false, error: error.message };
    }
  },

  // Get alarms by recording ID
  getByRecordingId: async (recordingId) => {
    try {
      const alarms = await db.getAllAsync(
        'SELECT * FROM alarms WHERE recordingId = ?',
        [recordingId]
      );
      return alarms.map(alarm => ({
        ...alarm,
        days: alarm.days ? JSON.parse(alarm.days) : [],
        enhancedIds: alarm.enhancedIds ? JSON.parse(alarm.enhancedIds) : { expoIds: [], nativeIds: [] },
        enabled: Boolean(alarm.enabled)
      }));
    } catch (error) {
      console.error('Error getting alarms by recording ID:', error);
      return [];
    }
  }
};

/**
 * Migration utilities
 */
export const migrationUtils = {
  // Migrate data from AsyncStorage to SQLite
  migrateFromAsyncStorage: async (asyncStorageData) => {
    try {
      console.log('📦 Starting AsyncStorage to SQLite migration...');
      
      let migratedRecordings = 0;
      let migratedAlarms = 0;
      
      // Migrate recordings
      if (asyncStorageData.recordings && Array.isArray(asyncStorageData.recordings)) {
        for (const recording of asyncStorageData.recordings) {
          const result = await recordingOperations.add(recording);
          if (result.success) migratedRecordings++;
        }
      }
      
      // Migrate recording list (if separate)
      if (asyncStorageData.recordingsList && Array.isArray(asyncStorageData.recordingsList)) {
        for (const recording of asyncStorageData.recordingsList) {
          // Check if already migrated
          const existing = await recordingOperations.getById(recording.id);
          if (!existing) {
            const result = await recordingOperations.add(recording);
            if (result.success) migratedRecordings++;
          }
        }
      }
      
      // Migrate alarms
      if (asyncStorageData.alarms && Array.isArray(asyncStorageData.alarms)) {
        for (const alarm of asyncStorageData.alarms) {
          const result = await alarmOperations.add(alarm);
          if (result.success) migratedAlarms++;
        }
      }
      
      console.log(`✅ Migration complete: ${migratedRecordings} recordings, ${migratedAlarms} alarms`);
      return {
        success: true,
        migratedRecordings,
        migratedAlarms
      };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Clear all data (for testing)
  clearAll: async () => {
    try {
      await db.execAsync('DELETE FROM alarms');
      await db.execAsync('DELETE FROM recordings');
      console.log('🧹 All database data cleared');
      return { success: true };
    } catch (error) {
      console.error('Error clearing database:', error);
      return { success: false, error: error.message };
    }
  },

  // Get database info
  getDatabaseInfo: async () => {
    try {
      const recordingCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM recordings');
      const alarmCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM alarms');
      
      return {
        recordingCount: recordingCount.count,
        alarmCount: alarmCount.count,
        databaseName: DATABASE_NAME,
        version: DATABASE_VERSION
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      return null;
    }
  }
};

/**
 * Transaction wrapper for complex operations
 */
export const transaction = async (operations) => {
  try {
    console.log('🔄 Starting database transaction...');
    
    // SQLite transactions in expo-sqlite
    await db.withTransactionAsync(async () => {
      for (const operation of operations) {
        await operation();
      }
    });
    
    console.log('✅ Transaction completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Database health check
 */
export const healthCheck = async () => {
  try {
    // Test basic operations
    const info = await migrationUtils.getDatabaseInfo();
    const stats = await recordingOperations.getStats();
    
    return {
      success: true,
      healthy: true,
      info,
      stats,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      success: false,
      healthy: false,
      error: error.message,
      timestamp: Date.now()
    };
  }
};
