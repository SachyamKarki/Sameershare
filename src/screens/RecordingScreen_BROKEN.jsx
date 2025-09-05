import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { FontAwesome, MaterialIcons, Entypo } from "@expo/vector-icons";
import { useAlarm } from "../context";
import { useNavigation } from "@react-navigation/native";
import { STORAGE_KEYS, AUDIO_CONFIG } from "../constants/app";
import { formatTime } from "../utils/time";
import { setLoudspeakerAudioMode, activateSpeakerphone } from "../utils/audio";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { v4 as uuidv4 } from "uuid";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Global sound manager to prevent multiple audio instances
let globalSound = null;
let globalIntervalRef = null;

export default function RecordingsScreen() {
  const navigation = useNavigation();
  const { recordings: contextRecordings, deleteRecording, addRecording } = useAlarm();

  const [localRecordings, setLocalRecordings] = useState([]);
  const [customNames, setCustomNames] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [sound, setSound] = useState(null);
  const [playingUri, setPlayingUri] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  const intervalRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const STORAGE_KEY = STORAGE_KEYS.RECORDINGS_LIST;

  // Combine context recordings with local recordings
  const recordings = [...contextRecordings, ...localRecordings].reduce((unique, recording) => {
    if (!unique.find(r => r.id === recording.id)) {
      unique.push(recording);
    }
    return unique;
  }, []).sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setLocalRecordings(Array.isArray(parsed) ? parsed : []);
          } catch (parseError) {
            console.error("Error parsing recordings, clearing corrupted data:", parseError);
            await AsyncStorage.removeItem(STORAGE_KEY);
            setLocalRecordings([]);
          }
        }
      } catch (e) {
        console.error("Error loading saved recordings:", e);
      }
    })();
  }, []);

  // Save to storage whenever local recordings change
  const persistLocalRecordings = async (updated) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving recordings:", e);
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
    handlePickAudio();
  };

  const stopAndUnloadSound = async () => {
    // Reset retry count when stopping audio
    retryCount = 0;
    console.log('🛑 Stopping and unloading audio...');
    
    // Stop global sound first
    if (globalSound) {
      try {
        const status = await globalSound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await globalSound.stopAsync();
          }
          await globalSound.unloadAsync();
        }
      } catch (unloadError) {
        console.warn('Global sound cleanup error (non-critical):', unloadError);
      }
      globalSound = null;
    }

    // Clear global interval
    if (globalIntervalRef) {
      clearInterval(globalIntervalRef);
      globalIntervalRef = null;
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
      } catch (unloadError) {
        console.warn('Sound cleanup error (non-critical):', unloadError);
      }
      
      // Always clear state even if unload fails
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setSound(null);
      setPlayingUri(null);
      setPosition(0);
      setDuration(0);
      setIsPlayingAudio(false);
    }
  };

  const handlePlayPause = async (uri) => {
    try {
      // Check retry limit first to prevent infinite loops
      if (retryCount >= MAX_RETRIES) {
        console.error('🚫 Maximum retry attempts reached for audio:', uri);
        Alert.alert("Playback Error", "Unable to play this audio file after multiple attempts. Please try recording a new file.");
        retryCount = 0; // Reset for next attempt
        return;
      }

      // Validate URI first
      if (!uri || uri === null || uri === undefined) {
        console.error('Invalid URI provided for playback:', uri);
        Alert.alert("Playback Error", "Audio file not found. The recording may have been deleted or corrupted.");
        return;
      }

      console.log('Attempting to play audio URI:', uri, '(Attempt:', retryCount + 1, '/', MAX_RETRIES, ')');

      // CRITICAL: Always stop any existing audio first to prevent multiple playback
      await stopAndUnloadSound();
      
      if (playingUri !== uri || hasFinished) {
        setHasFinished(false);
        setExpandedId(uri);

        // Set up audio mode for playback with error handling
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false, // Force loudspeaker
            staysActiveInBackground: false, // Changed for playback
          });
          console.log('Audio mode set for playback');
        } catch (audioModeError) {
          console.warn('Audio mode setup failed, continuing with default:', audioModeError);
        }

        // Validate URI format
        const validUriFormats = ['file://', 'content://', '/data/', '/storage/'];
        const isValidUri = validUriFormats.some(format => uri.includes(format));
        
        if (!isValidUri) {
          console.error('Invalid URI format:', uri);
          Alert.alert("Playback Error", "Invalid audio file format. Please record a new audio file.");
          return;
        }

        // Create and start sound with better error handling
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri },
          { 
            shouldPlay: true,
            volume: 1.0,
            rate: 1.0,
            positionMillis: 0
          }
        );

        // Verify sound loaded properly
        if (!status.isLoaded) {
          console.warn('🔄 Sound not loaded, incrementing retry count');
          retryCount++;
          await newSound.unloadAsync();
          
          if (retryCount < MAX_RETRIES) {
            console.log('🔄 Retrying audio load... (', retryCount, '/', MAX_RETRIES, ')');
            setTimeout(() => handlePlayPause(uri), 500); // Retry after short delay
          } else {
            console.error('🚫 Maximum retries reached for:', uri);
            Alert.alert("Playback Error", "Unable to load this audio file. Please try recording a new file.");
            retryCount = 0; // Reset for next file
          }
          return;
        }

        console.log('✅ Audio loaded successfully, duration:', status.durationMillis);
        retryCount = 0; // Reset retry count on success

        // Set both global and local sound references
        globalSound = newSound;
        setSound(newSound);
        setPlayingUri(uri);
        setIsPlayingAudio(true);
        setDuration(status.durationMillis || 0);
        setPosition(status.positionMillis || 0);

        // Set up position tracking with error handling using global interval
        globalIntervalRef = setInterval(async () => {
          try {
            if (globalSound) {
              const s = await globalSound.getStatusAsync();
              if (s.isLoaded && !s.didJustFinish) {
                setPosition(s.positionMillis || 0);
              } else if (s.didJustFinish) {
                clearInterval(globalIntervalRef);
                globalIntervalRef = null;
              }
            }
          } catch (statusError) {
            console.warn('Status update failed:', statusError);
            clearInterval(globalIntervalRef);
            globalIntervalRef = null;
          }
        }, 500);

        // Also set local interval for component state
        intervalRef.current = globalIntervalRef;

        // Set up playback status listener
        newSound.setOnPlaybackStatusUpdate((s) => {
          if (s.didJustFinish) {
            setIsPlayingAudio(false);
            setHasFinished(true);
            stopAndUnloadSound();
          }
        });

      } else if (sound) {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          console.warn('Sound not loaded, restarting playback');
          await handlePlayPause(uri); // Restart playback
          return;
        }
        
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlayingAudio(false);
        } else {
          await sound.playAsync();
          setIsPlayingAudio(true);
        }
      }
    } catch (err) {
      console.error("Playback error:", err);
      
      // Clean up on error
      await stopAndUnloadSound();
      setIsPlayingAudio(false);
      setHasFinished(false);
      
      // Provide specific error messages
      let errorMessage = "Could not play audio file.";
      if (err.message.includes('load')) {
        errorMessage = "Audio file could not be loaded. It may be corrupted.";
      } else if (err.message.includes('permission')) {
        errorMessage = "Audio playback permission denied.";
      }
      
      Alert.alert("Playback Error", errorMessage);
    }
  };

  const handleDelete = (id, uri) => {
    Alert.alert(
      "Delete Recording",
      "This will also remove alarms using this recording. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (playingUri === uri && sound) {
              await stopAndUnloadSound();
            }
            // Remove from local recordings
            const updatedLocal = localRecordings.filter((r) => r.id !== id);
            setLocalRecordings(updatedLocal);
            persistLocalRecordings(updatedLocal);
            // Remove from context
            deleteRecording(id);
          },
        },
      ]
    );
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const newFileName = `${uuidv4()}-${file.name}`;
      const persistentUri = `${FileSystem.documentDirectory}${newFileName}`;
      await FileSystem.copyAsync({ from: file.uri, to: persistentUri });

      const { sound, status } = await Audio.Sound.createAsync({
        uri: persistentUri,
      });

      if (status.durationMillis > AUDIO_CONFIG.MAX_RECORDING_DURATION) {
        await sound.unloadAsync();
        Alert.alert(
          "Audio Too Long",
          "Please select an audio file less than 5 minutes."
        );
        return;
      }

      await sound.unloadAsync();

      const now = Date.now();
      const randomId = `${uuidv4()}-${now}`;

      const newRecording = {
        id: randomId,
        audioUri: persistentUri,
        duration: status.durationMillis || 0,
        uploadedAt: now,
      };

      const updatedLocal = [...localRecordings, newRecording];
      setLocalRecordings(updatedLocal);
      persistLocalRecordings(updatedLocal);
      addRecording(newRecording);
    } catch (err) {
      // console.error("Error picking audio:", err);
    }
  };

  // formatTime is now imported from utils

  const renderItem = ({ item, index }) => {
    // Normalize URI field - handle both audioUri and uri properties
    const itemUri = item.audioUri || item.uri;
    const isPlaying = playingUri === itemUri;
    const isExpanded = expandedId === itemUri;
    const isEditing = editingId === item.id;

    // Debug logging
    if (!itemUri) {
      console.warn('Recording item missing URI:', item);
    }

    return (
      <View style={{ marginBottom: 12, marginTop: 8 }}>
        <TouchableOpacity
          onPress={() => {
            if (!isEditing) setExpandedId(isExpanded ? null : itemUri);
          }}
          onLongPress={() => setEditingId(item.id)}
          activeOpacity={0.7}
          style={{
            backgroundColor: "black",
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {isEditing ? (
            <TextInput
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
                borderBottomColor: "#555",
                borderBottomWidth: 1,
                paddingVertical: 2,
                flex: 1,
              }}
              defaultValue={`Recording #${index + 1}`}
              onSubmitEditing={(e) => {
                setCustomNames((prev) => ({
                  ...prev,
                  [item.id]: e.nativeEvent.text,
                }));
                setEditingId(null);
              }}
              onBlur={() => setEditingId(null)}
              autoFocus
              returnKeyType="done"
              placeholder="Enter name"
              placeholderTextColor="#9CA3AF"
            />
          ) : (
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 18, flex: 1 }}>
              {customNames[item.id] || `Recording #${index + 1}`}
            </Text>
          )}
          <Text style={{ color: "#D1D5DB", fontSize: 18, marginLeft: 12 }}>
            {formatTime(item.duration)}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View
            style={{
              backgroundColor: "black",
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              paddingHorizontal: 12,
              paddingBottom: 12,
              marginBottom: 8,
            }}
          >
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingComplete={async (v) => {
                if (sound) {
                  await sound.setPositionAsync(v);
                  setPosition(v);
                }
              }}
              minimumTrackTintColor="#60A5FA"
              maximumTrackTintColor="#9CA3AF"
              thumbTintColor="white"
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
              <Text style={{ color: "#93C5FD", fontSize: 12 }}>{formatTime(position)}</Text>
              <Text style={{ color: "#E5E7EB", fontSize: 12 }}>{formatTime(duration)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("HomeTab", {
                    screen: "SetAlarmScreen",
                    params: { audioUri: itemUri, recordingId: item.id },
                  })
                }
                style={{ padding: 8 }}
              >
                <MaterialIcons name="alarm" size={28} color="#FBBF24" />
              </TouchableOpacity>
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
              <TouchableOpacity onPress={() => handleDelete(item.id, itemUri)} style={{ padding: 8 }}>
                <MaterialIcons name="delete" size={28} color="#F87171" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      if (sound) {
        sound.unloadAsync().catch(() => {
          // Ignore cleanup errors
        });
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sound]);

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: "black" }}>
      <View style={{ marginBottom: 32, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "white", fontSize: 34, fontWeight: "bold", marginTop: 33 }}>
          All Recordings
        </Text>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={{ marginTop: 33, padding: 8 }}>
            <Entypo name="dots-three-vertical" size={22} color="white" />
          </Pressable>
        </Animated.View>
      </View>

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 80 }}>
            <Text style={{ color: "#9CA3AF" }}>No recordings yet</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: "#333", marginVertical: 6 }} />
        )}
      />
    </SafeAreaView>
  );
}
