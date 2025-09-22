/**
 * Custom Alert System - Production-Ready Alert Components
 * 
 * Replaces React Native's Alert.alert with professional, consistent UI
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

// Alert type configurations
const ALERT_TYPES = {
  success: {
    icon: 'checkmark-circle',
    iconColor: '#4CAF50',
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  error: {
    icon: 'close-circle',
    iconColor: '#F44336',
    borderColor: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  warning: {
    icon: 'warning',
    iconColor: '#FF9800',
    borderColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  info: {
    icon: 'information-circle',
    iconColor: '#2196F3',
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  confirm: {
    icon: 'help-circle',
    iconColor: '#9C27B0',
    borderColor: '#9C27B0',
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
  },
};

// Global alert manager
class AlertManager {
  constructor() {
    this.alerts = [];
    this.listeners = [];
  }

  show(config) {
    const alertId = Date.now().toString();
    const alert = { id: alertId, ...config };
    this.alerts.push(alert);
    this.notifyListeners();
    return alertId;
  }

  hide(alertId) {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.notifyListeners();
  }

  hideAll() {
    this.alerts = [];
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.alerts));
  }
}

const alertManager = new AlertManager();

// Individual Alert Component
const AlertItem = ({ alert, onDismiss }) => {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const typeConfig = ALERT_TYPES[alert.type] || ALERT_TYPES.info;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss for simple alerts
    if (alert.autoDismiss && !alert.buttons) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, alert.autoDismissTimeout || 3000);
      return () => clearTimeout(timer);
    }

    // Handle hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (alert.cancelable !== false) {
        handleDismiss();
        return true;
      }
      return true; // Prevent back navigation
    });

    return () => backHandler.remove();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    }
    if (button.dismissOnPress !== false) {
      handleDismiss();
    }
  };

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ],
          }}
        >
          <BlurView
            intensity={20}
            style={{
              width: width * 0.85,
              maxWidth: 400,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: typeConfig.borderColor,
              overflow: 'hidden',
            }}
          >
            <View style={{
              backgroundColor: typeConfig.backgroundColor,
              padding: 24,
            }}>
              {/* Header with Icon */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: alert.message ? 16 : 8,
              }}>
                <Ionicons
                  name={typeConfig.icon}
                  size={28}
                  color={typeConfig.iconColor}
                />
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: 'white',
                  marginLeft: 12,
                  flex: 1,
                }}>
                  {alert.title || t('common.error')}
                </Text>
              </View>

              {/* Message */}
              {alert.message && (
                <Text style={{
                  fontSize: 16,
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: 22,
                  marginBottom: 20,
                }}>
                  {alert.message}
                </Text>
              )}

              {/* Buttons */}
              <View style={{
                flexDirection: alert.buttons?.length > 1 ? 'row' : 'column',
                justifyContent: 'flex-end',
                gap: 12,
              }}>
                {alert.buttons ? (
                  alert.buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleButtonPress(button)}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        borderRadius: 12,
                        backgroundColor: button.style === 'destructive' 
                          ? 'rgba(244, 67, 54, 0.2)' 
                          : button.style === 'default'
                          ? 'rgba(33, 150, 243, 0.2)'
                          : 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        borderColor: button.style === 'destructive' 
                          ? '#F44336' 
                          : button.style === 'default'
                          ? '#2196F3'
                          : 'rgba(255, 255, 255, 0.3)',
                        flex: alert.buttons.length > 1 ? 1 : 0,
                        minWidth: alert.buttons.length === 1 ? 100 : 0,
                      }}
                    >
                      <Text style={{
                        color: button.style === 'destructive' 
                          ? '#F44336' 
                          : button.style === 'default'
                          ? '#2196F3'
                          : 'white',
                        fontSize: 16,
                        fontWeight: '600',
                        textAlign: 'center',
                      }}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity
                    onPress={handleDismiss}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      backgroundColor: 'rgba(33, 150, 243, 0.2)',
                      borderWidth: 1,
                      borderColor: '#2196F3',
                      alignSelf: 'flex-end',
                      minWidth: 100,
                    }}
                  >
                    <Text style={{
                      color: '#2196F3',
                      fontSize: 16,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}>
                      {t('common.ok')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Alert Container Component
const AlertContainer = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubscribe = alertManager.subscribe(setAlerts);
    return unsubscribe;
  }, []);

  const handleDismiss = (alertId) => {
    alertManager.hide(alertId);
  };

  return (
    <>
      {alerts.map(alert => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onDismiss={() => handleDismiss(alert.id)}
        />
      ))}
    </>
  );
};

// Public API
export const CustomAlert = {
  // Success alert
  success: (title, message, buttons, options = {}) => {
    return alertManager.show({
      type: 'success',
      title,
      message,
      buttons,
      ...options,
    });
  },

  // Error alert
  error: (title, message, buttons, options = {}) => {
    return alertManager.show({
      type: 'error',
      title,
      message,
      buttons,
      ...options,
    });
  },

  // Warning alert
  warning: (title, message, buttons, options = {}) => {
    return alertManager.show({
      type: 'warning',
      title,
      message,
      buttons,
      ...options,
    });
  },

  // Info alert
  info: (title, message, buttons, options = {}) => {
    return alertManager.show({
      type: 'info',
      title,
      message,
      buttons,
      ...options,
    });
  },

  // Confirmation dialog
  confirm: (title, message, onConfirm, onCancel, options = {}) => {
    return alertManager.show({
      type: 'confirm',
      title,
      message,
      buttons: [
        { 
          text: 'Cancel', 
          style: 'cancel', 
          onPress: onCancel 
        },
        { 
          text: 'Confirm', 
          style: 'default', 
          onPress: onConfirm 
        },
      ],
      cancelable: false,
      ...options,
    });
  },

  // Simple notification (auto-dismiss)
  notify: (title, message, type = 'info', timeout = 3000) => {
    return alertManager.show({
      type,
      title,
      message,
      autoDismiss: true,
      autoDismissTimeout: timeout,
    });
  },

  // Custom alert with full control
  show: (config) => {
    return alertManager.show(config);
  },

  // Hide specific alert
  hide: (alertId) => {
    alertManager.hide(alertId);
  },

  // Hide all alerts
  hideAll: () => {
    alertManager.hideAll();
  },
};

export default AlertContainer;
