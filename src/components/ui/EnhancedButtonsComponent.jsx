import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Decrease current size by 1/6 → ~22.2% of smaller screen dimension
const BUTTON_SIZE = Math.min(width, height) * 0.222;
const BUTTON_MARGIN = Math.min(width, height) * 0.03;

const EnhancedButtonsComponent = ({
  onSave,
  onDelete,
  saveDisabled = false,
  deleteDisabled = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSavePress = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onSave();
  };

  const handleDeletePress = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onDelete();
  };

  return (
    <Animated.View style={[styles.bottomButtons, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Save Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }], marginRight: BUTTON_MARGIN }}>
        <TouchableOpacity
          onPress={handleSavePress}
          style={[styles.saveButton, { width: BUTTON_SIZE, height: BUTTON_SIZE }, saveDisabled && styles.disabledButton]}
          activeOpacity={0.8}
          disabled={saveDisabled}
        >
          <LinearGradient
            colors={saveDisabled ? ['#888', '#666'] : ['#F59E0B', '#D97706']}
            style={styles.saveButtonGradient}
          >
            <Ionicons name="alarm" size={BUTTON_SIZE * 0.5} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Delete Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handleDeletePress}
          style={[styles.deleteButton, { width: BUTTON_SIZE, height: BUTTON_SIZE }, deleteDisabled && styles.disabledButton]}
          activeOpacity={0.8}
          disabled={deleteDisabled}
        >
          <LinearGradient
            colors={deleteDisabled ? ['#888', '#666'] : ['#8B0000', '#B22222']}
            style={styles.deleteButtonGradient}
          >
            <Ionicons name="trash" size={BUTTON_SIZE * 0.45} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 43,
    marginTop: 110,
  },
  saveButton: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  deleteButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default EnhancedButtonsComponent;
