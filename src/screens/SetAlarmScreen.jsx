import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Alert,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from "react-i18next";

import { 
  DaysSelector,
  BackgroundComponent,
  TimePickerComponent,
  EnhancedButtonsComponent,
  StatusBarComponent
} from '../components';
import { useAlarm, useTheme } from '../context';
import { DAYS, UI_CONSTANTS } from '../constants/app';
import { getCurrentTime, formatLocalizedTime } from '../utils/time';
import NativeAlarmService from '../services/NativeAlarmService';

export default function SetAlarmScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { addAlarmAndRecording } = useAlarm();
  const { colors, darkMode } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wheelGlowAnim = useRef(new Animated.Value(0)).current;

  const selectedAudio = route?.params?.selectedAudio;
  const selectedRecordingId = route?.params?.recordingId;
  const isDefaultAudio = route?.params?.isDefaultAudio || false;
  const audioValidation = route?.params?.audioValidation;
  const defaultAlarmSound = 'default_alarm_sound';

  // FIXED: Log navigation params for debugging
  console.log('🎯 SetAlarmScreen received params:', {
    selectedAudio,
    selectedRecordingId,
    isDefaultAudio,
    audioValidation,
  });

  const currentTime = getCurrentTime();
  const [selectedHour, setSelectedHour] = useState(currentTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(currentTime.minute);
  const [selectedAmPm, setSelectedAmPm] = useState(currentTime.ampm);
  const [selectedDays, setSelectedDays] = useState([]);

  // Animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(wheelGlowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(wheelGlowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    );

    pulseLoop.start();
    glowLoop.start();

    return () => {
      pulseAnim.stopAnimation();
      wheelGlowAnim.stopAnimation();
    };
  }, []);

  // Save alarm
  const saveAlarm = async () => {
    try {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      // FIXED: Enhanced audio handling with validation
      let audioUri;
      let useCustomRecording = false;
      
      if (isDefaultAudio || selectedAudio === 'default_alarm_sound') {
        // User selected default audio - use LFG default audio
        audioUri = 'default_alarm_sound';
        useCustomRecording = false;
        console.log('🎵 Setting alarm with LFG default audio');
      } else if (selectedAudio && selectedAudio !== 'default_alarm_sound') {
        // FIXED: Validate custom audio before using it
        if (audioValidation && !audioValidation.valid) {
          throw new Error(`Invalid audio file: ${audioValidation.error}`);
        }
        
        // User selected recorded audio
        audioUri = selectedAudio;
        useCustomRecording = true;
        console.log('🎵 Setting alarm with validated custom audio:', selectedAudio);
      } else {
        // FIXED: Better fallback handling
        console.warn('⚠️ No valid audio provided, using LFG default');
        audioUri = 'default_alarm_sound';
        useCustomRecording = false;
        console.log('🎵 Setting alarm with LFG default audio (fallback)');
      }

      const daysToUse = selectedDays.length ? selectedDays : DAYS;
      const sortedDays = [...daysToUse].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
      const translatedDays = sortedDays.map(dayKey => t(`days.${dayKey}`)).join(', ');

      const alarmId = uuidv4();
      const recordingId = selectedRecordingId || uuidv4();

      const alarm = {
        id: alarmId,
        hour: parseInt(selectedHour, 10),
        minute: parseInt(selectedMinute, 10),
        ampm: selectedAmPm,
        days: sortedDays,
        audioUri,
        recordingId,
      };

      const recordingName = route?.params?.recordingName || t('alarm.defaultSoundName');
      
      // Create recording object based on audio type
      const recording = useCustomRecording ? {
        // For recorded audio - use the actual recording data
        id: selectedRecordingId || recordingId,
        audioUri,
        linkedAlarmId: alarmId,
        name: recordingName,
        isDefault: false,
        duration: 0, // Will be updated if available
        uploadedAt: Date.now(),
      } : {
        // For default audio - create a default recording entry
        id: recordingId,
        audioUri: 'default_alarm_sound', // Use consistent identifier
        linkedAlarmId: alarmId,
        name: t('alarm.defaultSoundName'),
        isDefault: true,
        duration: 30000, // Default 30 seconds
        uploadedAt: 0, // Keep at top
      };

      addAlarmAndRecording(alarm, recording);

      // Schedule native alarms
      await NativeAlarmService.scheduleNativeAlarmsForDays({
        alarmId,
        audioUri,
        days: sortedDays,
        time: { hour: selectedHour, minute: selectedMinute, ampm: selectedAmPm },
      });

      Alert.alert(
        t('alarm.savedTitle'),
        t('alarm.savedMessage', {
          time: formatLocalizedTime(selectedHour, selectedMinute, selectedAmPm, t),
          days: translatedDays,
        }),
        [{ text: t('common.ok'), style: 'default' }]
      );

      navigation.goBack();
    } catch (error) {
      console.error('Error saving alarm:', error);
      Alert.alert(
        t('common.error'),
        t('alarm.saveError'),
        [{ text: t('common.ok'), style: 'default' }]
      );
    }
  };

  const cancelAlarm = () => navigation.goBack();

  return (
    <BackgroundComponent>
      {/* Status Bar */}
      <StatusBarComponent
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={false}
        hidden={false}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        
        <Animated.View
          style={[
            styles.headerContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={[styles.heading, { color: colors.text }]}>
            {t('alarm.setHeader')}
          </Text>
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TimePickerComponent
            selectedHour={selectedHour}
            selectedMinute={selectedMinute}
            selectedAmPm={selectedAmPm}
            onHourChange={setSelectedHour}
            onMinuteChange={setSelectedMinute}
            onAmPmChange={setSelectedAmPm}
            UI_CONSTANTS={UI_CONSTANTS}
          />

          <View style={styles.daysSelectorContainer}>
            <DaysSelector
              selectedDays={selectedDays}
              onDaysChange={setSelectedDays}
              translateDay={t}
            />
          </View>
        </Animated.View>

        <EnhancedButtonsComponent
          onSave={saveAlarm}
          onDelete={cancelAlarm}
          saveDisabled={false}
          deleteDisabled={false}
          saveText={t('common.save')}
          deleteText={t('common.cancel')}
        />
        
      </SafeAreaView>
    </BackgroundComponent>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent',paddingHorizontal:20},
  headerContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 1,
  },
  heading: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'left',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  contentContainer: {
    flex: 0.8,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  daysSelectorContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
});
