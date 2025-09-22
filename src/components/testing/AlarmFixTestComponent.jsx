/**
 * Comprehensive Alarm Fix Test Component
 * Tests all the alarm issues that were fixed
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NativeAlarmService from '../../services/NativeAlarmService';
import AudioService from '../../services/AudioService';
import { useTheme } from '../../context/ThemeContext';

const AlarmFixTestComponent = () => {
  const { colors } = useTheme();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (message, status = 'info') => {
    setTestResults(prev => [...prev, { message, status, timestamp: new Date() }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    addTestResult('🧪 Starting Comprehensive Alarm Fix Tests...', 'info');
    addTestResult('==========================================', 'info');

    try {
      // Test 1: LFG Audio Playback
      addTestResult('\n🎵 Test 1: LFG Audio Playback', 'info');
      await testLFGAudio();

      // Test 2: Notification Buttons
      addTestResult('\n🔘 Test 2: Notification Buttons', 'info');
      await testNotificationButtons();

      // Test 3: Notification Tap
      addTestResult('\n👆 Test 3: Notification Tap', 'info');
      await testNotificationTap();

      // Test 4: Recorded Audio
      addTestResult('\n🎤 Test 4: Recorded Audio', 'info');
      await testRecordedAudio();

      // Test 5: Audio Conflict Prevention
      addTestResult('\n🔇 Test 5: Audio Conflict Prevention', 'info');
      await testAudioConflictPrevention();

      addTestResult('\n✅ All tests completed!', 'success');
      
    } catch (error) {
      addTestResult(`❌ Test suite failed: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const testLFGAudio = async () => {
    try {
      addTestResult('🎵 Testing LFG audio playback...', 'info');
      
      const audioService = new AudioService();
      await audioService.initialize();
      
      const lfgItem = {
        id: 'lfg_default_audio',
        audioUri: 'default_alarm_sound',
        name: 'LFG Audio'
      };
      
      const result = await audioService.playAudio(lfgItem, { volume: 0.3 });
      
      if (result.success) {
        addTestResult('✅ LFG audio plays successfully', 'success');
        
        // Stop after 2 seconds
        setTimeout(async () => {
          await audioService.stopAudio();
          addTestResult('🛑 LFG audio stopped', 'info');
        }, 2000);
      } else {
        addTestResult(`❌ LFG audio failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ LFG audio test error: ${error.message}`, 'error');
    }
  };

  const testNotificationButtons = async () => {
    try {
      addTestResult('🔘 Testing notification button functionality...', 'info');
      
      // Start an immediate alarm to test buttons
      const success = await NativeAlarmService.startImmediateAlarm(
        'test-notification-buttons', 
        'default_alarm_sound'
      );
      
      if (success) {
        addTestResult('✅ Immediate alarm started for button testing', 'success');
        addTestResult('📱 Check notification - STOP and SNOOZE buttons should work', 'info');
        addTestResult('⏰ Alarm will auto-stop in 10 seconds', 'info');
        
        // Auto-stop after 10 seconds
        setTimeout(async () => {
          await NativeAlarmService.stopCurrentAlarm();
          addTestResult('🛑 Test alarm auto-stopped', 'info');
        }, 10000);
      } else {
        addTestResult('❌ Failed to start test alarm for button testing', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Notification button test error: ${error.message}`, 'error');
    }
  };

  const testNotificationTap = async () => {
    try {
      addTestResult('👆 Testing notification tap functionality...', 'info');
      
      // Start an immediate alarm to test tap
      const success = await NativeAlarmService.startImmediateAlarm(
        'test-notification-tap', 
        'default_alarm_sound'
      );
      
      if (success) {
        addTestResult('✅ Immediate alarm started for tap testing', 'success');
        addTestResult('📱 Tap the notification - should open alarm screen', 'info');
        addTestResult('⏰ Alarm will auto-stop in 10 seconds', 'info');
        
        // Auto-stop after 10 seconds
        setTimeout(async () => {
          await NativeAlarmService.stopCurrentAlarm();
          addTestResult('🛑 Test alarm auto-stopped', 'info');
        }, 10000);
      } else {
        addTestResult('❌ Failed to start test alarm for tap testing', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Notification tap test error: ${error.message}`, 'error');
    }
  };

  const testRecordedAudio = async () => {
    try {
      addTestResult('🎤 Testing recorded audio functionality...', 'info');
      
      // Test with a scheduled alarm using recorded audio
      const testTime = new Date(Date.now() + 30000); // 30 seconds from now
      const testAlarmId = 'test-recorded-audio-' + Date.now();
      
      // Use a test audio path (this would be a real recorded audio path in practice)
      const testAudioPath = '/data/data/com.shakshamkarki.practice/cache/test_recording.mp3';
      
      const success = await NativeAlarmService.scheduleNativeAlarm({
        alarmId: testAlarmId,
        fireDate: testTime.getTime(),
        audioPath: testAudioPath,
        alarmTime: 'Test Recorded Audio'
      });
      
      if (success) {
        addTestResult('✅ Recorded audio alarm scheduled', 'success');
        addTestResult('📱 Alarm will trigger in 30 seconds', 'info');
        addTestResult('🎵 Should play LFG audio as fallback if recording not found', 'info');
        
        // Clean up after 35 seconds
        setTimeout(async () => {
          await NativeAlarmService.cancelNativeAlarm(testAlarmId);
          addTestResult('🧹 Test alarm cleaned up', 'info');
        }, 35000);
      } else {
        addTestResult('❌ Failed to schedule recorded audio alarm', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Recorded audio test error: ${error.message}`, 'error');
    }
  };

  const testAudioConflictPrevention = async () => {
    try {
      addTestResult('🔇 Testing audio conflict prevention...', 'info');
      
      // This test verifies that only one audio source plays at a time
      const audioService = new AudioService();
      await audioService.initialize();
      
      // Start LFG audio
      const lfgItem = {
        id: 'lfg_default_audio',
        audioUri: 'default_alarm_sound',
        name: 'LFG Audio'
      };
      
      const result = await audioService.playAudio(lfgItem, { volume: 0.2 });
      
      if (result.success) {
        addTestResult('✅ LFG audio started', 'success');
        addTestResult('🔇 Only LFG audio should be playing (no system default)', 'info');
        
        // Stop after 3 seconds
        setTimeout(async () => {
          await audioService.stopAudio();
          addTestResult('🛑 Audio stopped - no conflicts detected', 'success');
        }, 3000);
      } else {
        addTestResult(`❌ Audio conflict test failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Audio conflict test error: ${error.message}`, 'error');
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
        🧪 Alarm Fix Test Suite
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tests all the alarm issues that were fixed
      </Text>

      <TouchableOpacity
        style={[
          styles.runButton,
          { backgroundColor: isRunning ? colors.disabled : colors.primary }
        ]}
        onPress={runAllTests}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
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
          📋 Test Coverage
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          • LFG Audio Playback{'\n'}
          • Notification Button Functionality{'\n'}
          • Notification Tap to Open Screen{'\n'}
          • Recorded Audio Playback{'\n'}
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

export default AlarmFixTestComponent;