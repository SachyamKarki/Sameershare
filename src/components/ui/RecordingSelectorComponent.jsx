// RecordingSelectorComponent.js
// Modern dropdown selector for audio recordings

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const RecordingSelectorComponent = ({
  recordings,
  selectedRecording,
  onRecordingSelect,
  showRecordingSelector,
  onToggleSelector,
  onGoToRecordings,
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for empty state
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseAnim.stopAnimation();
    };
  }, []);

  // Empty state when no recordings
  if (recordings.length === 0) {
    return (
      <View style={styles.recordingSection}>
        <Text style={styles.sectionTitle}>🎵 Select Recording</Text>
        <View style={styles.noRecordingsContainer}>
          <LinearGradient
            colors={['rgba(255,165,0,0.1)', 'rgba(255,69,0,0.05)']}
            style={styles.noRecordingsGradient}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="musical-notes-outline" size={64} color="#FF6B35" />
            </Animated.View>
            <Text style={styles.noRecordingsText}>No recordings found</Text>
            <Text style={styles.noRecordingsSubtext}>
              🎙️ Record audio in the Home tab or 📁 import files in the Recordings tab
            </Text>
            <TouchableOpacity 
              style={styles.goToRecordingsButton}
              onPress={onGoToRecordings}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF8E53']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="library-outline" size={16} color="white" />
                <Text style={styles.goToRecordingsText}>Go to Recordings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  }

  // Recording selector dropdown
  return (
    <View style={styles.recordingSection}>
      <Text style={styles.sectionTitle}>🎵 Select Recording</Text>
      
      <View style={styles.recordingSelector}>
        {/* Main selector button */}
        <TouchableOpacity 
          style={styles.selectedRecordingContainer}
          onPress={onToggleSelector}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.recordingContainerGradient}
          >
            <View style={styles.selectedRecordingInfo}>
              <Animated.View style={{ transform: [{ rotate: '0deg' }] }}>
                <Ionicons name="musical-note" size={24} color="#FF6B35" />
              </Animated.View>
              <Text style={styles.selectedRecordingText}>
                {selectedRecording ? 
                  `🎵 Recording ${recordings.findIndex(r => r.id === selectedRecording.id) + 1}` : 
                  'Select a recording'
                }
              </Text>
            </View>
            <Animated.View style={{
              transform: [{ 
                rotate: showRecordingSelector ? '180deg' : '0deg' 
              }]
            }}>
              <Ionicons name="chevron-down" size={24} color="#FF6B35" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Dropdown list */}
        {showRecordingSelector && (
          <Animated.View style={[styles.recordingList, {
            opacity: fadeAnim,
          }]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
              style={styles.recordingListGradient}
            >
              {recordings.map((recording, index) => (
                <RecordingItem
                  key={recording.id}
                  recording={recording}
                  index={index}
                  isSelected={selectedRecording?.id === recording.id}
                  onSelect={() => {
                    onRecordingSelect(recording);
                    onToggleSelector();
                  }}
                />
              ))}
            </LinearGradient>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

// Individual recording item component
const RecordingItem = ({ recording, index, isSelected, onSelect }) => {
  return (
    <TouchableOpacity
      style={[
        styles.recordingItem,
        isSelected && styles.selectedRecordingItem
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {isSelected && (
        <LinearGradient
          colors={['rgba(255,107,53,0.2)', 'rgba(255,142,83,0.1)']}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <Ionicons 
        name={isSelected ? "checkmark-circle" : "musical-note"} 
        size={20} 
        color={isSelected ? "#FF6B35" : "rgba(255,255,255,0.7)"} 
      />
      <Text style={[
        styles.recordingItemText,
        isSelected && styles.selectedRecordingItemText
      ]}>
        🎵 Recording {index + 1}
      </Text>
      {recording.duration && (
        <Text style={styles.recordingDuration}>
          {Math.round(recording.duration / 1000)}s
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  recordingSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(255,107,53,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  // Empty state styles
  noRecordingsContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  noRecordingsGradient: {
    alignItems: 'center',
    padding: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.3)',
    borderStyle: 'dashed',
    borderRadius: 20,
  },
  noRecordingsText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  noRecordingsSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  goToRecordingsButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 12,
  },
  goToRecordingsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Dropdown styles
  recordingSelector: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedRecordingContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  recordingContainerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedRecordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedRecordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
  },
  recordingList: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recordingListGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  selectedRecordingItem: {
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  recordingItemText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 12,
    flex: 1,
  },
  selectedRecordingItemText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  recordingDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default RecordingSelectorComponent;
