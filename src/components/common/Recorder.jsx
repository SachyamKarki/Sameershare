import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Alert, Animated, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { v4 as uuidv4 } from 'uuid';
import { useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as FileSystem from 'expo-file-system';
import { useAlarm } from '../../context';

export default function Recorder() {
  const navigation = useNavigation();
  const { addRecording } = useAlarm();
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const timerRef = useRef(null);
  const meteringRef = useRef(null);
  const animatedBars = useRef(
    Array(40).fill(0).map(() => new Animated.Value(4))
  ).current;

  // Professional emulator detection function
  const checkIfEmulator = async () => {
    if (Platform.OS !== 'android') return false;
    
    try {
      // Multiple methods to detect Android emulator
      const brand = await import('expo-device').then(device => device.default?.brand);
      const modelName = await import('expo-device').then(device => device.default?.modelName);
      
      // Common emulator signatures
      const emulatorSignatures = [
        'generic', 'unknown', 'emulator', 'Android SDK built for x86',
        'Android SDK built for arm64', 'sdk_gphone', 'ranchu'
      ];
      
      return emulatorSignatures.some(sig => 
        brand?.toLowerCase().includes(sig.toLowerCase()) ||
        modelName?.toLowerCase().includes(sig.toLowerCase())
      );
    } catch (error) {
      console.log('Could not detect device type, assuming physical device');
      return false;
    }
  };

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Request permissions with proper error handling
        const { status, canAskAgain } = await Audio.requestPermissionsAsync();
        
        if (status !== 'granted') {
          const message = canAskAgain 
            ? 'Microphone access is required for recording. Please allow access in settings.'
            : 'Microphone access was denied. Please enable it in device settings to record audio.';
          
          Alert.alert('Permission Required', message);
          return;
        }

        // Professional audio mode configuration for Android recording
        const audioModeConfig = {
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        };

        await Audio.setAudioModeAsync(audioModeConfig);
        
        // Professional emulator detection and configuration
        if (Platform.OS === 'android') {
          console.log('Running on Android - checking device type...');
          
          // Check if running on emulator by examining device characteristics
          const isEmulator = await checkIfEmulator();
          
          if (isEmulator) {
            console.log('Android emulator detected - applying special audio configuration');
            Alert.alert(
              'Emulator Audio Notice',
              'You are using an Android emulator. Audio recording may have limited functionality. For full testing, please use a physical device or Expo Go.',
              [{ text: 'OK' }]
            );
          } else {
            console.log('Physical Android device detected - full audio support available');
          }
        }
        
      } catch (error) {
        console.error('Audio initialization failed:', error);
        Alert.alert('Audio Setup Failed', 'Unable to initialize audio recording. Please restart the app.');
      }
    };

    initializeAudio();
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any active recording on component unmount
      if (recording) {
        try {
          recording.stopAndUnloadAsync();
        } catch (error) {
          console.log('Cleanup error:', error);
        }
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (meteringRef.current) clearInterval(meteringRef.current);
    };
  }, []);

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
      // Professional pre-flight checks
      const { status } = await Audio.getPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone access is required for recording.');
        return;
      }

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

      // Professional recording configuration optimized for Android emulator
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: Platform.OS === 'android' ? 22050 : 44100, // Optimized sample rate for Android
          numberOfChannels: 1, // Mono for better compatibility
          bitRate: Platform.OS === 'android' ? 64000 : 128000, // Optimized bitrate for Android
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
      
      // Professional recording preparation with retry logic
      try {
        await rec.prepareToRecordAsync(recordingOptions);
        console.log('Recording prepared successfully');
      } catch (prepError) {
        console.error('Recording preparation failed:', prepError);
        
        // Retry with fallback configuration for Android emulator
        if (Platform.OS === 'android') {
          const fallbackOptions = {
            android: {
              extension: '.3gp',
              outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_THREE_GPP,
              audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AMR_NB,
              sampleRate: 8000,
              numberOfChannels: 1,
              bitRate: 12200,
            },
            isMeteringEnabled: false, // Disable metering for fallback
          };
          
          try {
            await rec.prepareToRecordAsync(fallbackOptions);
            console.log('Recording prepared with fallback configuration');
          } catch (fallbackError) {
            console.error('Fallback recording preparation failed:', fallbackError);
            throw new Error('Unable to initialize recording on this device');
          }
        } else {
          throw prepError;
        }
      }

      await rec.startAsync();
      console.log('Recording started successfully');
      
      // Professional user feedback
      Alert.alert(
        'Recording Started', 
        'Recording is now active. Speak into your device microphone. The wave visualization shows audio levels.',
        [{ text: 'OK' }],
        { cancelable: true }
      );
      
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
      console.error('Recording start failed:', error);
      
      // Professional error messaging
      let errorMessage = 'Failed to start recording';
      if (error.message.includes('permission')) {
        errorMessage = 'Microphone permission is required. Please check your device settings.';
      } else if (error.message.includes('busy') || error.message.includes('in use')) {
        errorMessage = 'Microphone is currently in use by another app. Please close other audio apps and try again.';
      } else if (Platform.OS === 'android') {
        errorMessage = 'Recording failed. Please ensure microphone permissions are granted and try again.';
      }
      
      Alert.alert('Recording Error', errorMessage);
      
      // Reset state on error
      setIsRecording(false);
      setRecording(null);
      if (timerRef.current) clearInterval(timerRef.current);
      if (meteringRef.current) clearInterval(meteringRef.current);
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
      
      // Professional audio verification
      console.log('Recording URI:', uri);
      
      if (!uri) {
        Alert.alert('Recording Failed', 'Could not save the recording. Please try again.');
        setRecording(null);
        return;
      }
      
      // Initialize default file info
      let fileInfo = { exists: true, size: 0 };
      
      // Verify the recording file exists and has content
      try {
        fileInfo = await FileSystem.getInfoAsync(uri);
        console.log('Recording file info:', fileInfo);
        
        if (!fileInfo.exists) {
          Alert.alert('Recording Failed', 'Recording file was not created. Please check microphone permissions.');
          setRecording(null);
          return;
        }
        
        if (fileInfo.size === 0) {
          Alert.alert('Recording Failed', 'Recording is empty. No audio was captured. Please ensure microphone access is allowed.');
          setRecording(null);
          return;
        }
        
        console.log(`Recording saved successfully: ${fileInfo.size} bytes`);
        Alert.alert('Recording Complete', `Audio recorded successfully (${Math.round(fileInfo.size / 1024)}KB). You can now use it for your alarm.`);
        
      } catch (error) {
        console.error('Error checking recording file:', error);
        // Continue with default values if file check fails
      }

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

      // Create recording object for storage
      const recordingData = {
        id: recordingId,
        uri: uri,
        name: `Recording ${formattedDate}`,
        duration: seconds,
        uploadedAt: now.getTime(),
        fileSize: fileInfo?.size || 0
      };

      // Save to recordings list
      addRecording(recordingData);
      console.log('Recording saved to list:', recordingData);

      navigation.navigate('SetAlarmScreen', {
        audioUri: uri,
        recordingId,
      });

      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
      
      // Clean up recording state even if there was an error
      setIsRecording(false);
      setRecording(null);
      if (timerRef.current) clearInterval(timerRef.current);
      if (meteringRef.current) clearInterval(meteringRef.current);
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
