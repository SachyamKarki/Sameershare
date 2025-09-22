/**
 * Toast Notification System - Production-Ready Toast Messages
 * 
 * For simple, non-blocking notifications that auto-dismiss
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Toast type configurations
const TOAST_TYPES = {
  success: {
    icon: 'checkmark-circle',
    iconColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  error: {
    icon: 'close-circle',
    iconColor: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  warning: {
    icon: 'warning',
    iconColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
  },
  info: {
    icon: 'information-circle',
    iconColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
  },
};

// Global toast manager
class ToastManager {
  constructor() {
    this.toasts = [];
    this.listeners = [];
  }

  show(config) {
    const toastId = Date.now().toString();
    const toast = { 
      id: toastId, 
      duration: 3000,
      ...config 
    };
    this.toasts.push(toast);
    this.notifyListeners();
    
    // Auto-remove after duration
    setTimeout(() => {
      this.hide(toastId);
    }, toast.duration);
    
    return toastId;
  }

  hide(toastId) {
    this.toasts = this.toasts.filter(toast => toast.id !== toastId);
    this.notifyListeners();
  }

  hideAll() {
    this.toasts = [];
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}

const toastManager = new ToastManager();

// Individual Toast Component
const ToastItem = ({ toast, onDismiss, index }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const typeConfig = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60 + (index * 80), // Stack multiple toasts
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <TouchableOpacity
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        <BlurView
          intensity={20}
          style={{
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <View style={{
            backgroundColor: typeConfig.backgroundColor,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 56,
          }}>
            <Ionicons
              name={typeConfig.icon}
              size={24}
              color="white"
              style={{ marginRight: 12 }}
            />
            
            <View style={{ flex: 1 }}>
              {toast.title && (
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: toast.message ? 2 : 0,
                }}>
                  {toast.title}
                </Text>
              )}
              
              {toast.message && (
                <Text style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: 14,
                  lineHeight: 18,
                }}>
                  {toast.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleDismiss}
              style={{
                padding: 4,
                marginLeft: 8,
              }}
            >
              <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.8)" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Toast Container Component
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const handleDismiss = (toastId) => {
    toastManager.hide(toastId);
  };

  return (
    <>
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={() => handleDismiss(toast.id)}
        />
      ))}
    </>
  );
};

// Public API
export const Toast = {
  // Success toast
  success: (title, message, duration = 3000) => {
    return toastManager.show({
      type: 'success',
      title,
      message,
      duration,
    });
  },

  // Error toast
  error: (title, message, duration = 4000) => {
    return toastManager.show({
      type: 'error',
      title,
      message,
      duration,
    });
  },

  // Warning toast
  warning: (title, message, duration = 3500) => {
    return toastManager.show({
      type: 'warning',
      title,
      message,
      duration,
    });
  },

  // Info toast
  info: (title, message, duration = 3000) => {
    return toastManager.show({
      type: 'info',
      title,
      message,
      duration,
    });
  },

  // Simple message toast
  show: (message, type = 'info', duration = 3000) => {
    return toastManager.show({
      type,
      message,
      duration,
    });
  },

  // Custom toast with full control
  custom: (config) => {
    return toastManager.show(config);
  },

  // Hide specific toast
  hide: (toastId) => {
    toastManager.hide(toastId);
  },

  // Hide all toasts
  hideAll: () => {
    toastManager.hideAll();
  },
};

export default ToastContainer;
