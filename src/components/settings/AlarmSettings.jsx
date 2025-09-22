import React, { useState, useEffect } from 'react';
import { Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingItem from './SettingItem';
import { useTranslation } from 'react-i18next';

const ALARM_SETTINGS_KEYS = {
  SOUND_ENABLED: '@alarm_sound_enabled',
  VIBRATION_ENABLED: '@alarm_vibration_enabled',
  FADE_IN_ENABLED: '@alarm_fade_in_enabled',
  VOLUME_BOOST: '@alarm_volume_boost',
  SNOOZE_ENABLED: '@alarm_snooze_enabled',
  SNOOZE_DURATION: '@alarm_snooze_duration',
};

const AlarmSettings = ({ textColor, subTextColor, cardBackground }) => {
  const { t } = useTranslation();

  const [settings, setSettings] = useState({
    soundEnabled: true,
    vibrationEnabled: true,
    fadeInEnabled: true,
    volumeBoost: false,
    snoozeEnabled: true,
    snoozeDuration: 5, // minutes
  });

  useEffect(() => {
    loadAlarmSettings();
  }, []);

  const loadAlarmSettings = async () => {
    try {
      const settingsData = await Promise.all([
        AsyncStorage.getItem(ALARM_SETTINGS_KEYS.SOUND_ENABLED),
        AsyncStorage.getItem(ALARM_SETTINGS_KEYS.VIBRATION_ENABLED),
        AsyncStorage.getItem(ALARM_SETTINGS_KEYS.FADE_IN_ENABLED),
        AsyncStorage.getItem(ALARM_SETTINGS_KEYS.VOLUME_BOOST),
        AsyncStorage.getItem(ALARM_SETTINGS_KEYS.SNOOZE_ENABLED),
        AsyncStorage.getItem(ALARM_SETTINGS_KEYS.SNOOZE_DURATION),
      ]);

      setSettings({
        soundEnabled: settingsData[0] !== 'false',
        vibrationEnabled: settingsData[1] !== 'false',
        fadeInEnabled: settingsData[2] !== 'false',
        volumeBoost: settingsData[3] === 'true',
        snoozeEnabled: settingsData[4] !== 'false',
        snoozeDuration: parseInt(settingsData[5]) || 5,
      });
    } catch (error) {
      console.error('Error loading alarm settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
      const settingName = key.split('@alarm_')[1];
      setSettings(prev => ({ ...prev, [settingName]: value }));
    } catch (error) {
      console.error('Error saving alarm setting:', error);
    }
  };

  return (
    <>
      {/* Sound Settings */}
      <SettingItem
        title={t('alarm.sound')}
        description={t('alarm.soundDesc')}
        icon="volume-high"
        iconColor={settings.soundEnabled ? "#4CAF50" : "#f44336"}
        iconBackgroundColor={settings.soundEnabled ? "#4CAF5020" : "#f4433620"}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        rightComponent={
          <Switch
            value={settings.soundEnabled}
            onValueChange={(value) => updateSetting(ALARM_SETTINGS_KEYS.SOUND_ENABLED, value)}
            trackColor={{ false: "#e0e0e0", true: "#4CAF50" }}
            thumbColor={settings.soundEnabled ? "#fff" : "#f4f3f4"}
          />
        }
      />

      {/* Vibration Settings */}
      <SettingItem
        title={t('alarm.vibration')}
        description={t('alarm.vibrationDesc')}
        icon="phone-portrait"
        iconColor={settings.vibrationEnabled ? "#FF9800" : "#f44336"}
        iconBackgroundColor={settings.vibrationEnabled ? "#FF980020" : "#f4433620"}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        rightComponent={
          <Switch
            value={settings.vibrationEnabled}
            onValueChange={(value) => updateSetting(ALARM_SETTINGS_KEYS.VIBRATION_ENABLED, value)}
            trackColor={{ false: "#e0e0e0", true: "#FF9800" }}
            thumbColor={settings.vibrationEnabled ? "#fff" : "#f4f3f4"}
          />
        }
      />

      {/* Fade In Settings */}
      <SettingItem
        title={t('alarm.fadeIn')}
        description={t('alarm.fadeInDesc')}
        icon="sunny"
        iconColor={settings.fadeInEnabled ? "#FFC107" : "#f44336"}
        iconBackgroundColor={settings.fadeInEnabled ? "#FFC10720" : "#f4433620"}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        rightComponent={
          <Switch
            value={settings.fadeInEnabled}
            onValueChange={(value) => updateSetting(ALARM_SETTINGS_KEYS.FADE_IN_ENABLED, value)}
            trackColor={{ false: "#e0e0e0", true: "#FFC107" }}
            thumbColor={settings.fadeInEnabled ? "#fff" : "#f4f3f4"}
          />
        }
      />

      {/* Volume Boost Settings */}
      <SettingItem
        title={t('alarm.volumeBoost')}
        description={t('alarm.volumeBoostDesc')}
        icon="volume-off"
        iconColor={settings.volumeBoost ? "#E91E63" : "#f44336"}
        iconBackgroundColor={settings.volumeBoost ? "#E91E6320" : "#f4433620"}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        rightComponent={
          <Switch
            value={settings.volumeBoost}
            onValueChange={(value) => updateSetting(ALARM_SETTINGS_KEYS.VOLUME_BOOST, value)}
            trackColor={{ false: "#e0e0e0", true: "#E91E63" }}
            thumbColor={settings.volumeBoost ? "#fff" : "#f4f3f4"}
          />
        }
      />

      {/* Snooze Settings */}
      <SettingItem
        title={t('alarm.snooze')}
        description={t('alarm.snoozeDesc', { duration: settings.snoozeDuration })}
        icon="time"
        iconColor={settings.snoozeEnabled ? "#9C27B0" : "#f44336"}
        iconBackgroundColor={settings.snoozeEnabled ? "#9C27B020" : "#f4433620"}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        rightComponent={
          <Switch
            value={settings.snoozeEnabled}
            onValueChange={(value) => updateSetting(ALARM_SETTINGS_KEYS.SNOOZE_ENABLED, value)}
            trackColor={{ false: "#e0e0e0", true: "#9C27B0" }}
            thumbColor={settings.snoozeEnabled ? "#fff" : "#f4f3f4"}
          />
        }
      />
    </>
  );
};

export default AlarmSettings;
