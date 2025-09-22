/**
 * Storage Manager - Production-Ready File & Cache Management
 * 
 * Handles:
 * - Cache cleanup (delete files > 7 days old)
 * - Storage quota enforcement (max 100MB or 20 recordings)
 * - File validation and health checks
 * - Recording length limits
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, AUDIO_CONFIG } from '../constants/app';
import { recordingOperations } from './databaseManager';

// Storage Configuration
export const STORAGE_CONFIG = {
  MAX_RECORDINGS: 20,
  MAX_STORAGE_SIZE_MB: 100,
  MAX_STORAGE_SIZE_BYTES: 100 * 1024 * 1024, // 100MB
  CACHE_CLEANUP_DAYS: 7,
  MAX_RECORDING_DURATION_MS: 3 * 60 * 1000, // 3 minutes
  MIN_RECORDING_DURATION_MS: 3 * 1000, // 3 seconds
};

/**
 * Get storage statistics
 */
export const getStorageStats = async () => {
  try {
    // Get recordings from SQLite instead of AsyncStorage
    const recordings = await recordingOperations.getAll();
    let totalSize = 0;
    let validFiles = 0;
    let invalidFiles = 0;

    for (const recording of recordings) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(recording.audioUri || recording.uri);
        if (fileInfo.exists && fileInfo.size > 0) {
          totalSize += fileInfo.size || 0;
          validFiles++;
        } else {
          invalidFiles++;
        }
      } catch (error) {
        invalidFiles++;
      }
    }

    return {
      totalRecordings: recordings.length,
      validFiles,
      invalidFiles,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      isOverQuota: totalSize > STORAGE_CONFIG.MAX_STORAGE_SIZE_BYTES || recordings.length > STORAGE_CONFIG.MAX_RECORDINGS,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalRecordings: 0,
      validFiles: 0,
      invalidFiles: 0,
      totalSizeBytes: 0,
      totalSizeMB: 0,
      isOverQuota: false,
    };
  }
};

/**
 * Get recordings from AsyncStorage
 */
const getRecordingsFromStorage = async () => {
  try {
    const recordings = await AsyncStorage.getItem(STORAGE_KEYS.RECORDINGS);
    const recordingsList = await AsyncStorage.getItem(STORAGE_KEYS.RECORDINGS_LIST);
    
    let allRecordings = [];
    
    if (recordings) {
      const parsed = JSON.parse(recordings);
      if (Array.isArray(parsed)) {
        allRecordings = allRecordings.concat(parsed);
      }
    }
    
    if (recordingsList) {
      const parsed = JSON.parse(recordingsList);
      if (Array.isArray(parsed)) {
        allRecordings = allRecordings.concat(parsed);
      }
    }
    
    // Remove duplicates by ID
    return allRecordings.filter((recording, index, self) => 
      index === self.findIndex(r => r.id === recording.id)
    );
  } catch (error) {
    console.error('Error getting recordings from storage:', error);
    return [];
  }
};

/**
 * Clean up cache directory - remove files older than specified days
 */
