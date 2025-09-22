// components/AlarmContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import NotificationService from '../services/NotificationService';
import NativeAlarmService from '../services/NativeAlarmService';
import { recordingOperations, alarmOperations, initializeDatabase } from '../utils/databaseManager';
import MigrationService from '../services/MigrationService';

export const AlarmContext = createContext();
export const useAlarm = () => useContext(AlarmContext);

export const AlarmProvider = ({ children }) => {
  const [alarms, setAlarms] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [isRecordingActive, setIsRecordingActive] = useState(false);


  useEffect(() => {
    const initializeAndLoad = async () => {
      try {
        console.log('🗄️ Initializing database and loading data...');
        
        // Initialize database
        const dbInit = await initializeDatabase();
        if (!dbInit.success) {
          console.error('Database initialization failed:', dbInit.error);
          return;
        }

        // Check and perform migration if needed
        const migrationStatus = await MigrationService.checkMigrationStatus();
        if (!migrationStatus?.completed) {
          console.log('🔄 Performing data migration...');
          const migrationResult = await MigrationService.performMigration();
          if (!migrationResult.success && !migrationResult.alreadyMigrated) {
            console.error('Migration failed:', migrationResult.error);
            // Fall back to empty state
            setAlarms([]);
            setRecordings([]);
            return;
          }
        }

        // Load data from SQLite
        const [alarmsData, recordingsData] = await Promise.all([
          alarmOperations.getAll(),
          recordingOperations.getAll()
        ]);

        setAlarms(alarmsData);
        setRecordings(recordingsData);
        
        console.log(`✅ Data loaded from SQLite: ${alarmsData.length} alarms, ${recordingsData.length} recordings`);
      } catch (error) {
        console.error('Error loading data from database:', error);
        // Fallback to empty state
        setAlarms([]);
        setRecordings([]);
      }
    };

    initializeAndLoad();
  }, []);

  // Note: SQLite persistence is handled automatically by operations
  // No need for useEffect-based persistence like AsyncStorage

  // NATIVE-ONLY alarm scheduling - 100% Java responsibility  
  const scheduleAlarmNotification = async (alarm) => {
    try {
      console.log('🚨 NATIVE-ONLY SCHEDULING: 100% Java responsibility - NO Expo notifications');
      
      // COMPLETELY bypass NotificationService and use ONLY native scheduling
      const result = await NativeAlarmService.scheduleNativeAlarmsForDays({
        alarmId: alarm.id,
        audioUri: alarm.audioUri || '',
        days: alarm.days || [new Date().getDay()],
        time: {
          hour: alarm.hour,
          minute: alarm.minute,
          ampm: alarm.ampm,
        },
      });

      if (result && result.success) {
        console.log('✅ NATIVE-ONLY alarm scheduled - Java handles ALL notifications');
        // Store ONLY native IDs - completely eliminate Expo notifications
        alarm.enhancedIds = {
          expoIds: [], // ALWAYS empty - zero Expo notifications
          nativeIds: result.alarmIds || [],
        };
        return true;
      } else {
        console.error('❌ Failed to schedule native alarm - NO fallback to Expo');
        alarm.enhancedIds = { expoIds: [], nativeIds: [] };
        return false;
      }
    } catch (error) {
      console.error('Error scheduling native alarm:', error);
      return false;
    }
  };

  const cancelNativeAlarmsForAlarm = async (alarm) => {
    try {
      const days = Array.isArray(alarm.days) && alarm.days.length > 0
        ? alarm.days
        : [new Date().getDay()];

      const nativeIds = days.map((day) => `${alarm.id}-${day}`);
      await NativeAlarmService.cancelMultipleNativeAlarms(nativeIds);
      return true;
    } catch (error) {
      console.error('Error canceling native alarms for alarm:', error);
      return false;
    }
  };

  // Add alarm and optionally a recording (original flow)
  const addAlarmAndRecording = async (alarm, recording) => {
    try {
      // Add recording to database (only if recording is provided)
      if (recording) {
        const exists = recordings.some((r) => r.id === recording.id);
        if (!exists) {
          await recordingOperations.add(recording);
          setRecordings((prev) => [...prev, recording]);
        }
      }
      // Add alarm to database
      const newAlarm = { ...alarm, enabled: true };
      await alarmOperations.add(newAlarm);
      setAlarms((prev) => [...prev, newAlarm]);
      
      scheduleAlarmNotification(newAlarm);
    } catch (error) {
      console.error('Error adding alarm and recording:', error);
    }
  };

  // Add recording only
  const addRecordingOnly = async (recording, retryCount = 0) => {
    try {
      const exists = recordings.some((r) => r.id === recording.id);
      if (!exists) {
        await recordingOperations.add(recording);
        setRecordings((prev) => [...prev, recording]);
        console.log('✅ Recording added successfully:', recording.id);
      } else {
        console.log('📝 Recording already exists:', recording.id);
      }
    } catch (error) {
      console.error('Error adding recording:', error);
      
      // Retry mechanism for database connection issues
      if (retryCount < 3 && (error.message.includes('NullPointerException') || error.message.includes('database'))) {
        console.log(`🔄 Retrying recording addition (attempt ${retryCount + 1}/3)...`);
        
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to reinitialize database if needed
        try {
          await initializeDatabase();
        } catch (initError) {
          console.error('Database reinitialization failed:', initError);
        }
        
        return addRecordingOnly(recording, retryCount + 1);
      }
      
      // If all retries failed, add to local state only
      if (!recordings.some((r) => r.id === recording.id)) {
        console.log('⚠️ Database failed, adding to local state only');
        setRecordings((prev) => [...prev, recording]);
      }
    }
  };

  // Add recording (alias for consistency with RecordingScreen)
  const addRecording = (recording) => {
    addRecordingOnly(recording);
  };

  // Delete recording
  const deleteRecording = async (recordingId) => {
    try {
      // Delete from database
      await recordingOperations.delete(recordingId);
      setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
      
      // Also delete any alarms that use this recording
      const relatedAlarms = alarms.filter((a) => a.recordingId === recordingId);
      for (const alarm of relatedAlarms) {
        await alarmOperations.delete(alarm.id);
      }
      setAlarms((prev) => prev.filter((a) => a.recordingId !== recordingId));
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  };

  // Delete alarm
  const deleteAlarm = async (alarmId) => {
    try {
      await alarmOperations.delete(alarmId);
      setAlarms((prev) => prev.filter((a) => a.id !== alarmId));
    } catch (error) {
      console.error('Error deleting alarm:', error);
    }
  };

  // Toggle or update alarm
  const updateAlarm = async (alarmId, updates) => {
    try {
      await alarmOperations.update(alarmId, updates);
      setAlarms((prev) => prev.map((a) => (a.id === alarmId ? { ...a, ...updates } : a)));

      // Handle native scheduling when toggling enabled state
      if (Object.prototype.hasOwnProperty.call(updates, 'enabled')) {
        const alarm = (alarms.find((a) => a.id === alarmId) || {});
        const merged = { ...alarm, ...updates };

        if (updates.enabled === false) {
          await cancelNativeAlarmsForAlarm(merged);
        } else if (updates.enabled === true) {
          await scheduleAlarmNotification(merged);
        }
      }
    } catch (error) {
      console.error('Error updating alarm:', error);
    }
  };

  // Update recording
  const updateRecording = async (recordingId, updates) => {
    try {
      await recordingOperations.update(recordingId, updates);
      setRecordings((prev) =>
        prev.map((r) => (r.id === recordingId ? { ...r, ...updates } : r))
      );
    } catch (error) {
      console.error('Error updating recording:', error);
    }
  };

  // Recording state management
  const setRecordingState = (isActive) => {
    setIsRecordingActive(isActive);
  };

  return (
    <AlarmContext.Provider
      value={{
        alarms,
        recordings,
        isRecordingActive,
        addAlarmAndRecording,
        addRecordingOnly,
        addRecording,
        deleteRecording,
        deleteAlarm,
        updateAlarm,
        updateRecording,
        setRecordingState,
        // Expose for advanced flows if needed
        scheduleAlarmNotification,
        cancelNativeAlarmsForAlarm,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
};
