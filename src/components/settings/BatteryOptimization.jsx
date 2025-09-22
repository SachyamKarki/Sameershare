import React, { useState, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingItem from './SettingItem';

const BatteryOptimization = ({ textColor, subTextColor, cardBackground }) => {
  const [isOptimized, setIsOptimized] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    checkBatteryOptimizationStatus();
  }, []);

  const checkBatteryOptimizationStatus = async () => {
    try {
      const lastCheck = await AsyncStorage.getItem('@battery_optimization_checked');
      const isDisabled = await AsyncStorage.getItem('@battery_optimization_disabled');
      
      setHasChecked(lastCheck !== null);
      setIsOptimized(isDisabled === 'true');
    } catch (error) {
      console.error('Error checking battery optimization:', error);
    }
  };

  const handleBatteryOptimization = () => {
    Alert.alert(
      t("batteryOptimization.title"),
      t("batteryOptimization.message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { 
          text: t("batteryOptimization.openSettings"), 
          onPress: openBatterySettings 
        },
        { 
          text: t("batteryOptimization.alreadyDone"), 
          onPress: markAsOptimized 
        }
      ]
    );
  };

  const openBatterySettings = async () => {
    try {
      // Mark that we've attempted to open settings
      await AsyncStorage.setItem('@battery_optimization_checked', 'true');
      setHasChecked(true);

      // Try to open battery optimization settings
      const batteryIntent = 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS';
      const canOpen = await Linking.canOpenURL(`intent://settings/${batteryIntent}`);
      
      if (canOpen) {
        await Linking.openURL(`intent://settings/${batteryIntent}`);
      } else {
        // Fallback to general settings
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening battery settings:', error);
      Alert.alert(
        t("settings.title"),
        t("batteryOptimization.manualInstructions")
      );
    }
  };

  const markAsOptimized = async () => {
    try {
      await AsyncStorage.setItem('@battery_optimization_disabled', 'true');
      await AsyncStorage.setItem('@battery_optimization_checked', 'true');
      setIsOptimized(true);
      setHasChecked(true);
    } catch (error) {
      console.error('Error marking battery optimization:', error);
    }
  };

  const getStatusInfo = () => {
    if (isOptimized) {
      return {
        description: "Battery optimization disabled - alarms will work reliably",
        iconColor: "#4CAF50",
        iconBackgroundColor: "#4CAF5020"
      };
    } else if (hasChecked) {
      return {
        description: "Please disable battery optimization for reliable alarms",
        iconColor: "#FF9800",
        iconBackgroundColor: "#FF980020"
      };
    } else {
      return {
        description: "Ensure alarms work even in deep sleep mode",
        iconColor: "#f44336",
        iconBackgroundColor: "#f4433620"
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <SettingItem
      title="Battery Optimization"
      description={statusInfo.description}
      icon={isOptimized ? "battery-charging" : "battery-dead"}
      iconColor={statusInfo.iconColor}
      iconBackgroundColor={statusInfo.iconBackgroundColor}
      textColor={textColor}
      subTextColor={subTextColor}
      cardBackground={cardBackground}
      isButton={true}
      showChevron={!isOptimized}
      onPress={isOptimized ? undefined : handleBatteryOptimization}
    />
  );
};

export default BatteryOptimization;
