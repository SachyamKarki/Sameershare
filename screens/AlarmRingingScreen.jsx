import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Vibration, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function AlarmRingingScreen({ route, navigation }) {
  const { alarmId, audioUri } = route?.params ?? {};

  const [currentTime, setCurrentTime] = useState(new Date());
  const [errorText, setErrorText] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const soundRef = useRef(null);
  const isMountedRef = useRef(true);
  const timeIntervalRef = useRef(null);

  const startShaking = useCallback(() => {
    const loop = () => {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start(() => {
        if (isMountedRef.current) setTimeout(loop, 1500);
      });
    };
    loop();
  }, [shakeAnim]);

  const startPulsing = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const fadeInNow = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const startVibration = useCallback(() => {
    Vibration.vibrate([0, 400, 200, 400, 200, 800], true);
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const ensureAndroidChannel = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('alarm', {
          name: 'Alarms',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 300, 200, 300],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          enableVibrate: true,
          enableLights: true,
        });
      } catch (e) {
        console.warn('Failed to set Android channel', e);
      }
    }
  }, []);

  const showLockScreenNotification = useCallback(async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Alarm Ringing',
          body: `Alarm at ${formatTime(new Date())}`,
          data: { alarmId, audioUri },
          sound: false,
          priority: Notifications.AndroidNotificationPriority.MAX,
          sticky: true,
        },
        trigger: null,
      });
    } catch (e) {
      console.warn('Failed to show notification', e);
    }
  }, [alarmId, audioUri]);

  const playAlarmSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
        shouldDuckAndroid: false,
      });

      if (!audioUri) {
        setErrorText('No alarm audio provided.');
        return;
      }

      const src = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: src },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );

      soundRef.current = sound;

      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
      }
    } catch (e) {
      setErrorText('Could not start alarm sound.');
      console.error('Audio start error', e);
    }
  }, [audioUri]);

  const stopAlarmAudio = useCallback(async () => {
    Vibration.cancel();
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    await Notifications.dismissAllNotificationsAsync().catch(() => {});
  }, []);

  const stopAlarm = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    await stopAlarmAudio();
    if (isMountedRef.current) {
      navigation.navigate('Home');
    }
  }, [stopAlarmAudio, navigation, isProcessing]);

  // Fixed Snooze — schedules new alarm notification after 1 minute
  const snoozeAlarm = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    await stopAlarmAudio();

    const snoozeMinutes = 1;
    const snoozeTime = new Date(Date.now() + snoozeMinutes * 60 * 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Alarm (Snoozed)',
        body: `Your alarm will ring again in ${snoozeMinutes} minute.`,
        categoryIdentifier: 'alarmActions',
        data: { alarmId, audioUri, isSnooze: true },
        sound: false,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: snoozeTime,
    });

    if (isMountedRef.current) {
      navigation.navigate('Home');
    }
  }, [stopAlarmAudio, alarmId, audioUri, navigation, isProcessing]);

  const initializeAlarm = useCallback(async () => {
    if (global.setAlarmRingingScreenActive) {
      global.setAlarmRingingScreenActive(true);
    }

    fadeInNow();
    await ensureAndroidChannel();
    await showLockScreenNotification();
    startShaking();
    startPulsing();
    startVibration();

    setTimeout(async () => {
      await playAlarmSound();
    }, 100);
  }, [
    fadeInNow,
    ensureAndroidChannel,
    showLockScreenNotification,
    startShaking,
    startPulsing,
    startVibration,
    playAlarmSound,
  ]);

  const cleanup = useCallback(async () => {
    if (global.setAlarmRingingScreenActive) {
      global.setAlarmRingingScreenActive(false);
    }
    await stopAlarmAudio();
  }, [stopAlarmAudio]);

  useEffect(() => {
    isMountedRef.current = true;

    timeIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) setCurrentTime(new Date());
    }, 1000);

    initializeAlarm();

    return () => {
      isMountedRef.current = false;
      clearInterval(timeIntervalRef.current);
      cleanup();
    };
  }, [initializeAlarm, cleanup]);

  return (
    <Animated.View style={[styles.absoluteFill, { opacity: fadeAnim }]}>
      <BlurView intensity={100} tint="dark" style={styles.absoluteFill} />
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ translateX: shakeAnim }, { scale: pulseAnim }] },
          ]}
        >
          <Ionicons name="alarm" size={110} color="white" />
        </Animated.View>

        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        </View>

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.snoozeButton, isProcessing && styles.disabledButton]}
            onPress={snoozeAlarm}
            activeOpacity={0.9}
            disabled={isProcessing}
          >
            <Ionicons name="bed" size={28} color="#fff" />
            <Text style={styles.buttonText}>Snooze</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.stopButton, isProcessing && styles.disabledButton]}
            onPress={stopAlarm}
            activeOpacity={0.9}
            disabled={isProcessing}
          >
            <FontAwesome5 name="walking" size={26} color="#fff" />
            <Text style={styles.buttonText}>Wake Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          {isProcessing ? 'Processing...' : 'Tap to control alarm'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absoluteFill: { ...StyleSheet.absoluteFillObject },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  iconContainer: { marginBottom: 40 },
  timeContainer: { alignItems: 'center', marginBottom: 30 },
  timeText: { fontSize: 70, fontWeight: '200', color: '#fff' },
  errorText: { marginBottom: 10, color: '#ff8080', fontSize: 14, textAlign: 'center' },
  buttonContainer: { width: '100%', alignItems: 'center', gap: 20 },
  button: {
    width: '80%',
    paddingVertical: 20,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  snoozeButton: { backgroundColor: '#ff9500' },
  stopButton: { backgroundColor: '#ff3b30' },
  disabledButton: { opacity: 0.6 },
  buttonText: { fontSize: 20, fontWeight: '600', color: '#fff', marginLeft: 10 },
  helpText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 30 },
});
