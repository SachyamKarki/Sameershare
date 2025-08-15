// App.js
import React, { useEffect, useRef } from 'react';
import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, navigateNested } from './navigation';
import { AlarmProvider } from './components/AlarmContext';
import TabNavigator from './navigation';
import { Audio } from 'expo-av';

export default function App() {
  const soundRef = useRef(null);
  const isAlarmRingingScreenActive = useRef(false);

  // Play alarm sound loudly and loop forever
  const startAlarmAudio = async (uri) => {
    try {
      // Don't start audio if AlarmRingingScreen is already handling it
      if (isAlarmRingingScreenActive.current) {
        return;
      }

      // Stop previous sound if any
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Force loudspeaker mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0, isLooping: true }
      );

      soundRef.current = sound;
      await sound.playAsync();

      // Vibrate repeatedly
      const pattern = [500, 500]; // vibrate 500ms, pause 500ms
      Vibration.vibrate(pattern, true);

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

  // Function to be called by AlarmRingingScreen
  global.setAlarmRingingScreenActive = (active) => {
    isAlarmRingingScreenActive.current = active;
    if (active) {
      // Stop App.js audio when AlarmRingingScreen takes over
      stopAlarmAudio();
    }
  };

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

    // Ask notification permission
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    })();

    // Define how notifications behave
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false, // we handle manually
        shouldSetBadge: false,
      }),
    });

    // Create Stop/Snooze buttons
    Notifications.setNotificationCategoryAsync('alarmActions', [
      { identifier: 'STOP', buttonTitle: 'Stop', options: { opensAppToForeground: true } },
      { identifier: 'SNOOZE', buttonTitle: 'Snooze 5 min', options: { opensAppToForeground: true } },
    ]);

    // When notification is received (fires at scheduled time)
    const subReceive = Notifications.addNotificationReceivedListener(async notification => {
      console.log('Alarm notification received:', notification.request.identifier);
      const audioUri = notification.request.content.data.audioUri;
      if (audioUri) {
        // Start audio immediately when notification is received
        startAlarmAudio(audioUri);
      }
    });

    // When user interacts with notification
    const subResponse = Notifications.addNotificationResponseReceivedListener(async response => {
      const data = response.notification.request.content.data;
      const action = response.actionIdentifier;

      if (action === 'STOP') {
        stopAlarmAudio();
      } else if (action === 'SNOOZE') {
        stopAlarmAudio();
        if (data?.alarmId) {
          await Notifications.scheduleNotificationAsync({
            content: response.notification.request.content,
            trigger: { seconds: 300 }, // Snooze 5 minutes
          });
        }
      }

      // Open ringing screen if needed (this will take over audio handling)
      if (data?.alarmId) {
        navigateNested('HomeTab', 'AlarmRinging', {
          alarmId: data.alarmId,
          audioUri: data.audioUri,
        });
      }
    });

    return () => {
      subReceive.remove();
      subResponse.remove();
    };
  }, []);

  return (
    <AlarmProvider>
      <NavigationContainer ref={navigationRef}>
        <TabNavigator />
      </NavigationContainer>
    </AlarmProvider>
  );
}