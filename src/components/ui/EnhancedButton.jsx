// EnhancedButton.js
// Professional gradient buttons with animations

import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const EnhancedButton = ({
  title,
  onPress,
  type = 'primary', // 'primary', 'success', 'danger'
  iconName,
  iconSize = 24,
  style,
  textStyle,
  disabled = false,
  ...props
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!disabled) {
      animatePress();
      onPress && onPress();
    }
  };

  const getGradientColors = () => {
    switch (type) {
      case 'success':
        return ['#4CAF50', '#45A049'];
      case 'danger':
        return ['rgba(255,69,58,0.8)', 'rgba(255,69,58,0.6)'];
      case 'primary':
      default:
        return ['#3B82F6', '#2563EB'];
    }
  };

  const getShadowColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'danger':
        return '#FF453A';
      case 'primary':
      default:
        return '#3B82F6';
    }
  };

  return (
    <Animated.View style={[
      styles.container,
      { transform: [{ scale: pulseAnim }] },
      style
    ]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={disabled}
        style={[
          styles.button,
          {
            shadowColor: getShadowColor(),
            opacity: disabled ? 0.6 : 1,
          }
        ]}
        {...props}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {iconName && (
            <Ionicons 
              name={iconName} 
              size={iconSize} 
              color="white" 
              style={styles.icon}
            />
          )}
          <Text style={[styles.buttonText, textStyle]}>
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default EnhancedButton;
