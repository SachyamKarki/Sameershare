
import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Platform, Vibration, StatusBar, DeviceEventEmitter, View, ActivityIndicator, I18nManager } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigation/navigation';
import { AlarmProvider } from './context/AlarmContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import MainStackNavigator from './navigation/navigation';
import { AlertContainer, ToastContainer, ErrorBoundary, LanguagePrompt  } from './components';
import { Audio } from 'expo-av';
import NotificationService from './services/NotificationService';
import { setAlarmAudioMode, activateSpeakerphone } from './utils/audio';
import { VIBRATION_PATTERNS } from './constants/app';
import { performStorageMaintenance } from './utils/storageManager';
import { initializeDatabase } from './utils/databaseManager';
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Main App Logic
const MainApp = () => {
  const { colors } = useTheme();
  const soundRef = useRef(null);
  const [languageSelected, setLanguageSelected] = useState(false);

  const handleLanguageSelected = (languageCode) => {
    console.log('🌍 Language selected in MainApp:', languageCode);
    setLanguageSelected(true);
  };

  const startAlarmAudio = async (uri) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await activateSpeakerphone();
      await setAlarmAudioMode();

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0, isLooping: true }
      );

      soundRef.current = sound;
      await sound.playAsync();
      Vibration.vibrate(VIBRATION_PATTERNS.ALARM, true);
    } catch (error) {
      console.error('Error playing alarm audio:', error);
    }
  };

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

  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.warn('Failed to set audio mode:', error);
      }
    };
    initAudio();

    const initDatabase = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        let result = await initializeDatabase();
        if (!result.success) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          await initializeDatabase();
        }
      } catch (error) {
        console.error('Database initialization error:', error);
      }
    };
    initDatabase();

    NotificationService.initialize();

    const initStorageMaintenance = async () => {
      try {
        const result = await performStorageMaintenance();
        if (!result.success) console.warn('Storage maintenance issues:', result.error);
      } catch (error) {
        console.warn('Storage maintenance failed:', error);
      }
    };
    setTimeout(initStorageMaintenance, 2000);

    const alarmScreenListener = DeviceEventEmitter.addListener('openAlarmScreen', (params) => {
      const openAlarmScreen = () => {
        if (navigationRef.isReady()) {
          try {
            navigationRef.reset({
              index: 1,
              routes: [
                { name: 'Main' },
                { 
                  name: 'AlarmRinging', 
                  params: {
                    alarmId: params.alarmId,
                    alarmTime: params.alarmTime,
                    audioPath: params.audioPath,
                    isBlocking: true,
                  }
                }
              ],
            });
          } catch {
            navigationRef.navigate('AlarmRinging', {
              alarmId: params.alarmId,
              alarmTime: params.alarmTime,
              audioPath: params.audioPath,
              isBlocking: true,
            });
          }
        } else setTimeout(openAlarmScreen, 100);
      };
      openAlarmScreen();
    });

    return () => {
      alarmScreenListener.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AlarmProvider>
        <ExpoStatusBar style="light" backgroundColor={colors.statusBarBackground} translucent={false} />
        <StatusBar barStyle="light-content" backgroundColor={colors.statusBarBackground} translucent={false} />

        <NavigationContainer ref={navigationRef}>
          <MainStackNavigator />
        </NavigationContainer>

        <AlertContainer />
        <ToastContainer />
        
    
        <LanguagePrompt onLanguageSelected={handleLanguageSelected} />
      </AlarmProvider>
    </ErrorBoundary>
  );
};

// App Wrapper with i18n
export default function App() {
  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem("userLanguage");
        const currentLang = savedLang || "en";
        
        // Set RTL/LTR based on language
        const rtlLanguages = ['ar', 'ne']; // Add more RTL languages if needed
        if (rtlLanguages.includes(currentLang)) {
          I18nManager.forceRTL(true);
          I18nManager.allowRTL(true);
        } else {
          I18nManager.forceRTL(false);
          I18nManager.allowRTL(false);
        }
        
        await i18n.changeLanguage(currentLang);
      } catch (e) {
        console.warn("Failed to load language:", e);
      } finally {
        setLanguageLoaded(true);
      }
    };
    loadLanguage();
  }, []);

  if (!languageLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <Suspense fallback={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" />
            </View>
          }>
            <MainApp />
          </Suspense>
        </I18nextProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
