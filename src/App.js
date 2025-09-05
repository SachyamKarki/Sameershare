// App.js
import React, { useEffect, useRef } from 'react';
import { Platform, Vibration, StatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, navigateNested } from './navigation/navigation';
import { AlarmProvider } from './context/AlarmContext';
import TabNavigator from './navigation/navigation';
import { Audio } from 'expo-av';
import NotificationService from './services/NotificationService';
import AlarmActions from './services/AlarmActions';
import { setAlarmAudioMode, activateSpeakerphone } from './utils/audio';
import { VIBRATION_PATTERNS } from './constants/app';
// import { testNativeAlarmFunctionality, logNativeAlarmStatus } from './utils/testNativeAlarms';

export default function App() {
  const soundRef = useRef(null);
  // Note: AlarmRingingScreen removed - now using native Java AlarmActivity

  // Play alarm sound loudly and loop forever
  const startAlarmAudio = async (uri) => {
    try {
      // Note: Native Java system now handles all alarm audio independently

      // Stop previous sound if any
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Force MAXIMUM VOLUME loudspeaker mode
      await activateSpeakerphone(); // Activate speakerphone first
      await setAlarmAudioMode(); // Then set alarm audio mode

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0, isLooping: true }
      );

      soundRef.current = sound;
      await sound.playAsync();

      // Vibrate repeatedly
      Vibration.vibrate(VIBRATION_PATTERNS.ALARM, true);

    } catch (error) {
      console.error('Error playing alarm audio:', error);
    }
  };

  // Stop alarm sound + vibration
  const stopAlarmAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      Vibration.cancel();
    } catch (error) {
      console.error('Error stopping alarm audio:', error);
    }
  };

  // Note: Native Java AlarmActivity now handles alarm UI - no React Native screen needed

  useEffect(() => {
    // Initialize Audio Mode for loudspeaker
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false, // Force loudspeaker
        });
      } catch (error) {
        console.warn('Failed to set audio mode:', error);
      }
    };

    initAudio();

    // Initialize notification service
    NotificationService.initialize();

    // Test native alarm functionality (temporarily disabled)
    // logNativeAlarmStatus();
    // Uncomment the line below to test alarm scheduling:
    // testNativeAlarmFunctionality();

    // DISABLED: Notification listeners completely removed
    // Native Java system handles ALL notifications - no JavaScript notification handling
    console.log('🚨 NATIVE-ONLY SYSTEM: All notifications handled by Java - JavaScript listeners disabled');
    
    const notificationListeners = null; // Completely disabled

    return () => {
      // No cleanup needed - native system handles everything
      console.log('🚨 App cleanup: Native system continues independently');
    };
  }, []);

  return (
    <AlarmProvider>
      {/* Professional Status Bar Configuration */}
      <ExpoStatusBar style="light" backgroundColor="#000000" translucent={false} />
      {Platform.OS === 'android' && (
        <StatusBar
          barStyle="light-content"
          backgroundColor="#000000"
          translucent={false}
        />
      )}
      
      <NavigationContainer ref={navigationRef}>
        <TabNavigator />
      </NavigationContainer>
    </AlarmProvider>
  );
}