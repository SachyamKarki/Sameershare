import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import NativeAlarmService from '../services/NativeAlarmService';
import { Toast, BackgroundComponent } from '../components';

const { width, height } = Dimensions.get('window');

const AlarmRingingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { alarmId, alarmTime, audioPath, isBlocking = false } = route.params || {};

  // Animated values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Prevent back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent going back
    });

    // Start animations
    startAnimations();

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      backHandler.remove();
      clearInterval(timeInterval);
    };
  }, []);

  const startAnimations = () => {
    // Fade in screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Slide up content
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Start pulsing animation
    startPulseAnimation();

    // Start rotation animation
    startRotationAnimation();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startRotationAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleStop = async () => {
    try {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Stop the alarm
      await NativeAlarmService.stopCurrentAlarm();
      
      // Navigate back after animation
      setTimeout(() => {
        if (isBlocking) {
          // If this was a blocking alarm, reset navigation to main screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          navigation.goBack();
        }
      }, 300);
    } catch (error) {
      console.error('Failed to stop alarm:', error);
      if (isBlocking) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        navigation.goBack();
      }
    }
  };

  const handleSnooze = async () => {
    try {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Stop current alarm
      await NativeAlarmService.stopCurrentAlarm();

      // Custom snooze sequence: 5,5,5,10,3,3,3,4,4,4,2,3,4,5,6 (minutes)
      // Persist count per base alarm id
      const baseAlarmId = (alarmId || 'default').split('_snooze')[0];
      let currentCount = 0;
      try {
        const stored = global.__SNOOZE_COUNT__?.[baseAlarmId];
        currentCount = typeof stored === 'number' ? stored : 0;
      } catch {}
      const sequence = [5,5,5,10,3,3,3,4,4,4,2,3,4,5,6];
      const index = Math.min(currentCount, sequence.length - 1);
      const delayMinutes = sequence[index];
      global.__SNOOZE_COUNT__ = global.__SNOOZE_COUNT__ || {};
      global.__SNOOZE_COUNT__[baseAlarmId] = currentCount + 1;

      const snoozeTime = new Date(Date.now() + delayMinutes * 60 * 1000);
      const snoozeAlarmId = `${alarmId}_snooze_${Date.now()}`;
      
      await NativeAlarmService.scheduleNativeAlarm({
        alarmId: snoozeAlarmId,
        fireDate: snoozeTime.getTime(),
        audioPath: audioPath,
        alarmTime: 'Snooze Alarm',
      });

      // Show confirmation toast
      Toast.success('😴 Snoozed', `Alarm will ring again in ${delayMinutes} minutes`);

      // Navigate back after animation  
      setTimeout(() => {
        if (isBlocking) {
          // If this was a blocking alarm, reset navigation to main screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          navigation.goBack();
        }
      }, 300);
    } catch (error) {
      console.error('Failed to snooze alarm:', error);
      if (isBlocking) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        navigation.goBack();
      }
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <BackgroundComponent>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Main Content */}
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Alarm Icon with Pulse Animation */}
        <Animated.View
          style={{
            marginBottom: 40,
            transform: [{ scale: pulseAnim }],
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255,255,255,0.08)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <Ionicons name="alarm" size={60} color="#F59E0B" />
          </View>
        </Animated.View>

        {/* Current Time */}
        <Text
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          {formatTime(currentTime)}
        </Text>

        {/* Date */}
        <Text
          style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          {formatDate(currentTime)}
        </Text>

        {/* Alarm Message - transparent card style like alarm list empty state */}
        <View
          style={{
            paddingHorizontal: 30,
            paddingVertical: 20,
            borderRadius: 20,
            marginBottom: 60,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(255,255,255,0.06)'
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="alarm-outline" size={64} color="#9CA3AF" />
            <Text
              style={{
                fontSize: 20,
                color: '#9CA3AF',
                textAlign: 'center',
                fontWeight: '700',
                marginTop: 12,
              }}
            >
              🚨 Alarm Ringing
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#6B7280',
                textAlign: 'center',
                marginTop: 6,
              }}
            >
              Engine's warmed up! Time to hit the road, champ.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: width * 0.8,
          }}
        >
          {/* Snooze Button */}
          <TouchableOpacity
            onPress={handleSnooze}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255, 193, 7, 0.2)',
              borderWidth: 2,
              borderColor: '#ffc107',
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 5,
              shadowColor: '#ffc107',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Ionicons name="moon" size={40} color="#ffc107" />
            <Text
              style={{
                color: '#ffc107',
                fontSize: 12,
                fontWeight: '600',
                marginTop: 4,
              }}
            >
              Snooze
            </Text>
          </TouchableOpacity>

          {/* Wake Up / Stop Button */}
          <TouchableOpacity
            onPress={handleStop}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255, 107, 107, 0.2)',
              borderWidth: 2,
              borderColor: '#ff6b6b',
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 5,
              shadowColor: '#ff6b6b',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Ionicons name="sunny" size={40} color="#ff6b6b" />
            <Text
              style={{
                color: '#ff6b6b',
                fontSize: 12,
                fontWeight: '600',
                marginTop: 4,
              }}
            >
              Wake Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Alarm Info */}
        {alarmTime && (
          <Text
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
              marginTop: 30,
              textAlign: 'center',
            }}
          >
            Scheduled: {alarmTime}
          </Text>
        )}
      </Animated.View>
    </BackgroundComponent>
  );
};

export default AlarmRingingScreen;
