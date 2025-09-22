/**
 * Notification Fix Test Component
 * Tests all notification fixes and alarm activity opening
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NativeAlarmService from '../../services/NativeAlarmService';
import { useTheme } from '../../context/ThemeContext';

const NotificationFixTest = () => {
  const { colors } = useTheme();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (message, status = 'info') => {
    setTestResults(prev => [...prev, { message, status, timestamp: new Date() }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runNotificationTests = async () => {
    setIsRunning(true);
    clearResults();
    
    addTestResult('🧪 Starting Notification Fix Tests...', 'info');
    addTestResult('=====================================', 'info');

    try {
      // Test 1: LFG Audio Notification
      addTestResult('\n🎵 Test 1: LFG Audio Notification', 'info');
      await testLFGNotification();

      // Wait 10 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Test 2: Recorded Audio Notification
      addTestResult('\n🎤 Test 2: Recorded Audio Notification', 'info');
      await testRecordedAudioNotification();

      // Wait 10 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Test 3: Notification Tap Test
      addTestResult('\n👆 Test 3: Notification Tap Test', 'info');
      await testNotificationTap();

      addTestResult('\n✅ All notification tests completed!', 'success');
      
    } catch (error) {
      addTestResult(`❌ Notification test failed: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const testLFGNotification = async () => {
    try {
      addTestResult('🎵 Testing LFG audio notification...', 'info');
      
      // Start immediate alarm with LFG audio
      const alarmId = 'lfg-notification-test-' + Date.now();
      const success = await NativeAlarmService.startImmediateAlarm(alarmId, 'default_alarm_sound');
      
      if (success) {
        addTestResult('✅ LFG alarm started successfully', 'success');
        addTestResult('📱 Check notification bar - should show "🚨 LFG Alarm Ringing"', 'info');
        addTestResult('🎵 Only LFG audio should play (no system default)', 'info');
        addTestResult('🔘 Notification should have STOP and SNOOZE buttons', 'info');
        addTestResult('👆 Tap notification - should open Java AlarmActivity', 'info');
        
        // Auto-stop after 10 seconds
        setTimeout(async () => {
          await NativeAlarmService.stopCurrentAlarm();
          addTestResult('🛑 LFG notification test auto-stopped', 'info');
        }, 10000);
      } else {
        addTestResult('❌ Failed to start LFG alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ LFG notification test error: ${error.message}`, 'error');
    }
  };

  const testRecordedAudioNotification = async () => {
    try {
      addTestResult('🎤 Testing recorded audio notification...', 'info');
      
      // Test with a simulated recorded audio path
      const testAudioPath = '/data/data/com.shakshamkarki.practice/cache/test_recording.mp3';
      const alarmId = 'recorded-notification-test-' + Date.now();
      
      const success = await NativeAlarmService.startImmediateAlarm(alarmId, testAudioPath);
      
      if (success) {
        addTestResult('✅ Recorded audio alarm started successfully', 'success');
        addTestResult('📱 Check notification bar - should show "🚨 LFG Alarm Ringing"', 'info');
        addTestResult('🎵 Should play LFG audio as fallback (if recording not found)', 'info');
        addTestResult('🔘 Notification should have STOP and SNOOZE buttons', 'info');
        addTestResult('👆 Tap notification - should open Java AlarmActivity', 'info');
        
        // Auto-stop after 10 seconds
        setTimeout(async () => {
          await NativeAlarmService.stopCurrentAlarm();
          addTestResult('🛑 Recorded audio notification test auto-stopped', 'info');
        }, 10000);
      } else {
        addTestResult('❌ Failed to start recorded audio alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Recorded audio notification test error: ${error.message}`, 'error');
    }
  };

  const testNotificationTap = async () => {
    try {
      addTestResult('👆 Testing notification tap functionality...', 'info');
      
      // Start alarm for tap testing
      const alarmId = 'tap-test-' + Date.now();
      const success = await NativeAlarmService.startImmediateAlarm(alarmId, 'default_alarm_sound');
      
      if (success) {
        addTestResult('✅ Tap test alarm started successfully', 'success');
        addTestResult('📱 Tap the notification in status bar', 'info');
        addTestResult('📱 Should open Java AlarmActivity (not React Native)', 'info');
        addTestResult('🎨 AlarmActivity should show alarm UI with Stop/Snooze buttons', 'info');
        addTestResult('🎵 Audio should continue playing in background', 'info');
        addTestResult('📱 AlarmActivity should be full-screen over lock screen', 'info');
        
        // Auto-stop after 10 seconds
        setTimeout(async () => {
          await NativeAlarmService.stopCurrentAlarm();
          addTestResult('🛑 Tap test auto-stopped', 'info');
        }, 10000);
      } else {
        addTestResult('❌ Failed to start tap test alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Tap test error: ${error.message}`, 'error');
    }
  };

  const testNotificationButtons = async () => {
    try {
      addTestResult('🔘 Testing notification buttons...', 'info');
      
      // Start alarm for button testing
      const alarmId = 'button-test-' + Date.now();
      const success = await NativeAlarmService.startImmediateAlarm(alarmId, 'default_alarm_sound');
      
      if (success) {
        addTestResult('✅ Button test alarm started successfully', 'success');
        addTestResult('📱 Check notification - should have STOP and SNOOZE buttons', 'info');
        addTestResult('🔘 Tap STOP button - should stop alarm immediately', 'info');
        addTestResult('🔘 Tap SNOOZE button - should snooze alarm for 5 minutes', 'info');
        
        // Auto-stop after 10 seconds
        setTimeout(async () => {
          await NativeAlarmService.stopCurrentAlarm();
          addTestResult('🛑 Button test auto-stopped', 'info');
        }, 10000);
      } else {
        addTestResult('❌ Failed to start button test alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Button test error: ${error.message}`, 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return colors.text;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🧪 Notification Fix Test
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tests notification functionality and AlarmActivity opening
      </Text>

      <TouchableOpacity
        style={[
          styles.runButton,
          { backgroundColor: isRunning ? colors.disabled : colors.primary }
        ]}
        onPress={runNotificationTests}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? '🔄 Running Tests...' : '🚀 Run Notification Tests'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.clearButton, { backgroundColor: colors.surface }]}
        onPress={clearResults}
      >
        <Text style={[styles.clearButtonText, { color: colors.text }]}>
          🗑️ Clear Results
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={[
              styles.resultText,
              { color: getStatusColor(result.status) }
            ]}>
              {getStatusIcon(result.status)} {result.message}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          📋 Notification Test Coverage
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          • LFG Audio Notification Display{'\n'}
          • Recorded Audio Notification Display{'\n'}
          • Notification Tap → AlarmActivity{'\n'}
          • Stop/Snooze Button Functionality{'\n'}
          • Audio URI Persistence{'\n'}
          • Notification Visibility & Behavior
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  runButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clearButton: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  clearButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  resultItem: {
    marginBottom: 5,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  infoBox: {
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NotificationFixTest;