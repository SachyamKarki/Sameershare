import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useAlarm } from '../../context';
import SettingItem from './SettingItem';
import { useTranslation } from 'react-i18next'; // <-- import i18n hook

const StorageManagement = ({ textColor, subTextColor, cardBackground, navigation }) => {
  const { recordings } = useAlarm();
  const { t } = useTranslation(); // <-- hook for translations

  const [storageInfo, setStorageInfo] = useState({
    totalRecordings: 0,
    totalSizeMB: 0,
    cacheFiles: 0,
  });

  useEffect(() => {
    calculateStorageInfo();
  }, [recordings]);

  const calculateStorageInfo = async () => {
    if (!recordings) return;

    let totalSize = 0;
    let validRecordings = 0;

    for (const recording of recordings) {
      if (recording.audioUri) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(recording.audioUri);
          if (fileInfo.exists) {
            totalSize += fileInfo.size || 0;
            validRecordings++;
          }
        } catch (error) {
          console.error('Error checking file:', error);
        }
      }
    }

    setStorageInfo({
      totalRecordings: validRecordings,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(1),
      cacheFiles: recordings.length - validRecordings,
    });
  };

  // ✅ Navigate to StorageStatsScreen or show alert
  const handleStoragePress = () => {
    if (navigation) {
      navigation.navigate('StorageStatsScreen');
    } else {
      Alert.alert(
        t('storageManagement.alertTitle'),
        t('storageManagement.alertMessage', {
          size: storageInfo.totalSizeMB,
          recordings: storageInfo.totalRecordings,
          cache: storageInfo.cacheFiles,
        })
      );
    }
  };

  // ✅ Dynamic status with translations
  const getStorageStatus = () => {
    const sizeMB = parseFloat(storageInfo.totalSizeMB) || 0;
    if (sizeMB > 100)
      return {
        iconColor: '#f44336',
        iconBackgroundColor: '#f4433620',
        status: t('storageManagement.status.high'),
      };
    if (sizeMB > 50)
      return {
        iconColor: '#FF9800',
        iconBackgroundColor: '#FF980020',
        status: t('storageManagement.status.moderate'),
      };
    return {
      iconColor: '#4CAF50',
      iconBackgroundColor: '#4CAF5020',
      status: t('storageManagement.status.normal'),
    };
  };

  const storageStatus = getStorageStatus();

  return (
    <SettingItem
      title={t('storageManagement.title')}
      description={t('storageManagement.description', {
        recordings: storageInfo.totalRecordings,
        size: storageInfo.totalSizeMB,
        status: storageStatus.status,
      })}
      icon="folder"
      iconColor={storageStatus.iconColor}
      iconBackgroundColor={storageStatus.iconBackgroundColor}
      textColor={textColor}
      subTextColor={subTextColor}
      cardBackground={cardBackground}
      isButton={true}
      showChevron={true}
      onPress={handleStoragePress}
    />
  );
};

export default StorageManagement;
