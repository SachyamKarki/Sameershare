import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Picker } from 'react-native-wheel-pick';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import * as Notifications from 'expo-notifications';

import { DaysSelector } from '../components';
import { useAlarm } from '../context';
import { DAYS, COLORS, UI_CONSTANTS } from '../constants/app';
import { 
  getCurrentTime, 
  to24h, 
  formatTimeLabel, 
  nextDateForDayAtTime 
} from '../utils/time';
import NotificationService from '../services/NotificationService';

// Professional responsive design helper
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;
const scale = Math.min(screenWidth / 375, 1.2); // Base scale for iPhone 8 size, max 1.2x

export default function SetAlarmScreen({ navigation, route }) {
  const { addAlarmAndRecording, addRecordingOnly, recordings } = useAlarm();

  // Handle both navigation params and default selection
  const selectedAudioFromRoute = route.params?.selectedAudio || route.params?.audioUri || null;
  const recordingIdFromRoute = route.params?.recordingId || null;
  
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showRecordingSelector, setShowRecordingSelector] = useState(false);

  const baseHours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const baseMinutes = Array.from({ length: 60 }, (_, i) =>
    i < 10 ? `0${i}` : `${i}`
  );
  const baseAmPm = ['AM', 'PM'];

  const currentTime = getCurrentTime();
  const [selectedHour, setSelectedHour] = useState(currentTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(currentTime.minute);
  const [selectedAmPm, setSelectedAmPm] = useState(currentTime.ampm);
  const [selectedDays, setSelectedDays] = useState([]);

  // Set initial recording selection
  useEffect(() => {
    if (selectedAudioFromRoute && recordingIdFromRoute) {
      // Find the recording that matches the route params
      const routeRecording = recordings.find(r => 
        (r.audioUri === selectedAudioFromRoute || r.uri === selectedAudioFromRoute) && 
        r.id === recordingIdFromRoute
      );
      if (routeRecording) {
        setSelectedRecording(routeRecording);
      }
    } else if (recordings.length > 0 && !selectedRecording) {
      // Default to first available recording if none selected
      setSelectedRecording(recordings[0]);
    }
  }, [recordings, selectedAudioFromRoute, recordingIdFromRoute]);



  const saveAlarm = async () => {
    // Check if we have a selected recording or no recordings at all
    if (!selectedRecording && recordings.length === 0) {
      Alert.alert('No recordings found', 'Please record audio first or import audio files from the Recordings tab.');
      return;
    }
    
    if (!selectedRecording) {
      Alert.alert('No recording selected', 'Please select a recording for your alarm.');
      return;
    }

    const audioUri = selectedRecording.audioUri || selectedRecording.uri;
    if (!audioUri) {
      Alert.alert('Invalid recording', 'The selected recording has no valid audio file.');
      return;
    }

    const daysToUse = selectedDays.length ? selectedDays : DAYS;
    const sortedDays = [...daysToUse].sort(
      (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
    );

    const alarmId = uuidv4();

    const alarm = {
      id: alarmId,
      hour: parseInt(selectedHour, 10),
      minute: parseInt(selectedMinute, 10),
      ampm: selectedAmPm,
      days: sortedDays,
      audioUri,
      recordingId: selectedRecording.id,
    };

    const recording = {
      id: selectedRecording.id,
      audioUri,
      linkedAlarmId: alarmId,
    };

    addAlarmAndRecording(alarm, recording);

    const { hour: hour24, minute } = to24h(selectedHour, selectedMinute, selectedAmPm);
    await NotificationService.scheduleAlarmsForDays({
      hour24,
      minute,
      alarmId,
      audioUri,
      displayHour: selectedHour,
      displayMinute: selectedMinute,
      displayAmPm: selectedAmPm,
      days: sortedDays,
    });

    Alert.alert(
      'Alarm saved!',
      `${selectedHour}:${selectedMinute} ${selectedAmPm}\n${sortedDays.join(', ')}`
    );

    navigation.goBack();
  };

  const deleteAlarm = () => {
    if (!audioUri) {
      Alert.alert('No audio to save', 'Nothing will be stored.');
      navigation.goBack();
      return;
    }

    const recording = { id: uuidv4(), audioUri };
    addRecordingOnly(recording);

    Alert.alert('Recording saved', 'Audio stored without creating an alarm.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Professional light status bar for set alarm screen */}
      <ExpoStatusBar style="dark" backgroundColor="#f8f9fa" />
      {Platform.OS === 'android' && (
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      )}
      
      <Text style={styles.heading}>SET ALARM</Text>

      <View style={styles.container}>
        <View style={styles.headersRow}>
          <Text style={styles.headerText}>Hr</Text>
          <Text style={styles.headerText}>Min</Text>
          <Text style={styles.headerText}></Text>
        </View>

        <View style={styles.wheelsRow}>
          <View style={styles.wheelColumn}>
            <View style={styles.wheelWrapper}>
              <Picker
                style={styles.picker}
                pickerData={baseHours}
                selectedValue={selectedHour}
                onValueChange={(value) => {
                  setSelectedHour(value);
                }}
                isCyclic={true}
                itemSpace={UI_CONSTANTS.PICKER_ITEM_SPACE}
                textColor={COLORS.TEXT_SECONDARY}
                selectedItemTextColor={COLORS.PRIMARY}
                selectedItemTextSize={UI_CONSTANTS.SELECTED_TEXT_SIZE}
                itemTextColor={COLORS.TEXT_SECONDARY}
                itemTextSize={UI_CONSTANTS.REGULAR_TEXT_SIZE}
              />
            </View>
          </View>

          <View style={styles.wheelColumn}>
            <View style={styles.wheelWrapper}>
              <Picker
                style={styles.picker}
                pickerData={baseMinutes}
                selectedValue={selectedMinute}
                onValueChange={(value) => {
                  setSelectedMinute(value);
                }}
                isCyclic={true}
                itemSpace={UI_CONSTANTS.PICKER_ITEM_SPACE}
                textColor={COLORS.TEXT_SECONDARY}
                selectedItemTextColor={COLORS.PRIMARY}
                selectedItemTextSize={UI_CONSTANTS.SELECTED_TEXT_SIZE}
                itemTextColor={COLORS.TEXT_SECONDARY}
                itemTextSize={UI_CONSTANTS.REGULAR_TEXT_SIZE}
              />
            </View>
          </View>

          <View style={styles.wheelColumn}>
            <View style={styles.wheelWrapper}>
              <Picker
                style={styles.picker}
                pickerData={baseAmPm}
                selectedValue={selectedAmPm}
                onValueChange={(value) => {
                  setSelectedAmPm(value);
                }}
                isCyclic={false}
                itemSpace={50}
                textColor="#777"
                selectedItemTextColor="#FFA500"
                selectedItemTextSize={32}
                itemTextColor="#777"
                itemTextSize={20}
              />
            </View>
          </View>
        </View>

        {/* Recording Selector */}
        <View style={styles.recordingSection}>
          <Text style={styles.sectionTitle}>Select Recording</Text>
          {recordings.length === 0 ? (
            <View style={styles.noRecordingsContainer}>
              <Ionicons name="musical-notes-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noRecordingsText}>No recordings found</Text>
              <Text style={styles.noRecordingsSubtext}>
                Record audio in the Home tab or import files in the Recordings tab
              </Text>
              <TouchableOpacity 
                style={styles.goToRecordingsButton}
                onPress={() => navigation.navigate('RecordingsTab')}
              >
                <Text style={styles.goToRecordingsText}>Go to Recordings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.recordingSelector}>
              <TouchableOpacity 
                style={styles.selectedRecordingContainer}
                onPress={() => setShowRecordingSelector(!showRecordingSelector)}
              >
                <View style={styles.selectedRecordingInfo}>
                  <Ionicons name="musical-note" size={20} color={COLORS.PRIMARY} />
                  <Text style={styles.selectedRecordingText}>
                    {selectedRecording ? 
                      `Recording ${recordings.findIndex(r => r.id === selectedRecording.id) + 1}` : 
                      'Select a recording'
                    }
                  </Text>
                </View>
                <Ionicons 
                  name={showRecordingSelector ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={COLORS.TEXT_SECONDARY} 
                />
              </TouchableOpacity>
              
              {showRecordingSelector && (
                <View style={styles.recordingList}>
                  {recordings.map((recording, index) => (
                    <TouchableOpacity
                      key={recording.id}
                      style={[
                        styles.recordingItem,
                        selectedRecording?.id === recording.id && styles.selectedRecordingItem
                      ]}
                      onPress={() => {
                        setSelectedRecording(recording);
                        setShowRecordingSelector(false);
                      }}
                    >
                      <Ionicons 
                        name="musical-note" 
                        size={16} 
                        color={selectedRecording?.id === recording.id ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY} 
                      />
                      <Text style={[
                        styles.recordingItemText,
                        selectedRecording?.id === recording.id && styles.selectedRecordingItemText
                      ]}>
                        Recording {index + 1}
                      </Text>
                      {recording.duration && (
                        <Text style={styles.recordingDuration}>
                          {Math.round(recording.duration / 1000)}s
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.daysSelectorContainer}>
          <DaysSelector selectedDays={selectedDays} onDaysChange={setSelectedDays} />
        </View>
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          onPress={saveAlarm}
          style={styles.saveButton}
          activeOpacity={0.8}
        >
          <Ionicons name="save-outline" size={36} color="#228B22" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={deleteAlarm}
          style={styles.deleteButton}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={36} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 26,
  },
  heading: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'left',
    width: '100%',
    paddingHorizontal: 25,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  headersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerText: {
    color: '#FFA500',
    fontSize: 20,
    fontWeight: '400',
    width: 100,
    textAlign: 'center',
  },
  wheelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'black',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    height: isSmallScreen ? 160 : 200,
    paddingHorizontal: 12 * scale,
  },
  wheelColumn: {
    width: Math.max(80 * scale, 90),
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: isSmallScreen ? 160 : 200,
    width: Math.max(80 * scale, 90),
  },
  picker: {
    width: Math.max(80 * scale, 90),
    height: isSmallScreen ? 160 : 200,
    backgroundColor: 'transparent',
  },
  daysSelectorContainer: {
    width: '100%',
    height: '80%',
    marginBottom: 100,
    marginTop: 70,
  },
  // Recording selector styles
  recordingSection: {
    marginTop: 25 * scale,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 15,
    textAlign: 'center',
  },
  noRecordingsContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  noRecordingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 15,
    marginBottom: 8,
  },
  noRecordingsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  goToRecordingsButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  goToRecordingsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingSelector: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedRecordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  selectedRecordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedRecordingText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 10,
  },
  recordingList: {
    backgroundColor: '#F9FAFB',
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedRecordingItem: {
    backgroundColor: '#EBF8FF',
  },
  recordingItemText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 8,
    flex: 1,
  },
  selectedRecordingItemText: {
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  recordingDuration: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: isSmallScreen ? 20 : 30,
    left: 40 * scale,
    right: 40 * scale,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: isSmallScreen ? 80 : 120,
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 24,
    borderRadius: 180,
  },
  deleteButton: {
    backgroundColor: 'rgba(255,0,0,0.6)',
    padding: 24,
    borderRadius: 80,
  },
});
