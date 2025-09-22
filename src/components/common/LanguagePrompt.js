import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../i18n/i18n";

const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = 120;
const ITEM_SPACING = 16;
const VISIBLE_ITEMS = 3;

// Responsive modal sizing
const MODAL_WIDTH = Math.min(Math.max(width * 0.8, 300), 420);
const MODAL_HEIGHT = Math.min(Math.max(height * 0.5, 360), 520);

const languages = [
  { code: "ar", flag: "🇸🇦", name: "العربية", nativeName: "Arabic" },
  { code: "zh", flag: "🇨🇳", name: "中文", nativeName: "Chinese" },
  { code: "de", flag: "🇩🇪", name: "Deutsch", nativeName: "German" },
  { code: "es", flag: "🇪🇸", name: "Español", nativeName: "Spanish" },
  { code: "fr", flag: "🇫🇷", name: "Français", nativeName: "French" },
  { code: "hi", flag: "🇮🇳", name: "हिन्दी", nativeName: "Hindi" },
  { code: "it", flag: "🇮🇹", name: "Italiano", nativeName: "Italian" },
  { code: "en", flag: "🇺🇸", name: "English", nativeName: "English" },
  { code: "ja", flag: "🇯🇵", name: "日本語", nativeName: "Japanese" },
  { code: "ko", flag: "🇰🇷", name: "한국어", nativeName: "Korean" },
  { code: "ms", flag: "🇲🇾", name: "Bahasa Melayu", nativeName: "Malay" },
  { code: "ne", flag: "🇳🇵", name: "नेपाली", nativeName: "Nepali" },
  { code: "pt", flag: "🇵🇹", name: "Português", nativeName: "Portuguese" },
  { code: "sv", flag: "🇸🇪", name: "Svenska", nativeName: "Swedish" },
];

const LanguagePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedLang, setSelectedLang] = useState(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const check = async () => {
      const alreadyShown = await AsyncStorage.getItem("languagePromptShown");
      if (!alreadyShown) {
        setTimeout(() => {
          setShowPrompt(true);
          // Entrance animation
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start();
        }, 3000);
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (showPrompt && flatListRef.current) {
      const englishIndex = languages.findIndex((l) => l.code === "en");
      const centerOffset = englishIndex * (ITEM_WIDTH + ITEM_SPACING);
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: centerOffset,
          animated: true,
        });
      }, 300);
      // Don't pre-select English, let user choose
    }
  }, [showPrompt]);

  const handleLanguageSelect = async (lng, index) => {
    try {
      setSelectedLang(lng);
      await i18n.changeLanguage(lng);
      await AsyncStorage.setItem("languagePromptShown", "true");

      // Exit animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowPrompt(false);
      });

      if (flatListRef.current) {
        const centerOffset = index * (ITEM_WIDTH + ITEM_SPACING);
        flatListRef.current.scrollToOffset({
          offset: centerOffset,
          animated: true,
        });
      }
    } catch (err) {
      console.error("Failed to change language:", err);
    }
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * (ITEM_WIDTH + ITEM_SPACING),
      index * (ITEM_WIDTH + ITEM_SPACING),
      (index + 1) * (ITEM_WIDTH + ITEM_SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [1, 1, 1],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: "clamp",
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [0, 0, 0],
      extrapolate: "clamp",
    });

    const isSelected = selectedLang === item.code;

    return (
      <Animated.View 
        style={[
          styles.langItem, 
          { 
            transform: [{ scale }, { translateY }], 
            opacity 
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => handleLanguageSelect(item.code, index)}
          style={[
            styles.langButton,
            {
              borderColor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.15)",
              backgroundColor: isSelected ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.02)",
            },
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.flagContainer}>
            <Text style={styles.flag}>{item.flag}</Text>
          </View>
          <Text
            style={[
              styles.langName,
              {
                color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)",
                fontWeight: isSelected ? "600" : "500",
              },
            ]}
          >
            {item.name}
          </Text>
          <Text style={styles.nativeName}>{item.nativeName}</Text>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <View style={styles.checkmark} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!showPrompt) return null;

  return (
    <Modal visible={showPrompt} transparent animationType="none">
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.9)" barStyle="light-content" />
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Premium header with gradient accent */}
          <View style={styles.header}>
            <View style={styles.brandAccent} />
            <Text style={styles.title}>Choose Your Language</Text>
            <Text style={styles.subtitle}>
              Select your preferred language for the best experience
            </Text>
          </View>

          {/* Language carousel */}
          <View style={styles.listContainer}>
            <Animated.FlatList
              ref={flatListRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={renderItem}
              snapToInterval={ITEM_WIDTH + ITEM_SPACING}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingHorizontal: (MODAL_WIDTH - ITEM_WIDTH) / 2,
                paddingVertical: 10, // Added vertical padding
              }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              snapToAlignment="center"
              style={{ 
                height: 160, // Increased height to accommodate larger items
                marginTop: 8 
              }}
            />
          </View>

          {/* Navigation indicator */}
          <View style={styles.indicatorContainer}>
            <View style={styles.scrollIndicator}>
              {languages.slice(0, 5).map((_, index) => (
                <View key={index} style={styles.dot} />
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.98)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
    borderRadius: 24,
    backgroundColor: "#0A0A0A",
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.6,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 12 },
    elevation: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  header: {
    alignItems: "center",
    paddingBottom: 16,
    position: "relative",
  },
  brandAccent: {
    width: 50,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "400",
  },
  listContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 30, // Increased bottom padding
    marginTop: 5, // Reduced top margin
  },
  langItem: {
    width: ITEM_WIDTH,
    height: 130,
    marginHorizontal: ITEM_SPACING / 2,
  },
  langButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 18, // Slightly increased padding
    paddingHorizontal: 12,
    borderWidth: 1.5,
    position: "relative",
    height: 130, // Equalized size for all items
    maxWidth: ITEM_WIDTH,
  },
  flagContainer: {
    marginBottom: 8,
    padding: 0,
    borderRadius: 10,
    backgroundColor: "transparent", // Remove internal shadow/overlay
  },
  flag: {
    fontSize: 28,
  },
  langName: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 2,
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  nativeName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
    fontWeight: "400",
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000000",
  },
  indicatorContainer: {
    alignItems: "center",
    paddingTop: 16, // Increased top padding
    paddingBottom: 8, // Added bottom padding
  },
  scrollIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 3,
  },
});

export default LanguagePrompt;