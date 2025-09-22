/**
 * Migration Service - Handles AsyncStorage to SQLite Migration
 * 
 * Safely migrates existing data to SQLite while maintaining backwards compatibility
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeDatabase, migrationUtils, recordingOperations, alarmOperations } from '../utils/databaseManager';
import { STORAGE_KEYS } from '../constants/app';

const MIGRATION_STATUS_KEY = '@migration_status';

export class MigrationService {
  static async checkMigrationStatus() {
    try {
      const status = await AsyncStorage.getItem(MIGRATION_STATUS_KEY);
      return status ? JSON.parse(status) : null;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return null;
    }
  }

  static async setMigrationStatus(status) {
    try {
      await AsyncStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Error setting migration status:', error);
    }
  }

  static async performMigration() {
    try {
      console.log('🚀 Starting data migration to SQLite...');
      
      // Check if already migrated
      const migrationStatus = await this.checkMigrationStatus();
      if (migrationStatus?.completed) {
        console.log('✅ Migration already completed, skipping...');
        return { success: true, alreadyMigrated: true };
      }

      // Initialize SQLite database
      const dbInit = await initializeDatabase();
      if (!dbInit.success) {
        throw new Error(`Database initialization failed: ${dbInit.error}`);
      }

      // Load data from AsyncStorage
      const asyncData = await this.loadAsyncStorageData();
      
      // Perform migration
      const migrationResult = await migrationUtils.migrateFromAsyncStorage(asyncData);
      
      if (migrationResult.success) {
        // Mark migration as completed
        await this.setMigrationStatus({
          completed: true,
          completedAt: Date.now(),
          migratedRecordings: migrationResult.migratedRecordings,
          migratedAlarms: migrationResult.migratedAlarms,
          version: '1.0.0'
        });

        // Clean up AsyncStorage (optional - keep for backup)
        // await this.cleanupAsyncStorage();

        console.log('🎉 Migration completed successfully!');
        return {
          success: true,
          migrationResult
        };
      } else {
        throw new Error(`Migration failed: ${migrationResult.error}`);
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      
      // Mark migration as failed
      await this.setMigrationStatus({
        completed: false,
        failed: true,
        failedAt: Date.now(),
        error: error.message,
        version: '1.0.0'
      });
      
      return { success: false, error: error.message };
    }
  }

  static async loadAsyncStorageData() {
    try {
      console.log('📂 Loading data from AsyncStorage...');
      
      const [recordings, recordingsList, alarms] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.RECORDINGS),
        AsyncStorage.getItem(STORAGE_KEYS.RECORDINGS_LIST),
        AsyncStorage.getItem(STORAGE_KEYS.ALARMS)
      ]);

      const data = {
        recordings: recordings ? JSON.parse(recordings) : [],
        recordingsList: recordingsList ? JSON.parse(recordingsList) : [],
        alarms: alarms ? JSON.parse(alarms) : []
      };

      console.log(`📊 AsyncStorage data loaded:
        - Recordings: ${data.recordings.length}
        - Recordings List: ${data.recordingsList.length}
        - Alarms: ${data.alarms.length}`);

      return data;
    } catch (error) {
      console.error('Error loading AsyncStorage data:', error);
      return { recordings: [], recordingsList: [], alarms: [] };
    }
  }

  static async cleanupAsyncStorage() {
    try {
      console.log('🧹 Cleaning up AsyncStorage after migration...');
      
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.RECORDINGS),
        AsyncStorage.removeItem(STORAGE_KEYS.RECORDINGS_LIST),
        AsyncStorage.removeItem(STORAGE_KEYS.ALARMS)
      ]);
      
      console.log('✅ AsyncStorage cleanup completed');
    } catch (error) {
      console.error('Error cleaning up AsyncStorage:', error);
    }
  }

  static async forceMigration() {
    try {
      console.log('🔄 Forcing migration (resetting status)...');
      
      // Reset migration status
      await AsyncStorage.removeItem(MIGRATION_STATUS_KEY);
      
      // Clear existing SQLite data
      await migrationUtils.clearAll();
      
      // Perform migration
      return await this.performMigration();
    } catch (error) {
      console.error('Force migration failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async getMigrationInfo() {
    try {
      const migrationStatus = await this.checkMigrationStatus();
      const dbInfo = await migrationUtils.getDatabaseInfo();
      const asyncData = await this.loadAsyncStorageData();
      
      return {
        migrationStatus,
        databaseInfo: dbInfo,
        asyncStorageData: {
          recordingsCount: asyncData.recordings.length + asyncData.recordingsList.length,
          alarmsCount: asyncData.alarms.length
        }
      };
    } catch (error) {
      console.error('Error getting migration info:', error);
      return null;
    }
  }
}

export default MigrationService;
