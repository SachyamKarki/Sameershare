// src/components/settings/NotificationToggle.jsx
import React, { useRef } from "react";
import { Switch, Animated, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SettingItem from "./SettingItem";
import { useTranslation } from "react-i18next";

const NotificationToggle = ({
  notificationsEnabled,
  setNotificationsEnabled,
  textColor,
  subTextColor,
  cardBackground,
}) => {
  const { t } = useTranslation();
  const switchScaleAnim = useRef(new Animated.Value(1)).current;

  const toggleNotifications = async (value) => {
    // Animate switch
    Animated.sequence([
      Animated.timing(switchScaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(switchScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setNotificationsEnabled(true);
        await AsyncStorage.setItem("notificationsEnabled", "true");
      } else {
        setNotificationsEnabled(false);
        Alert.alert(
          t("notifications.permissionDeniedTitle"),
          t("notifications.permissionDeniedMessage")
        );
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotificationsEnabled(false);
      await AsyncStorage.setItem("notificationsEnabled", "false");
    }
  };

  return (
    <SettingItem
      title={t("notifications.itemTitle")}
      description={
        notificationsEnabled
          ? t("notifications.enabled")
          : t("notifications.disabled")
      }
      icon={notificationsEnabled ? "notifications" : "notifications-off"}
      iconColor={notificationsEnabled ? "#4CAF50" : "#f44336"}
      iconBackgroundColor={notificationsEnabled ? "#4CAF5015" : "#f4433615"}
      textColor={textColor}
      subTextColor={subTextColor}
      cardBackground={cardBackground}
      rightComponent={
        <Animated.View style={{ transform: [{ scale: switchScaleAnim }] }}>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: "#333333", true: "#4CAF50" }}
            thumbColor="#fff"
          />
        </Animated.View>
      }
    />
  );
};

export default NotificationToggle;
