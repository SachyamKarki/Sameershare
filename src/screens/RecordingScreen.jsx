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
import { setLoudspeakerAudioMode } from "../utils/audio";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { v4 as uuidv4 } from "uuid";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Global sound manager to prevent multiple audio instances
let globalSound = null;
let globalIntervalRef = null;
let globalPlayingUri = null; // Track which URI is currently playing

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


  const startAudio = async (uri) => {
    if (!uri) {
      Alert.alert('No audio', 'This recording has no attached audio.');
      return;
    }

    try {
      // Clean up existing sound - EXACT same logic as AlarmList
      if (globalSound) {
        await globalSound.unloadAsync();
        globalSound = null;
      }
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
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

      // Force loudspeaker playback - EXACT same as AlarmList
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false, // Loudspeaker on Android
      });

      // Create sound - EXACT same as AlarmList
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          volume: 1.0,
        }
      );

      // Store references
      globalSound = newSound;
      globalPlayingUri = uri; // Set global playing URI
      setSound(newSound);
      setPlayingUri(uri);
      setIsPlayingAudio(true);
      setExpandedId(uri);
      setHasFinished(false);

      // Position tracking
      const initialStatus = await newSound.getStatusAsync();
      if (initialStatus.isLoaded) {
        setDuration(initialStatus.durationMillis || 0);
      }

      // Start position tracking
      globalIntervalRef = setInterval(async () => {
        try {
          if (globalSound) {
            const stat = await globalSound.getStatusAsync();
            if (stat.isLoaded && stat.isPlaying) {
              setPosition(stat.positionMillis || 0);
            }
          }
        } catch (e) {
          console.warn('Position tracking error (non-critical):', e);
        }
      }, 500);

      intervalRef.current = globalIntervalRef;

      // Handle finish - EXACT same as AlarmList
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log("finished playing")
          resetAudioModeForRecording();
          setIsPlayingAudio(false);
          setHasFinished(true);
          globalPlayingUri = null; // Clear global playing URI
          // Clean up
          if (globalIntervalRef) {
            clearInterval(globalIntervalRef);
            globalIntervalRef = null;
          }
        }
      });

    } catch (error) {
      console.error('Audio error:', error);
      Alert.alert('Error', `Unable to play recording audio: ${error.message}`);
      setIsPlayingAudio(false);
    }
  };

  const stopAudio = async () => {
    if (globalSound) {
      await globalSound.stopAsync();
      await globalSound.unloadAsync();
      globalSound = null;
      await resetAudioModeForRecording()
    }
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
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
    
    // Clear global playing URI
    globalPlayingUri = null;
    
    setIsPlayingAudio(false);
    setPlayingUri(null);
    setPosition(0);
    setHasFinished(false);
  };

  const handlePlayPause = async (uri) => {
    if (globalPlayingUri === uri && isPlayingAudio) {
      await stopAudio();
    } else {
      await startAudio(uri);
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
              await stopAudio();
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

  const renderItem = ({ item, index }) => {
    // Normalize URI field - handle both audioUri and uri properties
    const itemUri = item.audioUri || item.uri;
    // Check both local and global playing state for accurate UI
    const isPlaying = (playingUri === itemUri || globalPlayingUri === itemUri) && isPlayingAudio;
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
            <View style={{ 
              flexDirection: "row", 
              justifyContent: "space-around", 
              alignItems: "center",
              marginTop: 16,
              paddingHorizontal: 8 
            }}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("HomeTab", { 
                    screen: "SetAlarmScreen",
                    params: {
                      selectedAudio: itemUri, 
                      recordingId: item.id 
                    }
                  })
                }
                style={{ 
                  padding: 12, 
                  backgroundColor: "#FBBF24",
                  borderRadius: 25,
                  minWidth: 50,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MaterialIcons name="alarm" size={20} color="white" />
              </TouchableOpacity>
                             <TouchableOpacity 
                 onPress={() => {
                   if (!itemUri) {
                     Alert.alert("Error", "Audio file not available");
                     return;
                   }
                   handlePlayPause(itemUri);
                 }} 
                 style={{ 
                   padding: 12, 
                   backgroundColor: isPlaying && isPlayingAudio ? "#FF6B6B" : "#4ECDC4",
                   borderRadius: 25,
                   opacity: itemUri ? 1 : 0.5,
                   minWidth: 50,
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}
                 disabled={!itemUri}
               >
                 <FontAwesome
                   name={isPlaying && isPlayingAudio ? "pause" : "play"}
                   size={20}
                   color="white"
                 />
               </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDelete(item.id, itemUri)} 
                style={{ 
                  padding: 12, 
                  backgroundColor: "#F87171",
                  borderRadius: 25,
                  minWidth: 50,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MaterialIcons name="delete" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Cleanup on component unmount
  // Cleanup on unmount to prevent memory leaks and lingering audio
  useEffect(() => {
    return () => {
      console.log('🧹 RecordingScreen unmounting - cleaning up audio');
      
      // Clear all intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (globalIntervalRef) {
        clearInterval(globalIntervalRef);
        globalIntervalRef = null;
      }
      
      // Stop and unload all sounds
      if (globalSound) {
        globalSound.unloadAsync().catch(() => {});
        globalSound = null;
        globalPlayingUri = null;
      }
      if (sound) {
        sound.unloadAsync().catch(() => {});
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
