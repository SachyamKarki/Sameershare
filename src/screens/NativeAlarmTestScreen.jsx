/**
 * Native Alarm Test Screen
 * 
 * Demonstration screen for testing native alarm functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NativeAlarmService from '../services/NativeAlarmService';
import NotificationService from '../services/NotificationService';
import { useAlarm } from '../context/AlarmContext';
import { Toast, CustomAlert, BackgroundComponent } from '../components';
import { useTheme } from '../context';

const NativeAlarmTestScreen = () => {
  const navigation = useNavigation();
  const { colors, darkMode } = useTheme();
  const [isNativeAvailable, setIsNativeAvailable] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const { recordings } = useAlarm();

  useEffect(() => {
    checkNativeAlarmStatus();
  }, []);

  const checkNativeAlarmStatus = async () => {
    const available = NativeAlarmService.isAvailable();
    setIsNativeAvailable(available);

    if (available) {
      const permissions = await NativeAlarmService.checkAlarmPermissions();
      setHasPermissions(permissions);
    }
  };

  const addTestResult = (message, success = true) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, success, timestamp }]);
  };

  const testImmediateAlarm = async () => {
    try {
      addTestResult('🚨 Starting IMMEDIATE alarm test...');
      
      const testAudioUri = recordings.length > 0 ? recordings[0].uri : '';
      const success = await NativeAlarmService.startImmediateAlarm('immediate-test-alarm', testAudioUri);
      
      if (success) {
        addTestResult('✅ IMMEDIATE alarm started! Check if audio is playing.', true);
        // Show success toast instead of blocking alert
        Toast.success('🚨 Alarm Started!', 'Audio should be playing now');
        addTestResult('💡 Try terminating the app - audio should continue playing', true);
        addTestResult('🛑 Use Stop button below to end test when done', true);
      } else {
        addTestResult('❌ Failed to start immediate alarm', false);
      }
    } catch (error) {
      addTestResult(`❌ Immediate alarm error: ${error.message}`, false);
    }
  };

  const stopCurrentAlarm = async () => {
    try {
      addTestResult('🛑 Stopping current alarm...');
      const success = await NativeAlarmService.stopCurrentAlarm();
      
      if (success) {
        addTestResult('✅ Alarm stopped successfully', true);
      } else {
        addTestResult('⚠️ Stop command sent (may have already stopped)', true);
      }
    } catch (error) {
      addTestResult(`❌ Stop alarm error: ${error.message}`, false);
    }
  };

  const testBasicNativeAlarm = async () => {
    try {
      addTestResult('🧪 Testing basic native alarm...');

      // Schedule alarm for 30 seconds from now
      const testDate = new Date();
      testDate.setSeconds(testDate.getSeconds() + 30);

      const success = await NativeAlarmService.scheduleNativeAlarm({
        alarmId: 'test-basic-' + Date.now(),
        fireDate: testDate.getTime(),
        audioPath: '', // Use default system sound
        alarmTime: 'Basic Test Alarm',
      });

      if (success) {
        addTestResult(`✅ Basic alarm scheduled for ${testDate.toLocaleTimeString()}`);
        addTestResult('📱 This alarm will work even if you force-close the app!');
      } else {
        addTestResult('❌ Failed to schedule basic alarm', false);
      }
    } catch (error) {
      addTestResult(`❌ Error: ${error.message}`, false);
    }
  };

  const testCustomAudioAlarm = async () => {
    try {
      if (recordings.length === 0) {
        Toast.warning('No Recordings', 'Please record some audio first to test custom audio alarms.');
        return;
      }

      addTestResult('🎵 Testing custom audio alarm...');

      // Use the first available recording
      const recording = recordings[0];
      let audioPath = '';
      
      if (recording.uri && recording.uri.startsWith('file://')) {
        audioPath = recording.uri.replace('file://', '');
      }

      // Schedule alarm for 1 minute from now
      const testDate = new Date();
      testDate.setMinutes(testDate.getMinutes() + 1);

      const success = await NativeAlarmService.scheduleNativeAlarm({
        alarmId: 'test-custom-' + Date.now(),
        fireDate: testDate.getTime(),
        audioPath: audioPath,
        alarmTime: 'Custom Audio Test',
      });

      if (success) {
        addTestResult(`✅ Custom audio alarm scheduled for ${testDate.toLocaleTimeString()}`);
        addTestResult(`🎵 Using recording: ${recording.name || 'Unnamed'}`);
        addTestResult('🚨 Force-close the app and the alarm will STILL play your custom audio!');
      } else {
        addTestResult('❌ Failed to schedule custom audio alarm', false);
      }
    } catch (error) {
      addTestResult(`❌ Error: ${error.message}`, false);
    }
  };

  const testEnhancedAlarms = async () => {
    try {
      addTestResult('🚀 Testing enhanced alarm system...');

      // Schedule using the enhanced method (Expo + Native)
      const result = await NotificationService.scheduleEnhancedAlarmsForDays({
        hour24: new Date().getHours(),
        minute: new Date().getMinutes() + 2, // 2 minutes from now
        alarmId: 'test-enhanced-' + Date.now(),
        audioUri: recordings.length > 0 ? recordings[0].uri : '',
        displayHour: new Date().getHours() > 12 ? new Date().getHours() - 12 : new Date().getHours(),
        displayMinute: new Date().getMinutes() + 2,
        displayAmPm: new Date().getHours() >= 12 ? 'PM' : 'AM',
        days: [new Date().getDay()], // Today
      });

      if (result.success) {
        addTestResult(`✅ Enhanced alarms scheduled!`);
        addTestResult(`📱 Expo notifications: ${result.expoIds.length}`);
        addTestResult(`🔥 Native alarms: ${result.nativeIds.length}`);
        addTestResult('💪 DOUBLE PROTECTION: Works both when app is running AND terminated!');
      } else {
        addTestResult('❌ Failed to schedule enhanced alarms', false);
      }
    } catch (error) {
      addTestResult(`❌ Error: ${error.message}`, false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const cancelAllAlarms = async () => {
    try {
      addTestResult('🧹 CLEARING ALL ALARMS (fixing 500 limit error)...');
      const success = await NativeAlarmService.cancelAllAlarms();
      
      if (success) {
        addTestResult('✅ ALL ALARMS CLEARED! 500 limit error should be fixed.', true);
        Toast.success('✅ Success!', 'All alarms cleared. 500 limit error should be fixed.');
      } else {
        addTestResult('⚠️ Clear command sent (some alarms may have been cleared)', true);
      }
    } catch (error) {
      addTestResult(`❌ Clear alarms error: ${error.message}`, false);
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <BackgroundComponent>
        <View style={styles.container}>
          <Text style={styles.title}>Native Alarm Test</Text>
          <Text style={styles.error}>
            Native alarms are only available on Android
          </Text>
        </View>
      </BackgroundComponent>
    );
  }

  const styles = createStyles(colors);

  return (
    <BackgroundComponent>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} translucent={false} hidden={false} />
      <ScrollView style={styles.container}>
      <Text style={styles.title}>🚨 Native Alarm Test</Text>
      
      {/* Status Section */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>📊 System Status</Text>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Native Module:</Text>
          <Text style={[styles.statusValue, isNativeAvailable ? styles.success : styles.error]}>
            {isNativeAvailable ? '✅ Available' : '❌ Not Available'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Alarm Permissions:</Text>
          <Text style={[styles.statusValue, hasPermissions ? styles.success : styles.error]}>
            {hasPermissions ? '✅ Granted' : '❌ Not Granted'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Recordings Available:</Text>
          <Text style={styles.statusValue}>{recordings.length}</Text>
        </View>
      </View>

      {/* Battery Optimization Setup */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔋 Battery Optimization Setup</Text>
        <TouchableOpacity
          style={styles.setupButton}
          onPress={() => navigation.navigate('BatteryOptimization')}
        >
          <Text style={styles.setupButtonText}>🛠️ Open Battery Setup Guide</Text>
        </TouchableOpacity>
        <Text style={styles.sectionSubtitle}>
          Configure your device for reliable alarms (recommended for all users)
        </Text>
      </View>

      {/* Permission Warning */}
      {!hasPermissions && (
        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ Permissions Required</Text>
          <Text style={styles.warningText}>
            To test native alarms, go to:
            {'\n'}Settings → Apps → Alarm Clock → Special app access → Schedule exact alarms → Allow
          </Text>
        </View>
      )}

      {/* Test Buttons */}
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>🧪 Test Functions</Text>
        
        <TouchableOpacity 
          style={[styles.immediateButton, !isNativeAvailable && styles.disabledButton]}
          onPress={testImmediateAlarm}
          disabled={!isNativeAvailable}
        >
          <Text style={styles.immediateButtonText}>🚨 IMMEDIATE ALARM TEST</Text>
          <Text style={styles.immediateButtonSubtext}>Start alarm NOW (no waiting)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.stopButton]}
          onPress={stopCurrentAlarm}
        >
          <Text style={styles.stopButtonText}>🛑 STOP CURRENT ALARM</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.testButton, !isNativeAvailable && styles.disabledButton]}
          onPress={testBasicNativeAlarm}
          disabled={!isNativeAvailable}
        >
          <Text style={styles.buttonText}>Test Basic Native Alarm (30s)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, (!isNativeAvailable || recordings.length === 0) && styles.disabledButton]}
          onPress={testCustomAudioAlarm}
          disabled={!isNativeAvailable || recordings.length === 0}
        >
          <Text style={styles.buttonText}>Test Custom Audio Alarm (1m)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, !isNativeAvailable && styles.disabledButton]}
          onPress={testEnhancedAlarms}
          disabled={!isNativeAvailable}
        >
          <Text style={styles.buttonText}>Test Enhanced Alarms (2m)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={cancelAllAlarms}
        >
          <Text style={styles.emergencyButtonText}>🧹 CLEAR ALL ALARMS (Fix 500 Limit)</Text>
          <Text style={styles.emergencyButtonSubtext}>Use this if you get "500 alarms" error</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearTestResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      {testResults.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>📋 Test Results</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.resultTime}>{result.timestamp}</Text>
              <Text style={[styles.resultText, !result.success && styles.error]}>
                {result.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>📋 Testing Instructions</Text>
        <Text style={styles.instructionText}>
          1. Ensure permissions are granted{'\n'}
          2. Schedule a test alarm{'\n'}
          3. Force-close the app (swipe away from recent apps){'\n'}
          4. Wait for the alarm time{'\n'}
          5. The alarm WILL ring even though the app is closed!{'\n'}
          6. Your custom recordings will play perfectly! 🎵
        </Text>
      </View>
    </ScrollView>
    </BackgroundComponent>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA500',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 10,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statusLabel: {
    color: colors.text,
    fontSize: 16,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#F44336',
  },
  warningSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderColor: '#FFA500',
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 5,
  },
  warningText: {
    color: colors.text,
    fontSize: 14,
  },
  setupButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  setupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: '#BBB',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  testSection: {
    marginBottom: 20,
  },
  immediateButton: {
    backgroundColor: '#FF4444',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6666',
  },
  immediateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  immediateButtonSubtext: {
    color: '#FFB3B3',
    fontSize: 12,
    marginTop: 4,
  },
  stopButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  stopButtonText: {
    color: '#FF6666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  emergencyButton: {
    backgroundColor: '#FF8C00',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emergencyButtonSubtext: {
    color: '#FFE4B5',
    fontSize: 12,
    marginTop: 4,
  },
  clearButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
  },
  resultItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  resultTime: {
    color: '#888',
    fontSize: 12,
  },
  resultText: {
    color: '#FFF',
    fontSize: 14,
  },
  instructionsSection: {
    padding: 15,
    backgroundColor: '#111',
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NativeAlarmTestScreen;

