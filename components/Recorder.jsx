import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Alert, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { v4 as uuidv4 } from 'uuid';
import { useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export default function Recorder() {
  const navigation = useNavigation();
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const timerRef = useRef(null);
  const meteringRef = useRef(null);
  const animatedBars = useRef(
    Array(40).fill(0).map(() => new Animated.Value(4))
  ).current;

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow microphone access.');
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      blinkAnim.setValue(1);
    }
  }, [isRecording]);

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const updateWaveVisualization = (metering) => {
    const power = Math.max(-160, Math.min(0, metering ?? -160));
    const NOISE_FLOOR = -55;
    const GAIN = 1.8;
    const MIN_HEIGHT = 2;
    const MAX_HEIGHT = 70;

    let level;
    if (power <= NOISE_FLOOR) {
      level = 0;
    } else {
      const range = 0 - NOISE_FLOOR;
      const aboveFloor = power - NOISE_FLOOR;
      level = Math.pow(aboveFloor / range, GAIN);
    }

    const height = MIN_HEIGHT + level * (MAX_HEIGHT - MIN_HEIGHT);

    animatedBars.forEach((bar, index) => {
      const isActive = level > 0;
      const waveEffect = isActive ? Math.sin((index / 40) * Math.PI * 4) * level * 8 : 0;
      const freqEffect = isActive ? Math.sin((index / 10) * Math.PI) * level * 10 : 0;
      const randomness = isActive ? (Math.random() - 0.5) * 10 * level : 0;

      const finalHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, height + waveEffect + freqEffect + randomness)
      );

      Animated.timing(bar, {
        toValue: finalHeight,
        duration: 50,
        useNativeDriver: false,
      }).start();
    });
  };

  const startRecording = async () => {
    try {
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.log('Cleanup error:', cleanupError);
        }
        setRecording(null);
      }

      if (timerRef.current) clearInterval(timerRef.current);
      if (meteringRef.current) clearInterval(meteringRef.current);

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.caf',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        isMeteringEnabled: true,
      };

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(recordingOptions);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      meteringRef.current = setInterval(async () => {
        if (rec) {
          try {
            const status = await rec.getStatusAsync();
            if (status.isRecording && status.metering !== undefined) {
              updateWaveVisualization(status.metering);
            }
          } catch (error) {
            console.log('Metering error:', error);
          }
        }
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
      console.log(error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) {
        Alert.alert('No recording', 'There is no active recording.');
        return;
      }

      clearInterval(timerRef.current);
      clearInterval(meteringRef.current);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);

      animatedBars.forEach(bar => {
        Animated.timing(bar, {
          toValue: 4,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });

      if (!uri) {
        Alert.alert('Error', 'Could not get audio URI.');
        return;
      }

      // Combine current date with random UUID
      const now = new Date();
      const formattedDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const recordingId = `${formattedDate}-${uuidv4()}`;

      navigation.navigate('SetAlarmScreen', {
        audioUri: uri,
        recordingId,
      });

      setRecording(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
      console.log(error);
    }
  };

  return (
    <View style={{ backgroundColor: 'black', marginBottom: 5 }}>
      {/* Wave Visualizer */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 80,
          marginHorizontal: 20,
          marginTop:20,
          gap: 2,
          position: 'relative',
        }}
      >
        {animatedBars.map((animatedValue, index) => (
          <Animated.View
            key={index}
            style={{
              width: 6,
              height: animatedValue,
              backgroundColor: 'white',
              borderRadius: 2,
              opacity: isRecording ? 1 : 0.3,
              shadowColor: 'gray',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.6,
              shadowRadius: 3,
              elevation: 2,
            }}
          />
        ))}
      </View>

      {/* Record / Stop Button */}
      <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 2 }}>
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.6}
          style={{
            flexDirection: isRecording ? 'column' : 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,0,0,0.8)',
            paddingVertical: 12,
            paddingHorizontal: 28,
            borderRadius: 40,
            minWidth: 200,
            minHeight: 60,
            justifyContent: 'center',
            shadowColor: 'rgba(255,0,0,0.3)',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 10,
            marginVertical: 6,
          }}
        >
          {!isRecording ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome6 name="microphone" size={24} color="white" />
              <Text style={{ color: 'white', fontSize: 25, fontWeight: '400', marginLeft: 8 }}>Record</Text>
            </View>
          ) : (
            <>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '400' }}>Stop</Text>
              <Animated.Text
                style={{
                  fontSize: 15,
                  fontWeight: '400',
                  color: 'white',
                  marginTop: 2,
                }}
              >
                {formatTime(seconds)}
              </Animated.Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
