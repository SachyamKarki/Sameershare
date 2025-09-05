import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BatteryOptimizationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    checkShouldShowPrompt();
  }, []);

  const checkShouldShowPrompt = async () => {
    try {
      const dismissed = await AsyncStorage.getItem('batteryOptimizationDismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    } catch (error) {
      console.log('Error checking battery optimization prompt:', error);
    }
  };

  const handleOptimize = () => {
    Alert.alert(
      '🔋 Unlimited Alarm Access',
      'To ensure your alarms work perfectly:\n\n' +
      '1. Go to Settings > Battery\n' +
      '2. Find "Battery Optimization" or "App Battery Usage"\n' +
      '3. Find this app and set to "Don\'t optimize"\n' +
      '4. This allows unlimited alarm duration\n\n' +
      'Without this, Android may stop alarms after a few minutes.',
      [
        { text: 'Later', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            Linking.openSettings().catch(() => 
              Alert.alert('Error', 'Cannot open settings automatically. Please navigate manually.')
            );
          }
        }
      ]
    );
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem('batteryOptimizationDismissed', 'true');
      setShowPrompt(false);
    } catch (error) {
      console.log('Error dismissing battery optimization prompt:', error);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="battery-charging" size={24} color="#4CAF50" />
        <Text style={styles.title}>Unlimited Alarm Access</Text>
        <Text style={styles.message}>
          Enable unlimited alarm duration by disabling battery optimization for this app
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.optimizeButton} onPress={handleOptimize}>
            <Text style={styles.optimizeButtonText}>Enable Unlimited Access</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <Text style={styles.dismissButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  message: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optimizeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  optimizeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dismissButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  dismissButtonText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default BatteryOptimizationPrompt;
