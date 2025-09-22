import React from 'react';
import { Alert, Share } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlarm } from '../../context';
import SettingItem from './SettingItem';

const BackupRestore = ({ textColor, subTextColor, cardBackground }) => {
  const { alarms, recordings, addAlarm, addRecording } = useAlarm();

  const createBackup = async () => {
    try {
      // Collect all app data
      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        alarms: alarms,
        recordings: recordings.map(recording => ({
          ...recording,
          // Note: Audio files aren't included in backup, only metadata
          audioUri: null,
          hasAudioFile: !!recording.audioUri
        })),
        settings: {
          // Add any other settings you want to backup
          darkMode: await AsyncStorage.getItem('darkMode'),
          selectedLanguage: await AsyncStorage.getItem('userLanguage'),
          notificationsEnabled: await AsyncStorage.getItem('notificationsEnabled'),
        }
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      const fileName = `alarm_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, backupJson);

      // Share the backup file
      await Share.share({
        url: fileUri,
        title: 'Alarm App Backup',
      });

      Alert.alert(
        t("backupRestore.backupCreated"),
        t("backupRestore.backupCreatedMessage")
      );

    } catch (error) {
      console.error('Backup creation error:', error);
      Alert.alert(t("backupRestore.error"), t("backupRestore.backupError"));
    }
  };

  const restoreFromBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const backupContent = await FileSystem.readAsStringAsync(fileUri);
        const backupData = JSON.parse(backupContent);

        // Validate backup data structure
        if (!backupData.version || !backupData.alarms || !backupData.recordings) {
          throw new Error('Invalid backup file format');
        }

        Alert.alert(
          t("backupRestore.restoreConfirm"),
          t("backupRestore.restoreConfirmMessage", { alarmCount: backupData.alarms.length }),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("backupRestore.restoreBackup"),
              style: "destructive",
              onPress: () => performRestore(backupData)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(t("backupRestore.error"), t("backupRestore.restoreError"));
    }
  };

  const performRestore = async (backupData) => {
    try {
      // Restore settings
      if (backupData.settings) {
        const { settings } = backupData;
        
        if (settings.darkMode !== null) {
          await AsyncStorage.setItem('darkMode', settings.darkMode);
        }
        if (settings.selectedLanguage) {
          await AsyncStorage.setItem('userLanguage', settings.selectedLanguage);
        }
        if (settings.notificationsEnabled !== null) {
          await AsyncStorage.setItem('notificationsEnabled', settings.notificationsEnabled);
        }
      }

      // Restore alarms (note: these won't work without audio files)
      let restoredAlarms = 0;
      for (const alarm of backupData.alarms) {
        try {
          // Skip alarms that require audio files (since we can't restore them)
          if (alarm.audioUri) {
            console.log(`Skipping alarm ${alarm.id} - requires audio file`);
            continue;
          }
          
          addAlarm(alarm);
          restoredAlarms++;
        } catch (error) {
          console.error(`Error restoring alarm ${alarm.id}:`, error);
        }
      }

      // Restore recording metadata (without actual files)
      let restoredRecordings = 0;
      for (const recording of backupData.recordings) {
        try {
          if (recording.hasAudioFile) {
            console.log(`Skipping recording ${recording.id} - audio file not available`);
            continue;
          }
          
          addRecording(recording);
          restoredRecordings++;
        } catch (error) {
          console.error(`Error restoring recording ${recording.id}:`, error);
        }
      }

      Alert.alert(
        t("backupRestore.restoreComplete"),
        t("backupRestore.restoreCompleteMessage", { alarmCount: restoredAlarms })
      );

    } catch (error) {
      console.error('Restore process error:', error);
      Alert.alert(t("backupRestore.error"), t("backupRestore.restoreProcessError"));
    }
  };

  return (
    <>
      {/* Create Backup */}
      <SettingItem
        title={t("backupRestore.createBackup")}
        description={t("backupRestore.createBackup")}
        icon="cloud-upload"
        iconColor="#2196F3"
        iconBackgroundColor="#2196F320"
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        isButton={true}
        showChevron={true}
        onPress={createBackup}
      />

      {/* Restore Backup */}
      <SettingItem
        title={t("backupRestore.restoreBackup")}
        description={t("backupRestore.restoreBackup")}
        icon="cloud-download"
        iconColor="#4CAF50"
        iconBackgroundColor="#4CAF5020"
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        isButton={true}
        showChevron={true}
        onPress={restoreFromBackup}
      />
    </>
  );
};

export default BackupRestore;
