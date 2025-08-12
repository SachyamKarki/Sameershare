import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useAlarm } from '../components/AlarmContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecordingsScreen() {
  const navigation = useNavigation();
  const { recordings: originalRecordings, deleteRecording } = useAlarm();

  // Local state with durations loaded
  const [recordings, setRecordings] = useState([]);
  const [customNames, setCustomNames] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [sound, setSound] = useState(null);
  const [playingUri, setPlayingUri] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const intervalRef = useRef(null);

  // Load durations for recordings if missing
  useEffect(() => {
    const loadDurations = async () => {
      const updated = await Promise.all(
        originalRecordings.map(async (rec) => {
          if (!rec.duration) {
            try {
              const { sound, status } = await Audio.Sound.createAsync({ uri: rec.audioUri });
              await sound.unloadAsync();
              return { ...rec, duration: status.durationMillis || 0 };
            } catch {
              return rec;
            }
          }
          return rec;
        })
      );
      setRecordings(updated);
    };
    loadDurations();
  }, [originalRecordings]);

  // Stop and unload current sound (utility)
  const stopAndUnloadSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (e) {
        // ignore errors if already stopped
      }
      clearInterval(intervalRef.current);
      setSound(null);
      setPlayingUri(null);
      setPosition(0);
      setDuration(0);
    }
  };

  // Play or pause audio by URI
  const handlePlayPause = async (uri) => {
    if (playingUri !== uri) {
      await stopAndUnloadSound();
      setExpandedId(uri);

      const { sound: newSound, status } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      setPlayingUri(uri);
      setDuration(status.durationMillis || 0);
      setPosition(0);

      await newSound.playAsync();

      intervalRef.current = setInterval(async () => {
        const status = await newSound.getStatusAsync();
        setPosition(status.positionMillis || 0);
      }, 300);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingUri(null);
          clearInterval(intervalRef.current);
        }
      });
      return;
    }

    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  };

  // Handle clicking row (open controls without playing audio)
  const handleRowPress = async (uri) => {
    Keyboard.dismiss();

    if (expandedId === uri) {
      setExpandedId(null);
      await stopAndUnloadSound();
    } else {
      await stopAndUnloadSound();
      setExpandedId(uri);
    }
    setEditingId(null);
  };

  // Handle long press to rename
  const handleLongPress = (id) => {
    setEditingId(id);
    setExpandedId(null);
  };

  // Save renamed name
  const saveName = (id, newName) => {
    if (newName.trim() !== '') {
      setCustomNames((prev) => ({ ...prev, [id]: newName.trim() }));
    }
    setEditingId(null);
  };

  // Handle slider seek
  const handleSeek = async (value) => {
    if (sound) {
      await sound.setPositionAsync(value);
      setPosition(value);
    }
  };

  // Delete recording
  const handleDelete = (id, uri) => {
    Alert.alert(
      'Delete Recording',
      'This will also remove alarms using this recording. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (playingUri === uri && sound) {
              await stopAndUnloadSound();
            }
            deleteRecording(id);

            if (editingId === id) setEditingId(null);
            if (expandedId === uri) setExpandedId(null);

            setRecordings((prev) => prev.filter((r) => r.id !== id));
          },
        },
      ]
    );
  };

  const formatTime = (ms) => {
    if (!ms) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const renderItem = ({ item, index }) => {
    const isPlaying = playingUri === item.audioUri;
    const isExpanded = expandedId === item.audioUri;
    const isEditing = editingId === item.id;

    return (
      <View style={{ marginBottom: 12 , marginTop:8}}>
        {/* Top Row */}
        <TouchableOpacity
          onPress={() => {
            if (!isEditing) handleRowPress(item.audioUri);
          }}
          onLongPress={() => handleLongPress(item.id)}
          activeOpacity={0.7}
          className="bg-gray-800 rounded-xl p-3 mb-0 flex-row items-center justify-between"
        >
          {/* Title or editing input */}
          {isEditing ? (
            <TextInput
              style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
                borderBottomColor: 'black',
                borderBottomWidth: 1,
                paddingVertical: 2,
                flex: 1,
              }}
              defaultValue={customNames[item.id] || `Recording #${index + 1}`}
              onSubmitEditing={(e) => saveName(item.id, e.nativeEvent.text)}
              onBlur={() => setEditingId(null)}
              autoFocus
              returnKeyType="done"
              placeholder="Enter name"
              placeholderTextColor="#9CA3AF"
            />
          ) : (
            <Text className="text-white font-bold text-lg flex-1">
              {customNames[item.id] || `Recording #${index + 1}`}
            </Text>
          )}

          {/* Total duration always on right side */}
          <Text className="text-white text-lg ml-3">
            {formatTime(item.duration)}
          </Text>
        </TouchableOpacity>

        {/* Expanded controls */}
        {isExpanded && !isEditing && (
          <View
            className="rounded-b-xl px-3 pb-3 mb-3"
            style={{ backgroundColor: 'rgba(100,120,120,0.3)' }}
          >
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingComplete={handleSeek}
              minimumTrackTintColor="#38BDF8"
              maximumTrackTintColor="white"
              thumbTintColor="white"
            />

            {/* Current playback time and total duration row */}
            <View className="flex-row justify-between px-1 mt-1">
              <Text className="text-sky-400 text-sm">{formatTime(position)}</Text>
              <Text className="text-white text-sm">{formatTime(duration)}</Text>
            </View>

            <View className="flex-row justify-between items-center mt-2">
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('HomeScreen', {
                    screen: 'SetAlarm',
                    params: { audioUri: item.audioUri, recordingId: item.id },
                  })
                }
                className="p-2"
              >
                <MaterialIcons name="alarm" size={28} color="#FBBF24" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handlePlayPause(item.audioUri)} className="p-2">
                <FontAwesome
                  name={isPlaying ? 'pause' : 'play'}
                  size={28}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.audioUri)}
                className="p-2"
              >
                <MaterialIcons name="delete" size={28} color="#F87171" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 p-4 bg-black">
      <View className='mb-5'>
      <Text className="text-white text-2xl font-bold mb-4 text-center ">Recordings</Text>
      </View>
      <FlatList
        data={[...recordings]}  // Oldest first, no reverse
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20">
            <Text className="text-gray-400">No recordings yet</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />

    </SafeAreaView>
  );
}
