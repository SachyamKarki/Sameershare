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

  const blinkAnim = useRef(new Animated.Value(1)).current;

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
          Animated.timing(blinkAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      blinkAnim.stopAnimation();
      blinkAnim.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
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
      };

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(recordingOptions);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
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
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);

      if (!uri) {
        Alert.alert('Error', 'Could not get audio URI.');
        return;
      }

      const recordingId = uuidv4();

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
    <View
      style={{
        flex: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginVertical: 50,
      }}
    >
      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        activeOpacity={0.6}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255,0,0,0.8)',
          paddingVertical: 15,
          paddingHorizontal: 40,
          borderRadius: 40,
          minWidth: 220,
          justifyContent: 'center',
          shadowColor: 'rgba(255,0,0,0.3)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <Animated.View
          style={{
            opacity: isRecording ? blinkAnim : 1,
            marginRight: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <FontAwesome6 name="microphone" size={28} color="white" />
          <Text
            style={{
              color: 'white',
              fontSize: 24,
              fontWeight: '700',
              marginLeft: 12,
            }}
          >
            {isRecording ? 'Recording' : 'Record'}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
