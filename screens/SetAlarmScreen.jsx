import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Picker } from 'react-native-wheel-pick';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import * as Notifications from 'expo-notifications';

import DaysSelector from '../components/DaysSelector';
import { useAlarm } from '../components/AlarmContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SetAlarmScreen({ navigation, route }) {
  const { addAlarmAndRecording, addRecordingOnly } = useAlarm();

  const audioUri = route.params?.audioUri || null;
  const recordingIdFromRecorder = route.params?.recordingId || uuidv4();

  const baseHours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const baseMinutes = Array.from({ length: 60 }, (_, i) =>
    i < 10 ? `0${i}` : `${i}`
  );
  const baseAmPm = ['AM', 'PM'];

  const defaultHourIndex = 10;
  const defaultMinuteIndex = 11;
  const defaultAmPmIndex = 1;

  const [selectedHour, setSelectedHour] = useState(baseHours[defaultHourIndex]);
  const [selectedMinute, setSelectedMinute] = useState(
    baseMinutes[defaultMinuteIndex]
  );
  const [selectedAmPm, setSelectedAmPm] = useState(baseAmPm[defaultAmPmIndex]);
  const [selectedDays, setSelectedDays] = useState([]);

  useEffect(() => {
    setSelectedHour(baseHours[defaultHourIndex]);
    setSelectedMinute(baseMinutes[defaultMinuteIndex]);
    setSelectedAmPm(baseAmPm[defaultAmPmIndex]);
  }, []);

  const to24h = (hourStr, minuteStr, ampm) => {
    let h = parseInt(hourStr, 10);
    let m = parseInt(minuteStr, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { hour: h, minute: m };
  };

  const fmtTimeLabel = (h12, mStr, ampm) => `${h12}:${mStr} ${ampm}`;

  const nextDateForDayAtTime = (dayName, hour24, minute) => {
    const now = new Date();
    const targetDow = DAYS.indexOf(dayName);
    const todayDow = now.getDay();

    let deltaDays = (targetDow - todayDow + 7) % 7;

    const candidate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour24,
      minute,
      0,
      0
    );

    if (deltaDays === 0 && candidate <= now) {
      deltaDays = 7;
    }

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + deltaDays,
      hour24,
      minute,
      0,
      0
    );
  };

  const scheduleAlarmsForDays = async ({
    hour24,
    minute,
    alarmId,
    audioUri,
    displayHour,
    displayMinute,
    displayAmPm,
    days,
  }) => {
    const ids = [];
    const timeLabel = fmtTimeLabel(displayHour, displayMinute, displayAmPm);

    for (const d of days) {
      const fireDate = nextDateForDayAtTime(d, hour24, minute);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Alarm - ${timeLabel}`,
          body: `It's ${timeLabel}. Tap to stop or snooze.`,
          categoryIdentifier: 'alarmActions',
          data: {
            alarmId,
            audioUri,
            repeatWeekly: true,
            day: d,
            hour24,
            minute,
            scheduledFor: fireDate.getTime(),
          },
        },
        trigger: fireDate,
      });

      ids.push(id);
    }

    return ids;
  };

  // NEW: Snooze scheduling
  const scheduleSnoozeNotification = async (alarmId, audioUri, snoozeMinutes = 5) => {
    const now = new Date();
    const snoozeTime = new Date(now.getTime() + snoozeMinutes * 60 * 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Alarm (Snoozed)',
        body: `Your alarm will ring in ${snoozeMinutes} minutes.`,
        categoryIdentifier: 'alarmActions',
        data: { alarmId, audioUri, isSnooze: true },
      },
      trigger: snoozeTime,
    });
  };

  const saveAlarm = async () => {
    if (!audioUri) {
      Alert.alert('No recording found', 'Please record audio before setting an alarm.');
      return;
    }

    const daysToUse = selectedDays.length ? selectedDays : DAYS;
    const sortedDays = [...daysToUse].sort(
      (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
    );

    const alarmId = uuidv4();

    const alarm = {
      id: alarmId,
      hour: parseInt(selectedHour, 10),
      minute: parseInt(selectedMinute, 10),
      ampm: selectedAmPm,
      days: sortedDays,
      audioUri,
      recordingId: recordingIdFromRecorder,
    };

    const recording = {
      id: recordingIdFromRecorder,
      audioUri,
      linkedAlarmId: alarmId,
    };

    addAlarmAndRecording(alarm, recording);

    const { hour: hour24, minute } = to24h(selectedHour, selectedMinute, selectedAmPm);
    await scheduleAlarmsForDays({
      hour24,
      minute,
      alarmId,
      audioUri,
      displayHour: selectedHour,
      displayMinute: selectedMinute,
      displayAmPm: selectedAmPm,
      days: sortedDays,
    });

    Alert.alert(
      'Alarm saved!',
      `${selectedHour}:${selectedMinute} ${selectedAmPm}\n${sortedDays.join(', ')}`
    );

    navigation.goBack();
  };

  const deleteAlarm = () => {
    if (!audioUri) {
      Alert.alert('No audio to save', 'Nothing will be stored.');
      navigation.goBack();
      return;
    }

    const recording = { id: uuidv4(), audioUri };
    addRecordingOnly(recording);

    Alert.alert('Recording saved', 'Audio stored without creating an alarm.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.heading}>SET ALARM</Text>

      <View style={styles.container}>
        <View style={styles.headersRow}>
          <Text style={styles.headerText}>Hr</Text>
          <Text style={styles.headerText}>Min</Text>
          <Text style={styles.headerText}></Text>
        </View>

        <View style={styles.wheelsRow}>
          <View style={styles.wheelColumn}>
            <View style={styles.wheelWrapper}>
              <Picker
                style={styles.picker}
                pickerData={baseHours}
                selectedValue={selectedHour}
                selectedIndex={baseHours.indexOf(selectedHour)}
                onValueChange={setSelectedHour}
                isCyclic={false}
                itemSpace={40}
                textColor="#ccc"
                selectedItemTextColor="#FFA500"
                selectedItemTextSize={36}
                itemTextColor="#777"
                itemTextSize={22}
              />
            </View>
          </View>

          <View style={styles.wheelColumn}>
            <View style={styles.wheelWrapper}>
              <Picker
                style={styles.picker}
                pickerData={baseMinutes}
                selectedValue={selectedMinute}
                selectedIndex={baseMinutes.indexOf(selectedMinute)}
                onValueChange={setSelectedMinute}
                isCyclic={false}
                itemSpace={40}
                textColor="#ccc"
                selectedItemTextColor="#FFA500"
                selectedItemTextSize={36}
                itemTextColor="#777"
                itemTextSize={22}
              />
            </View>
          </View>

          <View style={styles.wheelColumn}>
            <View style={styles.wheelWrapper}>
              <Picker
                style={styles.picker}
                pickerData={baseAmPm}
                selectedValue={selectedAmPm}
                selectedIndex={baseAmPm.indexOf(selectedAmPm)}
                onValueChange={setSelectedAmPm}
                isCyclic={false}
                itemSpace={40}
                textColor="#ccc"
                selectedItemTextColor="#FFA500"
                selectedItemTextSize={36}
                itemTextColor="#777"
                itemTextSize={22}
              />
            </View>
          </View>
        </View>

        <View style={styles.daysSelectorContainer}>
          <DaysSelector selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
        </View>
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          onPress={saveAlarm}
          style={styles.saveButton}
          activeOpacity={0.8}
        >
          <Ionicons name="save-outline" size={36} color="#228B22" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={deleteAlarm}
          style={styles.deleteButton}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={36} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 26,
  },
  heading: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'left',
    width: '100%',
    paddingHorizontal: 25,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  headersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerText: {
    color: '#FFA500',
    fontSize: 20,
    fontWeight: '400',
    width: 100,
    textAlign: 'center',
  },
  wheelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'black',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    height: 140,
    paddingHorizontal: 12,
  },
  wheelColumn: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelWrapper: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    justifyContent: 'center',
    height: 170,
  },
  picker: {
    width: 100,
    height: 170,
    backgroundColor: 'black',
    borderRadius: 12,
  },
  daysSelectorContainer: {
    width: '100%',
    height: '80%',
    marginBottom: 100,
    marginTop: 70,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 120,
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 24,
    borderRadius: 180,
  },
  deleteButton: {
    backgroundColor: 'rgba(255,0,0,0.6)',
    padding: 24,
    borderRadius: 80,
  },
});
