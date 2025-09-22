import React, { useState, useEffect } from 'react';
import { Alert, Linking, Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context';
import i18n from '../../i18n/i18n';

const BatteryOptimizationPrompt = () => {
  const { colors, darkMode } = useTheme();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    checkShouldShowPrompt();
  }, []);

  const checkShouldShowPrompt = async () => {
    try {
      const alreadyShown = await AsyncStorage.getItem('batteryOptimizationShown');
      if (!alreadyShown && Platform.OS === 'android') {
        await AsyncStorage.setItem('batteryOptimizationShown', 'true');
        // Delay showing the alert for 40 seconds
        setTimeout(() => {
          setShowPrompt(true);
        }, 15000);
      }
    } catch (error) {
      console.log('Error checking battery optimization prompt:', error);
    }
  };

  const presentAlert = () => {
    if (Platform.OS !== 'android') return;

    // Fully translated text using i18n
    const title = i18n.t('batteryOptimization.title'); // e.g. "Unlimited Alarm Access"
    const message = i18n.t('batteryOptimization.message');
    // In your translation JSON, message should include all instructions in the target language
    const okText = i18n.t('common.ok');
    const settingsText = i18n.t('batteryOptimization.openSettings'); // e.g. "Open Settings"

    Alert.alert(
      title, 
      message, 
      [
        { 
          text: okText, 
          style: darkMode ? 'default' : 'default',
          onPress: () => setShowPrompt(false) 
        },
        {
          text: settingsText,
          style: darkMode ? 'default' : 'default',
          onPress: () => {
            setShowPrompt(false);
            Linking.openSettings().catch(() =>
              console.warn('Cannot open settings automatically')
            );
          },
        },
      ],
      {
        // Alert styling options for better dark theme support
        cancelable: true,
        onDismiss: () => setShowPrompt(false),
        // Note: React Native Alert doesn't have direct theme styling,
        // but it should respect the system theme automatically
      }
    );
  };

  useEffect(() => {
    if (showPrompt) {
      presentAlert();
    }
  }, [showPrompt, darkMode]); // Added darkMode dependency

  return null;
};

const styles = StyleSheet.create({
  // Styles for potential future UI components
  container: {
    flex: 1,
  },
  // These styles would be used if you ever convert this to a custom modal
  darkContainer: {
    backgroundColor: '#0A0A0A',
  },
  lightContainer: {
    backgroundColor: '#FFFFFF',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#000000',
  },
});

export default BatteryOptimizationPrompt;