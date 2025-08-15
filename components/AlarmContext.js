// components/AlarmContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

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
        if (savedAlarms) setAlarms(JSON.parse(savedAlarms));
        if (savedRecordings) setRecordings(JSON.parse(savedRecordings));
      } catch (e) {
        console.log('Error loading data:', e);
      }
    })();
  }, []);

  // Persist alarms
  useEffect(() => {
    AsyncStorage.setItem('alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Persist recordings
  useEffect(() => {
    AsyncStorage.setItem('recordings', JSON.stringify(recordings));
  }, [recordings]);

  // Schedule local notification
  const scheduleAlarmNotification = async (alarm) => {
    // You can convert alarm.hour/minute/ampm/days into a Date here if needed
    const triggerDate = new Date(); // placeholder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Alarm',
        body: `${alarm.hour}:${alarm.minute} ${alarm.ampm}`,
        data: { alarmId: alarm.id, audioUri: alarm.audioUri },
      },
      trigger: triggerDate,
    });
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
        deleteAlarm,
        updateAlarm,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
};
