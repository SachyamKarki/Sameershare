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
} from "react-native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { FontAwesome, MaterialIcons, Entypo } from "@expo/vector-icons";
import { useAlarm } from "../components/AlarmContext";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { v4 as uuidv4 } from "uuid";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RecordingsScreen() {
  const navigation = useNavigation();
  const { deleteRecording, addRecording } = useAlarm();

  const [recordings, setRecordings] = useState([]);
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

  const STORAGE_KEY = "@recordings_list";

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setRecordings(parsed);
        }
      } catch (e) {
        console.error("Error loading saved recordings:", e);
      }
    })();
  }, []);

  // Save to storage whenever recordings change
  const persistRecordings = async (updated) => {
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
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {}
      clearInterval(intervalRef.current);
      setSound(null);
      setPlayingUri(null);
      setPosition(0);
      setDuration(0);
    }
  };

  const handlePlayPause = async (uri) => {
    try {
      if (playingUri !== uri || hasFinished) {
        setHasFinished(false);
        await stopAndUnloadSound();
        setExpandedId(uri);

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );

        setSound(newSound);
        setPlayingUri(uri);
        setIsPlayingAudio(true);
        setDuration(status.durationMillis || 0);
        setPosition(status.positionMillis || 0);

        intervalRef.current = setInterval(async () => {
          const s = await newSound.getStatusAsync();
          setPosition(s.positionMillis || 0);
        }, 300);

        newSound.setOnPlaybackStatusUpdate((s) => {
          if (s.didJustFinish) {
            setIsPlayingAudio(false);
            setHasFinished(true);
            stopAndUnloadSound();
          }
        });
      } else if (sound) {
        const status = await sound.getStatusAsync();
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
      Alert.alert("Error", "Could not play audio file.");
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
            const updated = recordings.filter((r) => r.id !== id);
            setRecordings(updated);
            persistRecordings(updated);
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

      if (status.durationMillis > 300000) {
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

      const updated = [...recordings, newRecording];
      setRecordings(updated);
      persistRecordings(updated);
      addRecording(newRecording);
    } catch (err) {
      // console.error("Error picking audio:", err);
    }
  };

  const formatTime = (ms) => {
    if (!ms) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const renderItem = ({ item, index }) => {
    const isPlaying = playingUri === item.audioUri;
    const isExpanded = expandedId === item.audioUri;
    const isEditing = editingId === item.id;

    return (
      <View style={{ marginBottom: 12, marginTop: 8 }}>
        <TouchableOpacity
          onPress={() => {
            if (!isEditing) setExpandedId(isExpanded ? null : item.audioUri);
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
                    params: { audioUri: item.audioUri, recordingId: item.id },
                  })
                }
                style={{ padding: 8 }}
              >
                <MaterialIcons name="alarm" size={28} color="#FBBF24" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePlayPause(item.audioUri)} style={{ padding: 8 }}>
                <FontAwesome
                  name={isPlaying && isPlayingAudio ? "pause" : "play"}
                  size={28}
                  color="white"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.audioUri)} style={{ padding: 8 }}>
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
      if (sound) {
        sound.unloadAsync();
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
