import React from "react";
import { Alert, Linking } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import SettingItem from "./SettingItem";
import { useTranslation } from "react-i18next";

const AboutSupport = ({ textColor, subTextColor, cardBackground }) => {
  const { t } = useTranslation();

  const showAboutInfo = () => {
    const appVersion = Constants.expoConfig?.version || "1.0.0";
    const buildNumber = Constants.expoConfig?.extra?.buildNumber || "1";

    Alert.alert(
      t("about.title"),
      `${t("about.version")}: ${appVersion} (Build ${buildNumber})\n\n` +
        t("about.description"),
      [{ text: t("common.ok"), style: "default" }]
    );
  };

  const showDeviceInfo = async () => {
    try {
      const deviceInfo = {
        brand: Device.brand || "Unknown",
        modelName: Device.modelName || "Unknown",
        osVersion: Device.osVersion || "Unknown",
        platformApiLevel: Device.platformApiLevel || "Unknown",
        totalMemory: Device.totalMemory
          ? `${Math.round(Device.totalMemory / (1024 * 1024 * 1024))}GB`
          : "Unknown",
      };

      Alert.alert(
        t("device.title"),
        `${t("device.brand")}: ${deviceInfo.brand}\n` +
          `${t("device.model")}: ${deviceInfo.modelName}\n` +
          `${t("device.os")}: ${deviceInfo.osVersion}\n` +
          `${t("device.api")}: ${deviceInfo.platformApiLevel}\n` +
          `${t("device.memory")}: ${deviceInfo.totalMemory}`,
        [{ text: t("common.ok") }]
      );
    } catch (error) {
      Alert.alert(t("common.error"), t("device.error"));
    }
  };

  const reportIssue = () => {
    const appVersion = Constants.expoConfig?.version || "1.0.0";
    const deviceInfo = `${Device.brand || "Unknown"} ${
      Device.modelName || "Unknown"
    }`;

    const subject = encodeURIComponent(t("support.subject"));
    const body = encodeURIComponent(
      `
${t("device.device")}: ${deviceInfo}
${t("device.os")}: Android ${Device.osVersion || "Unknown"}
${t("about.version")}: ${appVersion}

${t("support.issueDescription")}:
[Please describe your issue here]

${t("support.steps")}:
1. 
2. 
3. 

${t("support.expected")}:
[What should happen?]

${t("support.actual")}:
[What actually happened?]
    `
    );

    const mailtoUrl = `mailto:sachyamkarki@gmail.com?subject=${subject}&body=${body}`;

    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        t("support.emailUnavailableTitle"),
        `${t("support.emailUnavailableBody")}\nsachyamkarki@gmail.com`
      );
    });
  };

  const openPrivacyPolicy = () => {
    Alert.alert(t("privacy.title"), t("privacy.body"), [
      { text: t("common.ok"), style: "default" },
    ]);
  };

  const openTermsOfService = () => {
    Alert.alert(t("terms.title"), t("terms.body"), [
      { text: t("common.ok"), style: "default" },
    ]);
  };

  const rateApp = () => {
    const playStoreUrl =
      "https://play.google.com/store/apps/details?id=com.yourcompany.alarmapp";
    Linking.openURL(playStoreUrl).catch(() => {
      Alert.alert(t("rate.title"), t("rate.fallback"));
    });
  };

  const shareApp = () => {
    const playStoreUrl =
      "https://play.google.com/store/apps/details?id=com.yourcompany.alarmapp";

    Alert.alert(
      t("share.title"),
      `${t("share.message")}\n\n${playStoreUrl}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("share.copy"),
          onPress: () =>
            Alert.alert(t("share.copiedTitle"), t("share.copiedBody")),
        },
      ]
    );
  };

  const connectWithUs = () => {
    const connectWithUsUrl = "https://lfgburnego.com";
    Linking.openURL(connectWithUsUrl).catch(() => {
      Alert.alert(t("connect.title"), t("connect.fallback"));
    });
  };
  

  return (
    <>
      

      {/* Device Information */}
      <SettingItem
        title={t("device.itemTitle")}
        description={`${Device.brand || "Unknown"} ${
          Device.modelName || "Unknown"
        }`}
        icon="phone-portrait"
        iconColor="#4CAF50"
        iconBackgroundColor="#4CAF5020"
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        isButton={true}
        showChevron={true}
        onPress={showDeviceInfo}
      />

    

       {/* Connect With Us */}
       <SettingItem
        title={t("connect.itemTitle")}
        description={t("connect.itemDesc")}
        icon="globe"
        iconColor="#607D8B"
        iconBackgroundColor="#607D8B20"
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        isButton={true}
        showChevron={true}
        onPress={connectWithUs}
      />

       {/* Report Issue */}
       <SettingItem
        title={t("support.itemTitle")}
        description={t("support.itemDesc")}
        icon="mail"
        iconColor="#FF9800"
        iconBackgroundColor="#FF980020"
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        isButton={true}
        showChevron={true}
        onPress={reportIssue}
      />

      {/* App Information */}
      <SettingItem
        title={t("about.itemTitle")}
        description={`${t("about.version")} ${
          Constants.expoConfig?.version || "1.0.0"
        } • ${t("about.status")}`}
        icon="information-circle"
        iconColor="#2196F3"
        iconBackgroundColor="#2196F320"
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        isButton={true}
        showChevron={true}
        onPress={showAboutInfo}
      />

      {/* Rate App */}
      <SettingItem
        title={t("rate.itemTitle")}
        description={t("rate.itemDesc")}
        icon="star"
        iconColor="#FFC107"
        iconBackgroundColor="#FFC10720"
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        isButton={true}
        showChevron={true}
        onPress={rateApp}
      />

      {/* Share App */}
      <SettingItem
        title={t("share.itemTitle")}
        description={t("share.itemDesc")}
        icon="share"
        iconColor="#E91E63"
        iconBackgroundColor="#E91E6320"
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        isButton={true}
        showChevron={true}
        onPress={shareApp}
      />

      {/* Privacy Policy */}
      <SettingItem
        title={t("privacy.itemTitle")}
        description={t("privacy.itemDesc")}
        icon="shield-checkmark"
        iconColor="#9C27B0"
        iconBackgroundColor="#9C27B020"
        textColor={textColor}
        subTextColor={subTextColor}
        cardBackground={cardBackground}
        isButton={true}
        showChevron={true}
        onPress={openPrivacyPolicy}
      />

     
    </>
  );
};

export default AboutSupport;
