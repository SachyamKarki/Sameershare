import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Pressable } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Ionicons } from '@expo/vector-icons';
import { useAlarm } from './AlarmContext';
import { Audio } from 'expo-av';

function formatDisplayTime(item) {
  const hasHMA = item?.hour !== undefined && item?.minute !== undefined && item?.ampm;
  if (hasHMA) {
    const hh = String(item.hour).padStart(2, '0');
    const mm = String(item.minute).padStart(2, '0');
    return `${hh}:${mm} ${item.ampm}`;
  }
  return '—';
}

export default function AlarmList() {
  const { alarms = [], deleteAlarm, updateAlarm } = useAlarm();
  const soundRef = useRef(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const startAudio = async (uri) => {
    if (!uri) {
      Alert.alert('No audio', 'This alarm has no attached audio.');
      return;
    }

    try {
      // Clean up existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Force loudspeaker playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false, // Loudspeaker on Android
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          volume: 1.0,
        }
      );

      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log("finished playing")
          resetAudioModeForRecording();
        }
      });

    } catch (error) {
      console.error('Audio error:', error);
      Alert.alert('Error', `Unable to play alarm audio: ${error.message}`);
      setIsLongPressing(false);
    }
  };

  const resetAudioModeForRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.error('Error resetting audio mode:', error);
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      await resetAudioModeForRecording()
    }
    setIsLongPressing(false);
  };

  const renderItem = ({ item }) => {
    const displayTime = formatDisplayTime(item);
    const daysText = Array.isArray(item?.days) ? item.days.join(', ') : '';

    return (
      <Pressable
        style={({ pressed }) => [
          styles.rowFront,
          pressed && { opacity: 0.7 }
        ]}
        delayLongPress={200}
        onPressIn={() => setIsLongPressing(true)}
        onLongPress={() => startAudio(item.audioUri)}
        onPressOut={stopAudio}
      >
        <View style={styles.rowContent}>
          <View>
            <Text style={styles.timeText}>{displayTime}</Text>
            {daysText ? <Text style={styles.daysText}>{daysText}</Text> : null}
          </View>
          <Switch
            value={!!item.enabled}
            onValueChange={(val) => {
              updateAlarm(item.id, { enabled: val });

              if (val) {
                const time = formatDisplayTime(item);
                const days = Array.isArray(item?.days) && item.days.length
                  ? item.days.join(', ')
                  : 'No days selected';
                Alert.alert('Alarm ON', `You turned the alarm for ${time} on ${days}`);
              }
            }}
          />
        </View>
      </Pressable>
    );
  };

  const renderHiddenItem = (rowData, rowMap) => {
    const id = rowData?.item?.id;

    return (
      <View style={styles.rowBack}>
        {!isLongPressing && (
          <TouchableOpacity
            style={[styles.backRightBtn, styles.deleteBtn]}
            onPress={() => {
              if (id && rowMap[id]) rowMap[id].closeRow();
              if (id) deleteAlarm(id);
            }}
          >
            <Ionicons name="trash" size={32} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <Text style={styles.title}>Alarm List</Text>

      {alarms.length > 0 ? (
        <SwipeListView
          data={alarms}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : String(index))}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableRightSwipe
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No alarms set</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: 'white',
    fontSize: 30,
    fontWeight: '800',
    paddingHorizontal: 19,
    paddingVertical: 12,
    textAlign: 'left',
    marginBottom: 6,
    marginTop: 13,
  },
  rowFront: {
    backgroundColor: 'black',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    padding: 18,
  },
  rowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 24,
    fontWeight: '400',
    color: 'white',
  },
  daysText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  rowBack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'black',
    height: '100%',
  },
  backRightBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  deleteBtn: {
    backgroundColor: 'red',
    right: 0,
    width: 90,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 21,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});
