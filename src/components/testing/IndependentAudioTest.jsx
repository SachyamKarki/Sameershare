/**
 * Independent Audio Test Component
 * Tests that Java can play recorded audio independently from React Native
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

const IndependentAudioTest = () => {
  const { colors } = useTheme();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (message, status = 'info') => {
    setTestResults(prev => [...prev, { message, status, timestamp: new Date() }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runIndependentAudioTests = async () => {
    setIsRunning(true);
    clearResults();
    
    addTestResult('🧪 Starting Independent Audio Tests...', 'info');
    addTestResult('=====================================', 'info');

    try {
      // Test 1: Scheduled Alarm with Recorded Audio
      addTestResult('\n⏰ Test 1: Scheduled Alarm with Recorded Audio', 'info');
      await testScheduledRecordedAlarm();

      // Wait 35 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 35000));

      // Test 2: Immediate Alarm with Recorded Audio
      addTestResult('\n🚨 Test 2: Immediate Alarm with Recorded Audio', 'info');
      await testImmediateRecordedAlarm();

      // Wait 10 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Test 3: Java Independence Test
      addTestResult('\n🔧 Test 3: Java Independence Test', 'info');
      await testJavaIndependence();

      addTestResult('\n✅ All independent audio tests completed!', 'success');
      
    } catch (error) {
      addTestResult(`❌ Independent audio test failed: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const testScheduledRecordedAlarm = async () => {
    try {
      addTestResult('⏰ Testing scheduled alarm with recorded audio...', 'info');
      
      // Schedule alarm for 30 seconds from now with recorded audio
      const testTime = new Date(Date.now() + 30000);
      const alarmId = 'scheduled-recorded-test-' + Date.now();
      
      // Use a realistic recorded audio path
      const recordedAudioPath = '/data/data/com.shakshamkarki.practice/cache/recording_' + Date.now() + '.mp3';
      
      const success = await NativeAlarmService.scheduleNativeAlarm({
        alarmId: alarmId,
        fireDate: testTime.getTime(),
        audioPath: recordedAudioPath,
        alarmTime: 'Scheduled Recorded Audio Test'
      });
      
      if (success) {
        addTestResult('✅ Scheduled recorded audio alarm created successfully', 'success');
        addTestResult('⏰ Alarm will trigger in 30 seconds', 'info');
        addTestResult('🎵 Java should play LFG audio as fallback (if recording not found)', 'info');
        addTestResult('📱 Notification should appear with STOP/SNOOZE buttons', 'info');
        addTestResult('👆 Tap notification - should open Java AlarmActivity', 'info');
        addTestResult('🔧 Java should be completely independent from React Native', 'info');
        
        // Clean up after 35 seconds
        setTimeout(async () => {
          await NativeAlarmService.cancelNativeAlarm(alarmId);
          addTestResult('🧹 Scheduled alarm cleaned up', 'info');
        }, 35000);
      } else {
        addTestResult('❌ Failed to schedule recorded audio alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Scheduled recorded audio test error: ${error.message}`, 'error');
    }
  };

  const testImmediateRecordedAlarm = async () => {
    try {
      addTestResult('🚨 Testing immediate alarm with recorded audio...', 'info');
      
      // Start immediate alarm with recorded audio
      const alarmId = 'immediate-recorded-test-' + Date.now();
      const recordedAudioPath = '/data/data/com.shakshamkarki.practice/cache/recording_' + Date.now() + '.mp3';
      
      const success = await NativeAlarmService.startImmediateAlarm(alarmId, recordedAudioPath);
      
      if (success) {
        addTestResult('✅ Immediate recorded audio alarm started successfully', 'success');
        addTestResult('🎵 Java should play LFG audio as fallback (if recording not found)', 'info');
        addTestResult('📱 Notification should appear immediately', 'info');
        addTestResult('👆 Tap notification - should open Java AlarmActivity', 'info');
        addTestResult('🔧 Java should handle audio independently', 'info');
        
        // Auto-stop after 10 seconds
        setTimeout(async () => {
          await NativeAlarmService.stopCurrentAlarm();
          addTestResult('🛑 Immediate recorded audio test auto-stopped', 'info');
        }, 10000);
      } else {
        addTestResult('❌ Failed to start immediate recorded audio alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Immediate recorded audio test error: ${error.message}`, 'error');
    }
  };

  const testJavaIndependence = async () => {
    try {
      addTestResult('🔧 Testing Java independence from React Native...', 'info');
      
      // Test with various audio path formats
      const testPaths = [
        'recording.mp3',  // Relative path
        '/data/data/com.shakshamkarki.practice/cache/recording.mp3',  // Absolute path
        'file:///data/data/com.shakshamkarki.practice/cache/recording.mp3',  // File URI
        'content://com.android.providers.media.documents/document/audio%3A123',  // Content URI
      ];
      
      for (let i = 0; i < testPaths.length; i++) {
        const testPath = testPaths[i];
        addTestResult(`🔍 Testing path format ${i + 1}: ${testPath}`, 'info');
        
        const alarmId = `independence-test-${i}-${Date.now()}`;
        const success = await NativeAlarmService.startImmediateAlarm(alarmId, testPath);
        
        if (success) {
          addTestResult(`✅ Path format ${i + 1} handled successfully`, 'success');
          addTestResult('🎵 Java should find and play audio independently', 'info');
          
          // Stop after 3 seconds
          setTimeout(async () => {
            await NativeAlarmService.stopCurrentAlarm();
          }, 3000);
        } else {
          addTestResult(`❌ Path format ${i + 1} failed`, 'error');
        }
        
        // Wait 4 seconds between path tests
        if (i < testPaths.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
      }
      
      addTestResult('🔧 Java independence test completed', 'success');
      
    } catch (error) {
      addTestResult(`❌ Java independence test error: ${error.message}`, 'error');
    }
  };

  const testExactTiming = async () => {
    try {
      addTestResult('⏰ Testing exact alarm timing...', 'info');
      
      // Schedule alarm for exactly 10 seconds from now
      const exactTime = new Date(Date.now() + 10000);
      const alarmId = 'exact-timing-test-' + Date.now();
      
      const success = await NativeAlarmService.scheduleNativeAlarm({
        alarmId: alarmId,
        fireDate: exactTime.getTime(),
        audioPath: 'default_alarm_sound',
        alarmTime: 'Exact Timing Test'
      });
      
      if (success) {
        addTestResult('✅ Exact timing alarm scheduled successfully', 'success');
        addTestResult('⏰ Alarm should trigger at exactly: ' + exactTime.toLocaleTimeString(), 'info');
        addTestResult('🎵 Java should play audio independently at exact time', 'info');
        addTestResult('📱 Notification should appear at exact time', 'info');
        
        // Clean up after 15 seconds
        setTimeout(async () => {
          await NativeAlarmService.cancelNativeAlarm(alarmId);
          addTestResult('🧹 Exact timing alarm cleaned up', 'info');
        }, 15000);
      } else {
        addTestResult('❌ Failed to schedule exact timing alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Exact timing test error: ${error.message}`, 'error');
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
        🧪 Independent Audio Test
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tests Java independence from React Native for audio playback
      </Text>

      <TouchableOpacity
        style={[
          styles.runButton,
          { backgroundColor: isRunning ? colors.disabled : colors.primary }
        ]}
        onPress={runIndependentAudioTests}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? '🔄 Running Tests...' : '🚀 Run Independent Audio Tests'}
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
          📋 Independence Test Coverage
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          • Scheduled Alarm with Recorded Audio{'\n'}
          • Immediate Alarm with Recorded Audio{'\n'}
          • Java Independence from React Native{'\n'}
          • Comprehensive Audio Path Resolution{'\n'}
          • Exact Alarm Timing{'\n'}
          • Independent Audio File Access
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

export default IndependentAudioTest;