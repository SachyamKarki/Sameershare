/**
 * Audio Test Component
 * 
 * Professional testing component for audio functionality
 * Helps verify that default LFG audio and alarm setting works correctly
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import audioService from '../../services/AudioService';
import errorHandler from '../../utils/errorHandler';

const AudioTestComponent = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [audioServiceStatus, setAudioServiceStatus] = useState('Not Initialized');

  useEffect(() => {
    initializeAudioService();
  }, []);

  const initializeAudioService = async () => {
    setIsLoading(true);
    try {
      const result = await audioService.initialize();
      if (result.success) {
        setAudioServiceStatus('Initialized');
        addTestResult('✅ Audio Service initialized successfully', 'success');
      } else {
        setAudioServiceStatus('Failed');
        addTestResult(`❌ Audio Service initialization failed: ${result.details}`, 'error');
      }
    } catch (error) {
      setAudioServiceStatus('Error');
      addTestResult(`❌ Audio Service initialization error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addTestResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testDefaultLFGAudio = async () => {
    setIsLoading(true);
    addTestResult('🎵 Testing default LFG audio playback...', 'info');
    
    try {
      const audioItem = {
        id: 'lfg_default_audio',
        audioUri: 'default_alarm_sound',
        name: 'LFG Audio'
      };

      const result = await audioService.playAudio(audioItem, {
        volume: 1.0,
        isLooping: false
      });

      if (result.success) {
        setIsPlaying(true);
        addTestResult('✅ Default LFG audio playback started successfully', 'success');
        
        // Auto-stop after 3 seconds for testing
        setTimeout(async () => {
          await stopAudio();
        }, 3000);
      } else {
        addTestResult(`❌ Default LFG audio playback failed: ${result.details}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Default LFG audio test error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = async () => {
    try {
      const result = await audioService.stopAudio();
      if (result.success) {
        setIsPlaying(false);
        addTestResult('🛑 Audio playback stopped', 'info');
      } else {
        addTestResult(`❌ Failed to stop audio: ${result.details}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Stop audio error: ${error.message}`, 'error');
    }
  };

  const testAudioValidation = async () => {
    addTestResult('🔍 Testing audio validation...', 'info');
    
    try {
      // Test default audio validation
      const result = await audioService.validateAudioFile('default_alarm_sound');
      if (result.valid) {
        addTestResult('✅ Default audio validation passed', 'success');
      } else {
        addTestResult(`❌ Default audio validation failed: ${result.details}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Audio validation test error: ${error.message}`, 'error');
    }
  };

  const testErrorHandling = () => {
    addTestResult('🧪 Testing error handling...', 'info');
    
    try {
      // Test with invalid audio item
      const invalidItem = {
        id: 'invalid',
        audioUri: 'invalid://path/to/nonexistent/file.mp3',
        name: 'Invalid Audio'
      };

      audioService.playAudio(invalidItem).then(result => {
        if (!result.success) {
          addTestResult('✅ Error handling working correctly', 'success');
        } else {
          addTestResult('❌ Error handling not working as expected', 'error');
        }
      });
    } catch (error) {
      addTestResult(`❌ Error handling test failed: ${error.message}`, 'error');
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const getErrorStats = () => {
    const stats = errorHandler.getErrorStats();
    return stats;
  };

  const showErrorStats = () => {
    const stats = getErrorStats();
    Alert.alert(
      'Error Statistics',
      `Total Errors: ${stats.total}\n` +
      `By Category: ${JSON.stringify(stats.byCategory, null, 2)}\n` +
      `By Severity: ${JSON.stringify(stats.bySeverity, null, 2)}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Test Component</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Audio Service Status:</Text>
        <Text style={[styles.statusValue, { color: audioServiceStatus === 'Initialized' ? '#4CAF50' : '#F44336' }]}>
          {audioServiceStatus}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={testDefaultLFGAudio}
          disabled={isLoading || isPlaying}
        >
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.buttonText}>Test LFG Audio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={stopAudio}
          disabled={!isPlaying}
        >
          <Ionicons name="stop" size={20} color="white" />
          <Text style={styles.buttonText}>Stop Audio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={testAudioValidation}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.buttonText}>Test Validation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={testErrorHandling}
        >
          <Ionicons name="bug" size={20} color="white" />
          <Text style={styles.buttonText}>Test Errors</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Test Results</Text>
          <TouchableOpacity onPress={clearTestResults}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsList}>
          {testResults.map((result) => (
            <View key={result.id} style={[styles.resultItem, styles[`result${result.type.charAt(0).toUpperCase() + result.type.slice(1)}`]]}>
              <Text style={styles.resultText}>{result.message}</Text>
              <Text style={styles.resultTime}>{result.timestamp}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.statsButton]}
        onPress={showErrorStats}
      >
        <Ionicons name="analytics" size={20} color="white" />
        <Text style={styles.buttonText}>Error Stats</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '48%',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#F44336',
  },
  infoButton: {
    backgroundColor: '#2196F3',
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  statsButton: {
    backgroundColor: '#9C27B0',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  clearButton: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  resultSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftColor: '#4CAF50',
  },
  resultError: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderLeftColor: '#F44336',
  },
  resultInfo: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderLeftColor: '#2196F3',
  },
  resultText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 2,
  },
  resultTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});

export default AudioTestComponent;