export const cleanupCacheFiles = async (maxAgeDays = STORAGE_CONFIG.CACHE_CLEANUP_DAYS) => {
  try {
    console.log(`🧹 Starting cache cleanup (files older than ${maxAgeDays} days)`);
    
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      console.log('Cache directory not available');
      return { success: false, error: 'Cache directory not available' };
    }

    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    
    let deletedFiles = 0;
    let deletedSize = 0;
    let errors = [];

    for (const fileName of files) {
      try {
        const filePath = `${cacheDir}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && fileInfo.modificationTime) {
          const fileAge = fileInfo.modificationTime * 1000; // Convert to milliseconds
          
          if (fileAge < cutoffTime) {
            // File is older than cutoff, delete it
            await FileSystem.deleteAsync(filePath);
            deletedFiles++;
            deletedSize += fileInfo.size || 0;
            console.log(`🗑️ Deleted old cache file: ${fileName} (${Math.round((fileInfo.size || 0) / 1024)}KB)`);
          }
        }
      } catch (error) {
        console.warn(`Error processing file ${fileName}:`, error);
        errors.push(`${fileName}: ${error.message}`);
      }
    }

    console.log(`✅ Cache cleanup complete: ${deletedFiles} files deleted, ${Math.round(deletedSize / 1024)}KB freed`);
    
    return {
      success: true,
      deletedFiles,
      deletedSizeBytes: deletedSize,
      deletedSizeMB: Math.round(deletedSize / (1024 * 1024) * 100) / 100,
      errors,
    };
  } catch (error) {
    console.error('Cache cleanup failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove invalid recordings from metadata storage
 */
export const cleanupInvalidRecordings = async () => {
  try {
    console.log('🔍 Checking for invalid recordings...');
    
    const recordings = await getRecordingsFromStorage();
    const validRecordings = [];
    const invalidRecordings = [];

    for (const recording of recordings) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(recording.audioUri || recording.uri);
        if (fileInfo.exists && fileInfo.size > 0) {
          validRecordings.push(recording);
        } else {
          invalidRecordings.push(recording);
        }
      } catch (error) {
        invalidRecordings.push(recording);
      }
    }

    if (invalidRecordings.length > 0) {
      // Update storage with only valid recordings
      await AsyncStorage.setItem(STORAGE_KEYS.RECORDINGS, JSON.stringify(validRecordings.filter(r => !r.uploadedAt)));
      await AsyncStorage.setItem(STORAGE_KEYS.RECORDINGS_LIST, JSON.stringify(validRecordings.filter(r => r.uploadedAt)));
      
      console.log(`🧹 Removed ${invalidRecordings.length} invalid recording entries`);
    }

    return {
      success: true,
      validRecordings: validRecordings.length,
      invalidRecordings: invalidRecordings.length,
      removedEntries: invalidRecordings,
    };
  } catch (error) {
    console.error('Error cleaning invalid recordings:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enforce storage quota - remove oldest recordings if over limit
 */
export const enforceStorageQuota = async () => {
  try {
    const stats = await getStorageStats();
    
    if (!stats.isOverQuota) {
      console.log('✅ Storage within quota limits');
      return { success: true, action: 'none', stats };
    }

    console.log(`⚠️ Storage over quota: ${stats.totalRecordings} recordings, ${stats.totalSizeMB}MB`);
    
    const recordings = await getRecordingsFromStorage();
    
    // Sort by upload/creation time (oldest first)
    recordings.sort((a, b) => {
      const timeA = a.uploadedAt || a.createdAt || 0;
      const timeB = b.uploadedAt || b.createdAt || 0;
      return timeA - timeB;
    });

    const recordingsToDelete = [];
    let currentSize = stats.totalSizeBytes;
    let currentCount = recordings.length;

    // Remove recordings until we're under quota
    for (const recording of recordings) {
      if (currentSize <= STORAGE_CONFIG.MAX_STORAGE_SIZE_BYTES && 
          currentCount <= STORAGE_CONFIG.MAX_RECORDINGS) {
        break;
      }

      try {
        const fileInfo = await FileSystem.getInfoAsync(recording.audioUri || recording.uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(recording.audioUri || recording.uri);
          currentSize -= fileInfo.size || 0;
        }
        currentCount--;
        recordingsToDelete.push(recording);
      } catch (error) {
        console.warn(`Error deleting recording ${recording.id}:`, error);
      }
    }

    // Update storage
    const remainingRecordings = recordings.filter(r => !recordingsToDelete.find(d => d.id === r.id));
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDINGS, JSON.stringify(remainingRecordings.filter(r => !r.uploadedAt)));
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDINGS_LIST, JSON.stringify(remainingRecordings.filter(r => r.uploadedAt)));

    console.log(`🗑️ Deleted ${recordingsToDelete.length} old recordings to enforce quota`);

    return {
      success: true,
      action: 'deleted',
      deletedRecordings: recordingsToDelete.length,
      remainingRecordings: remainingRecordings.length,
      stats: await getStorageStats(),
    };
  } catch (error) {
    console.error('Error enforcing storage quota:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate recording duration and size
 */
export const validateRecording = async (uri, duration) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      return { valid: false, reason: 'File does not exist' };
    }

    if (fileInfo.size === 0) {
      return { valid: false, reason: 'File is empty' };
    }

    if (duration < STORAGE_CONFIG.MIN_RECORDING_DURATION_MS) {
      return { valid: false, reason: `Recording too short (min ${STORAGE_CONFIG.MIN_RECORDING_DURATION_MS / 1000}s)` };
    }

    if (duration > STORAGE_CONFIG.MAX_RECORDING_DURATION_MS) {
      return { valid: false, reason: `Recording too long (max ${STORAGE_CONFIG.MAX_RECORDING_DURATION_MS / 1000}s)` };
    }

    return { valid: true, fileInfo };
  } catch (error) {
    return { valid: false, reason: error.message };
  }
};

/**
 * Comprehensive storage maintenance - run all cleanup tasks
 */
export const performStorageMaintenance = async () => {
  try {
    console.log('🔧 Starting comprehensive storage maintenance...');
    
    const results = {
      cacheCleanup: await cleanupCacheFiles(),
      invalidRecordings: await cleanupInvalidRecordings(),
      quotaEnforcement: await enforceStorageQuota(),
      finalStats: await getStorageStats(),
    };

    console.log('✅ Storage maintenance complete:', results);
    
    return {
      success: true,
      results,
      summary: {
        deletedCacheFiles: results.cacheCleanup.deletedFiles || 0,
        removedInvalidEntries: results.invalidRecordings.invalidRecordings || 0,
        deletedForQuota: results.quotaEnforcement.deletedRecordings || 0,
        finalStorageSize: results.finalStats.totalSizeMB,
        finalRecordingCount: results.finalStats.totalRecordings,
      }
    };
  } catch (error) {
    console.error('Storage maintenance failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Move file from cache to permanent storage
 */
export const moveToDocumentDirectory = async (cacheUri, newFileName) => {
  try {
    const documentDirectory = FileSystem.documentDirectory;
    if (!documentDirectory) {
      throw new Error('Document directory not available');
    }

    const newUri = `${documentDirectory}${newFileName}`;
    
    // Copy file from cache to documents
    await FileSystem.copyAsync({
      from: cacheUri,
      to: newUri
    });

    // Verify the copy was successful
    const fileInfo = await FileSystem.getInfoAsync(newUri);
    if (!fileInfo.exists || fileInfo.size === 0) {
      throw new Error('File copy verification failed');
    }

    // Delete original cache file
    try {
      await FileSystem.deleteAsync(cacheUri);
    } catch (deleteError) {
      console.warn('Could not delete original cache file:', deleteError);
    }

    return { success: true, newUri, fileInfo };
  } catch (error) {
    console.error('Error moving file to document directory:', error);
    return { success: false, error: error.message };
  }
};
