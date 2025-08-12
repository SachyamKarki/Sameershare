import React, { createContext, useContext, useState } from 'react';

const AlarmContext = createContext();
export const useAlarm = () => useContext(AlarmContext);

export const AlarmProvider = ({ children }) => {
  const [alarms, setAlarms] = useState([]);
  const [recordings, setRecordings] = useState([]);

  const addAlarmAndRecording = (alarm, recording) => {
    setAlarms((prev) => [...prev, alarm]);
    setRecordings((prev) => [...prev, recording]);
  };

  const addRecordingOnly = (recording) => {
    setRecordings((prev) => [...prev, recording]);
  };

  const deleteAlarm = (alarmId) => {
    setAlarms((prev) => prev.filter((a) => a.id !== alarmId));
  };

  const deleteRecording = (recordingId) => {
    setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
    setAlarms((prev) => prev.filter((a) => a.recordingId !== recordingId));
  };

  return (
    <AlarmContext.Provider
      value={{
        alarms,
        recordings,
        addAlarmAndRecording,
        addRecordingOnly,
        deleteAlarm,
        deleteRecording, // ✅ Added here
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
};
