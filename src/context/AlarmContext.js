// components/AlarmContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import NotificationService from '../services/NotificationService';
import NativeAlarmService from '../services/NativeAlarmService';

export const AlarmContext = createContext();
export const useAlarm = () => useContext(AlarmContext);

export const AlarmProvider = ({ children }) => {
  const [alarms, setAlarms] = useState([]);
  const [recordings, setRecordings] = useState([]);

  // Load alarms & recordings from storage
  useEffect(() => {
    (async () => {
      try {
        const savedAlarms = await AsyncStorage.getItem('alarms');
        const savedRecordings = await AsyncStorage.getItem('recordings');
        
        if (savedAlarms) {
          try {
            const parsedAlarms = JSON.parse(savedAlarms);
            setAlarms(Array.isArray(parsedAlarms) ? parsedAlarms : []);
          } catch (parseError) {
            console.log('Error parsing alarms, clearing corrupted data:', parseError);
            await AsyncStorage.removeItem('alarms');
            setAlarms([]);
          }
        }
        
        if (savedRecordings) {
          try {
            const parsedRecordings = JSON.parse(savedRecordings);
            setRecordings(Array.isArray(parsedRecordings) ? parsedRecordings : []);
          } catch (parseError) {
            console.log('Error parsing recordings, clearing corrupted data:', parseError);
            await AsyncStorage.removeItem('recordings');
            setRecordings([]);
          }
        }
      } catch (e) {
        console.log('Error loading data:', e);
        // Clear all data if there's an error
        try {
          await AsyncStorage.clear();
        } catch (clearError) {
          console.log('Error clearing storage:', clearError);
        }
      }
    })();
  }, []);

  // Persist alarms
  useEffect(() => {
    if (alarms.length === 0) return; // Don't save empty array on initial load
    try {
      AsyncStorage.setItem('alarms', JSON.stringify(alarms));
    } catch (error) {
      console.log('Error saving alarms:', error);
    }
  }, [alarms]);

  // Persist recordings
  useEffect(() => {
    if (recordings.length === 0) return; // Don't save empty array on initial load
    try {
      AsyncStorage.setItem('recordings', JSON.stringify(recordings));
    } catch (error) {
      console.log('Error saving recordings:', error);
    }
  }, [recordings]);

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

  // Add alarm and recording
  const addAlarmAndRecording = (alarm, recording) => {
    setAlarms((prev) => [...prev, { ...alarm, enabled: true }]);
    setRecordings((prev) => {
      const exists = prev.some((r) => r.id === recording.id);
      return exists ? prev : [...prev, recording];
    });
    scheduleAlarmNotification(alarm);
  };

  // Add recording only
  const addRecordingOnly = (recording) => {
    setRecordings((prev) => {
      const exists = prev.some((r) => r.id === recording.id);
      return exists ? prev : [...prev, recording];
    });
  };

  // Add recording (alias for consistency with RecordingScreen)
  const addRecording = (recording) => {
    addRecordingOnly(recording);
  };

  // Delete recording
  const deleteRecording = (recordingId) => {
    setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
    // Also delete any alarms that use this recording
    setAlarms((prev) => prev.filter((a) => a.recordingId !== recordingId));
  };

  // Delete alarm
  const deleteAlarm = (alarmId) => {
    setAlarms((prev) => prev.filter((a) => a.id !== alarmId));
  };

  // Toggle or update alarm
  const updateAlarm = (alarmId, updates) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === alarmId ? { ...a, ...updates } : a))
    );
  };

  return (
    <AlarmContext.Provider
      value={{
        alarms,
        recordings,
        addAlarmAndRecording,
        addRecordingOnly,
        addRecording,
        deleteRecording,
        deleteAlarm,
        updateAlarm,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
};
