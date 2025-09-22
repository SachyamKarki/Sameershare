import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context";
import {
  AnimatedCard,
  LanguageSelector,
  BackgroundAnimation,
  StorageManagement,
  AboutSupport,
} from "../components/settings";
import { StatusBarComponent } from "../components";

import { useTranslation } from "react-i18next";
import i18n from "../i18n/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SettingsScreen = () => {
  const { darkMode, colors } = useTheme();
  const [selectedLang, setSelectedLang] = useState("en");
  const [langExpanded, setLangExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    background: backgroundColor,
    text: textColor,
    subText: subTextColor,
    cardBackground,
  } = colors;

  const { t } = useTranslation();

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem("userLanguage");
        const currentLang = savedLang || "en";
        setSelectedLang(currentLang);

        if (i18n.language !== currentLang) {
          await i18n.changeLanguage(currentLang);
        }
      } catch (error) {
        console.log("Error loading language:", error);
        setSelectedLang("en");
      } finally {
        setLoading(false);
      }
    };
    loadLanguage();
  }, []);

  const handleLanguageChange = useCallback(
    async (lng) => {
      try {
        await i18n.changeLanguage(lng);
        setSelectedLang(lng);
      } catch (error) {
        console.log("Error changing language:", error);
      }
    },
    [i18n.language]
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <BackgroundAnimation darkMode={darkMode} />

      {/* Status bar config */}
      <StatusBarComponent
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={false}
      />

      {/* Safe area without extra top padding */}
      <SafeAreaView style={styles.safeArea} edges={["top","left", "right", "bottom"]}>
        {/* Header */}
        <View
          style={[
            styles.headerContainer,
            { borderBottomColor: "rgba(255,255,255,0.1)" },
          ]}
        >
          <Text style={[styles.mainTitle, { color: textColor }]}>
            {t("settingsCommon.title")}
          </Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            {t("settingsCommon.subtitle")}
          </Text>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        >
          <AnimatedCard delay={100}>
            <LanguageSelector
              selectedLang={selectedLang}
              setSelectedLang={handleLanguageChange}
              langExpanded={langExpanded}
              setLangExpanded={setLangExpanded}
              textColor={textColor}
              subTextColor={subTextColor}
              cardBackground={cardBackground}
            />
          </AnimatedCard>

          <AnimatedCard delay={200}>
            <StorageManagement
              textColor={textColor}
              subTextColor={subTextColor}
              cardBackground={cardBackground}
            />
          </AnimatedCard>

          <AnimatedCard delay={300}>
            <AboutSupport
              textColor={textColor}
              subTextColor={subTextColor}
              cardBackground={cardBackground}
            />
          </AnimatedCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContainer: { flex: 1, paddingHorizontal: 20 },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 0,
    backgroundColor: "transparent",
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: "Times New Roman",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.8,
    lineHeight: 22,
  },
});

export default SettingsScreen;
