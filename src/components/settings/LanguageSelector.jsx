// src/components/settings/LanguageSelector.jsx
import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n/i18n"; // adjust path if needed

const languages = [
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "pt", flag: "🇵🇹", name: "Português" },
  { code: "zh", flag: "🇨🇳", name: "中文" },
  { code: "ko", flag: "🇰🇷", name: "한국어" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "hi", flag: "🇮🇳", name: "हिन्दी" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "sv", flag: "🇸🇪", name: "Svenska" },
  { code: "ms", flag: "🇲🇾", name: "Bahasa Melayu" },
  { code: "ar", flag: "🇸🇦", name: "العربية" },
  { code: "ne", flag: "🇳🇵", name: "नेपाली" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "it", flag: "🇮🇹", name: "Italiano" },
];

const LanguageSelector = ({
  selectedLang,
  setSelectedLang,
  langExpanded,
  setLangExpanded,
  textColor,
  subTextColor,
  cardBackground,
}) => {
  const { t } = useTranslation();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const langHeightAnim = useRef(new Animated.Value(0)).current;

  const toggleLanguageExpansion = () => {
    const toValue = langExpanded ? 0 : 1;
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(langHeightAnim, {
        toValue,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
    setLangExpanded(!langExpanded);
  };

  const changeLanguage = async (lng) => {
    try {
      // Only change if different to avoid unnecessary updates
      if (i18n.language !== lng) {
        await i18n.changeLanguage(lng); // This triggers react-i18next re-render via 'languageChanged' event
      }
      // Update local state for immediate UI feedback (display selected language)
      setSelectedLang(lng);
      setLangExpanded(false);
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const langHeight = langHeightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140], // adjust height for number of languages
  });

  const selectedLanguage =
    languages.find((lang) => lang.code === selectedLang) || languages[0];

  return (
    <View style={styles.container}>
      <View style={[styles.glassCard, { backgroundColor: cardBackground }]}>
        <TouchableOpacity onPress={toggleLanguageExpansion}>
          <View style={styles.cardContent}>
            <View style={[styles.settingIcon, { backgroundColor: "#1e90ff20" }]}>
              <Ionicons name="language" size={24} color="#1e90ff" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: textColor }]}>
                {t("languageSelector.title")}
              </Text>
              <Text style={[styles.settingDesc, { color: subTextColor }]}>
                {selectedLanguage.name}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons name="chevron-down" size={24} color={textColor} />
            </Animated.View>
          </View>
        </TouchableOpacity>

        <Animated.View style={{ height: langHeight, overflow: "hidden" }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.langScroll}
            contentContainerStyle={styles.langScrollContent}
          >
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langButton,
                  {
                    backgroundColor:
                      selectedLang === lang.code ? "#8a2be2" : "rgba(255,255,255,0.1)",
                    borderColor: selectedLang === lang.code ? "#8a2be2" : "transparent",
                  },
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={styles.flagText}>{lang.flag}</Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.langText,
                    {
                      color: selectedLang === lang.code ? "#fff" : textColor,
                      fontWeight: selectedLang === lang.code ? "700" : "500",
                    },
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  glassCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 14,
    opacity: 0.7,
  },
  langScroll: {
    marginTop: 16,
  },
  langScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  langButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 2,
    alignItems: "center",
    minWidth: 80,
    maxWidth: 100,
  },
  flagText: {
    fontSize: 24,
    marginBottom: 4,
  },
  langText: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 80,
  },
});

export default LanguageSelector;