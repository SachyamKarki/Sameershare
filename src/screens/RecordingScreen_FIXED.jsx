import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAlarm } from "../context";
import { STORAGE_KEYS, AUDIO_CONFIG } from "../constants/app";
import { formatTime } from "../utils/time";
import { setLoudspeakerAudioMode, activateSpeakerphone } from "../utils/audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

// Global sound manager to prevent multiple audio instances
let globalSound = null;
let globalIntervalRef = null;

export default function RecordingsScreen() {
  const navigation = useNavigation();
  const { recordings: contextRecordings, deleteRecording, addRecording } = useAlarm();

  const [localRecordings, setLocalRecordings] = useState([]);
  const [sound, setSound] = useState(null);
  const [playingUri, setPlayingUri] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const intervalRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Combine recordings from context and local storage
  const recordings = [...contextRecordings, ...localRecordings];

  useEffect(() => {
    loadLocalRecordings();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => {
      stopAndUnloadSound();
    };
  }, []);

  const loadLocalRecordings = async () => {
    try {
      const storedRecordings = await AsyncStorage.getItem(STORAGE_KEYS.RECORDINGS);
      if (storedRecordings) {
        const parsed = JSON.parse(storedRecordings);
        setLocalRecordings(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Error loading local recordings:", error);
    }
  };

  const stopAndUnloadSound = async () => {
    console.log('🛑 Stopping all audio...');
    
    try {
      // Stop global sound
      if (globalSound) {
        try {
          const status = await globalSound.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await globalSound.stopAsync();
            }
            await globalSound.unloadAsync();
          }
        } catch (error) {
          console.warn('Global sound cleanup error:', error);
        }
        globalSound = null;
      }

      // Clear intervals
      if (globalIntervalRef) {
        clearInterval(globalIntervalRef);
        globalIntervalRef = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Stop local sound
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await sound.stopAsync();
            }
            await sound.unloadAsync();
          }
        } catch (error) {
          console.warn('Local sound cleanup error:', error);
        }
      }
      
      // Clear all state
      setSound(null);
      setPlayingUri(null);
      setPosition(0);
      setDuration(0);
      setIsPlayingAudio(false);
      
      console.log('✅ All audio stopped and cleaned up');
    } catch (error) {
      console.error('Error during audio cleanup:', error);
    }
  };

  const handlePlayPause = async (uri) => {
    try {
      // Validate URI
      if (!uri) {
        Alert.alert("Error", "Invalid audio file");
        return;
      }

      console.log('🎵 Audio action for:', uri);

      // Always stop current audio first
      await stopAndUnloadSound();
      
      // If this was the playing audio, just stop it
      if (playingUri === uri && !hasFinished) {
        console.log('🛑 Audio stopped');
        return;
      }

      setHasFinished(false);
      setExpandedId(uri);

      // Set audio mode
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
        await activateSpeakerphone();
      } catch (audioModeError) {
        console.warn('Audio mode setup failed:', audioModeError);
      }

      // Create and play sound - SIMPLE, NO RETRIES
      try {
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, volume: 1.0 }
        );

        if (!status.isLoaded) {
          console.error('❌ Audio failed to load');
          await newSound.unloadAsync();
          Alert.alert("Error", "Cannot play this audio file");
          return;
        }

        console.log('✅ Audio loaded and playing');

        // Set references
        globalSound = newSound;
        setSound(newSound);
        setPlayingUri(uri);
        setIsPlayingAudio(true);
        setDuration(status.durationMillis || 0);

        // Track position
        globalIntervalRef = setInterval(async () => {
          try {
            if (globalSound) {
              const s = await globalSound.getStatusAsync();
              if (s.isLoaded && !s.didJustFinish) {
                setPosition(s.positionMillis || 0);
              }
            }
          } catch (error) {
            console.warn('Position update failed:', error);
          }
        }, 500);

        intervalRef.current = globalIntervalRef;

        // Handle finish
        newSound.setOnPlaybackStatusUpdate((s) => {
          if (s.didJustFinish) {
            console.log('🎵 Audio finished');
            setIsPlayingAudio(false);
            setHasFinished(true);
            stopAndUnloadSound();
          }
        });

      } catch (createError) {
        console.error('Failed to create sound:', createError);
        Alert.alert("Error", "Cannot play this audio file");
      }

    } catch (error) {
      console.error("Playback error:", error);
      Alert.alert("Error", "Failed to play audio");
      await stopAndUnloadSound();
    }
  };

  const handleDelete = async (recordingId) => {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await stopAndUnloadSound();
              deleteRecording(recordingId);
              
              // Also remove from local storage
              const updatedLocalRecordings = localRecordings.filter(r => r.id !== recordingId);
              setLocalRecordings(updatedLocalRecordings);
              await AsyncStorage.setItem(STORAGE_KEYS.RECORDINGS, JSON.stringify(updatedLocalRecordings));
              
            } catch (error) {
              console.error("Error deleting recording:", error);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const itemUri = item.audioUri || item.uri;
    const isPlaying = playingUri === itemUri;
    const isExpanded = expandedId === itemUri;

    return (
      <Animated.View
        style={{
          backgroundColor: "#2a2a2a",
          marginVertical: 8,
          marginHorizontal: 16,
          borderRadius: 12,
          padding: 16,
          opacity: fadeAnim,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              {item.name || `Recording ${item.id?.slice(0, 8)}`}
            </Text>
            <Text style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
              {item.uploadedAt ? new Date(item.uploadedAt).toLocaleString() : "Unknown date"}
            </Text>
            <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
              Duration: {formatTime(item.duration || 0)}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => itemUri ? handlePlayPause(itemUri) : Alert.alert("Error", "Audio file not available")}
              style={{ padding: 8, opacity: itemUri ? 1 : 0.5 }}
            >
              <FontAwesome
                name={isPlaying && isPlayingAudio ? "pause" : "play"}
                size={28}
                color={itemUri ? "white" : "#666"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={{ padding: 8, marginLeft: 8 }}
            >
              <FontAwesome name="trash" size={24} color="#ff4444" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => itemUri && navigation.navigate("SetAlarm", { selectedAudio: itemUri })}
              style={{ padding: 8, marginLeft: 8, opacity: itemUri ? 1 : 0.5 }}
            >
              <FontAwesome name="clock-o" size={24} color={itemUri ? "#4CAF50" : "#666"} />
            </TouchableOpacity>
          </View>
        </View>

        {isExpanded && isPlaying && (
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#444" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: "#888", fontSize: 12 }}>
                {formatTime(position)}
              </Text>
              <Text style={{ color: "#888", fontSize: 12 }}>
                {formatTime(duration)}
              </Text>
            </View>
            <View style={{ height: 4, backgroundColor: "#444", borderRadius: 2 }}>
              <View
                style={{
                  height: 4,
                  backgroundColor: "#4CAF50",
                  borderRadius: 2,
                  width: duration > 0 ? `${(position / duration) * 100}%` : "0%",
                }}
              />
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: "#333" }}>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
          Recordings
        </Text>
        <Text style={{ color: "#888", fontSize: 16, marginTop: 4 }}>
          {recordings.length} recording{recordings.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={recordings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <FontAwesome name="microphone-slash" size={48} color="#666" />
            <Text style={{ color: "#888", fontSize: 16, marginTop: 16, textAlign: "center" }}>
              No recordings yet{"\n"}Record your first audio in the Home tab
            </Text>
          </View>
        }
      />
    </View>
  );
}
