/**
 * Complete Alarm Flow Test Component
 * Tests the entire alarm flow from React Native to Java
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

const CompleteAlarmFlowTest = () => {
  const { colors } = useTheme();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (message, status = 'info') => {
    setTestResults(prev => [...prev, { message, status, timestamp: new Date() }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runCompleteFlowTest = async () => {
    setIsRunning(true);
    clearResults();
    
    addTestResult('🧪 Starting Complete Alarm Flow Test...', 'info');
    addTestResult('=====================================', 'info');

    try {
      // Test 1: LFG Audio Flow
      addTestResult('\n🎵 Test 1: LFG Audio Complete Flow', 'info');
      await testLFGAudioFlow();

      // Wait 8 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Test 2: Recorded Audio Flow
      addTestResult('\n🎤 Test 2: Recorded Audio Complete Flow', 'info');
      await testRecordedAudioFlow();

      // Wait 8 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Test 3: Notification Tap Flow
      addTestResult('\n👆 Test 3: Notification Tap Flow', 'info');
      await testNotificationTapFlow();

      addTestResult('\n✅ All flow tests completed!', 'success');
      
    } catch (error) {
      addTestResult(`❌ Flow test failed: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const testLFGAudioFlow = async () => {
    try {
      addTestResult('🎵 Testing LFG audio complete flow...', 'info');
      
      // Start immediate alarm with LFG audio
      const alarmId = 'lfg-flow-test-' + Date.now();
      const success = await NativeAlarmService.startImmediateAlarm(alarmId, 'default_alarm_sound');
      
      if (success) {
        addTestResult('✅ LFG alarm started successfully', 'success');
        addTestResult('📱 Check notification - should show LFG alarm', 'info');
        addTestResult('🎵 Only LFG audio should play (no system default)', 'info');
        addTestResult('👆 Tap notification - should open Java AlarmActivity', 'info');
        addTestResult('🔘 Use Stop/Snooze buttons - should work properly', 'info');
        
        // Auto-stop after 8 seconds
        setTimeout(async () => {
          await NativeAlarmService.stopCurrentAlarm();
          addTestResult('🛑 LFG flow test auto-stopped', 'info');
        }, 8000);
      } else {
        addTestResult('❌ Failed to start LFG alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ LFG flow test error: ${error.message}`, 'error');
    }
  };

  const testRecordedAudioFlow = async () => {
    try {
      addTestResult('🎤 Testing recorded audio complete flow...', 'info');
      
      // Test with a simulated recorded audio path
      const testAudioPath = '/data/data/com.shakshamkarki.practice/cache/test_recording.mp3';
      const alarmId = 'recorded-flow-test-' + Date.now();
      
      const success = await NativeAlarmService.startImmediateAlarm(alarmId, testAudioPath);
      
      if (success) {
        addTestResult('✅ Recorded audio alarm started successfully', 'success');
        addTestResult('📱 Check notification - should show recorded audio alarm', 'info');
        addTestResult('🎵 Should play LFG audio as fallback (if recording not found)', 'info');
        addTestResult('👆 Tap notification - should open Java AlarmActivity', 'info');
        addTestResult('🔘 Use Stop/Snooze buttons - should work properly', 'info');
        
        // Auto-stop after 8 seconds
        setTimeout(async () => {
          await NativeAlarmService.stopCurrentAlarm();
          addTestResult('🛑 Recorded audio flow test auto-stopped', 'info');
        }, 8000);
      } else {
        addTestResult('❌ Failed to start recorded audio alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Recorded audio flow test error: ${error.message}`, 'error');
    }
  };

  const testNotificationTapFlow = async () => {
    try {
      addTestResult('👆 Testing notification tap flow...', 'info');
      
      // Start alarm for tap testing
      const alarmId = 'tap-flow-test-' + Date.now();
      const success = await NativeAlarmService.startImmediateAlarm(alarmId, 'default_alarm_sound');
      
      if (success) {
        addTestResult('✅ Tap test alarm started successfully', 'success');
        addTestResult('📱 Tap the notification in status bar', 'info');
        addTestResult('📱 Should open Java AlarmActivity (not React Native)', 'info');
        addTestResult('🎨 AlarmActivity should show alarm UI with Stop/Snooze buttons', 'info');
        addTestResult('🎵 Audio should continue playing in background', 'info');
        
        // Auto-stop after 8 seconds
        setTimeout(async () => {
          await NativeAlarmService.stopCurrentAlarm();
          addTestResult('🛑 Tap flow test auto-stopped', 'info');
        }, 8000);
      } else {
        addTestResult('❌ Failed to start tap test alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Tap flow test error: ${error.message}`, 'error');
    }
  };

  const testScheduledAlarmFlow = async () => {
    try {
      addTestResult('⏰ Testing scheduled alarm flow...', 'info');
      
      // Schedule alarm for 30 seconds from now
      const testTime = new Date(Date.now() + 30000);
      const alarmId = 'scheduled-flow-test-' + Date.now();
      
      const success = await NativeAlarmService.scheduleNativeAlarm({
        alarmId: alarmId,
        fireDate: testTime.getTime(),
        audioPath: 'default_alarm_sound',
        alarmTime: 'Scheduled Flow Test'
      });
      
      if (success) {
        addTestResult('✅ Scheduled alarm created successfully', 'success');
        addTestResult('⏰ Alarm will trigger in 30 seconds', 'info');
        addTestResult('📱 Should show notification with LFG audio', 'info');
        addTestResult('👆 Tap notification - should open Java AlarmActivity', 'info');
        
        // Clean up after 35 seconds
        setTimeout(async () => {
          await NativeAlarmService.cancelNativeAlarm(alarmId);
          addTestResult('🧹 Scheduled alarm cleaned up', 'info');
        }, 35000);
      } else {
        addTestResult('❌ Failed to schedule alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Scheduled alarm flow test error: ${error.message}`, 'error');
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
        🧪 Complete Alarm Flow Test
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tests React Native → Java alarm flow
      </Text>

      <TouchableOpacity
        style={[
          styles.runButton,
          { backgroundColor: isRunning ? colors.disabled : colors.primary }
        ]}
        onPress={runCompleteFlowTest}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? '🔄 Running Tests...' : '🚀 Run Complete Flow Test'}
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
          📋 Flow Test Coverage
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          • LFG Audio Complete Flow{'\n'}
          • Recorded Audio Complete Flow{'\n'}
          • Notification Tap → Java AlarmActivity{'\n'}
          • Stop/Snooze Button Functionality{'\n'}
          • Audio Conflict Prevention
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

export default CompleteAlarmFlowTest;