import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { validateAlarmAudio, createAlarmPlaybackConfig, audioUtils, getOptimalAlarmVolume } from '../../utils/audioProcessor';
import { Toast } from '../ui/Toast';

// Global sound manager to prevent multiple instances
let globalSound = null;
let globalPlayingUri = null;

const RecordingPlayer = ({ recording, onPlayStatusChange = () => {} , style = {} }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fileValid, setFileValid] = useState(true);
  const [audioQuality, setAudioQuality] = useState(null);

  const progressInterval = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setIsPlaying(globalPlayingUri === recording.audioUri);
    validateFile();

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [recording.audioUri]);

  const validateFile = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(recording.audioUri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        console.warn('Recording file missing or empty:', recording.audioUri);
        setFileValid(false);
        return;
      }

      setFileValid(true);

      const validation = await validateAlarmAudio(recording.audioUri);
      if (validation.analysis) {
        setAudioQuality(validation.analysis.estimatedQuality);
      }
    } catch (error) {
      console.error('File validation error:', error);
      setFileValid(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  const configureAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.warn('Audio mode configuration failed:', error);
    }
  };

  const startPlayback = async () => {
    try {
      if (!fileValid) {
        Toast.error(t('recordings.errorTitle'), t('recordings.fileMissing'));
        return;
      }

      setIsLoading(true);
      await stopGlobalSound();
      await configureAudioMode();

      const optimalVolume = getOptimalAlarmVolume();

      const playbackConfig = createAlarmPlaybackConfig(recording.audioUri, {
        initialStatus: {
          shouldPlay: true,
          volume: optimalVolume,
          isLooping: false,
        }
      });

      const { sound, status } = await Audio.Sound.createAsync(
        playbackConfig.source,
        playbackConfig.initialStatus
      );

      globalSound = sound;
      globalPlayingUri = recording.audioUri;

      setIsPlaying(true);
      setDuration(status.durationMillis || recording.duration || 0);
      setPosition(0);
      onPlayStatusChange(true);

      startProgressTracking();
      startPulseAnimation();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) handlePlaybackFinished();
        else if (status.isLoaded && status.positionMillis !== undefined) setPosition(status.positionMillis);
      });

    } catch (error) {
      console.error('Playback start error:', error);
      Toast.error(t('recordings.playbackErrorTitle'), t('recordings.playbackErrorMessage'));
      setIsPlaying(false);
      onPlayStatusChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopPlayback = async () => {
    try {
      await stopGlobalSound();
      handlePlaybackFinished();
    } catch (error) {
      console.error('Playback stop error:', error);
    }
  };

  const stopGlobalSound = async () => {
    if (globalSound) {
      try {
        await globalSound.stopAsync();
        await globalSound.unloadAsync();
      } catch (error) {
        console.warn('Sound cleanup error:', error);
      }
      globalSound = null;
      globalPlayingUri = null;
    }
  };

  const handlePlaybackFinished = () => {
    setIsPlaying(false);
    setPosition(0);
    stopProgressTracking();
    stopPulseAnimation();
    onPlayStatusChange(false);
    globalPlayingUri = null;
  };

  const startProgressTracking = () => {
    progressInterval.current = setInterval(async () => {
      if (globalSound) {
        try {
          const status = await globalSound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) setPosition(status.positionMillis || 0);
        } catch {}
      }
    }, 500);
  };

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const handleSliderChange = async (value) => {
    if (globalSound && duration > 0) {
      try {
        const newPosition = value * duration;
        await globalSound.setPositionAsync(newPosition);
        setPosition(newPosition);
      } catch (error) {
        console.warn('Seek error:', error);
      }
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) stopPlayback();
    else startPlayback();
  };

  if (!fileValid) {
    return (
      <View style={[{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderRadius: 10,
        padding: 12,
        marginVertical: 5,
      }, style]}>
        <Ionicons name="warning" size={20} color="#ff6b6b" />
        <Text style={{ color: '#ff6b6b', marginLeft: 10, flex: 1 }}>
          {t('recordings.fileMissing')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[{
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 15,
      padding: 15,
      marginVertical: 5,
    }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ opacity: isPlaying ? 0.8 : 1 }}>
          <TouchableOpacity
            onPress={handlePlayPause}
            disabled={isLoading}
            style={{
              width: 45,
              height: 45,
              borderRadius: 22.5,
              backgroundColor: isPlaying ? '#ff6b6b' : '#4CAF50',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 15,
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? (
              <Ionicons name="hourglass" size={20} color="white" />
            ) : (
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={20} 
                color="white" 
                style={{ marginLeft: isPlaying ? 0 : 2 }} 
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {recording.name || t('recordings.unnamed')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>
              {formatTime(duration)} • {audioUtils.formatFileSize(recording.fileSize || 0)}
            </Text>
            {audioQuality && (
              <View style={{
                marginLeft: 8,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
                backgroundColor: 
                  audioQuality === 'high' ? 'rgba(76, 175, 80, 0.2)' :
                  audioQuality === 'medium' ? 'rgba(255, 193, 7, 0.2)' :
                  audioQuality === 'acceptable' ? 'rgba(33, 150, 243, 0.2)' :
                  'rgba(255, 107, 107, 0.2)'
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color:
                    audioQuality === 'high' ? '#4CAF50' :
                    audioQuality === 'medium' ? '#FFC107' :
                    audioQuality === 'acceptable' ? '#2196F3' :
                    '#FF6B6B'
                }}>
                  {audioQuality.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={{ marginBottom: 8 }}>
        <Slider
          style={{ width: '100%', height: 30 }}
          minimumValue={0}
          maximumValue={1}
          value={duration > 0 ? position / duration : 0}
          onValueChange={handleSliderChange}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
          thumbStyle={{ backgroundColor: '#4CAF50', width: 12, height: 12 }}
          disabled={!isPlaying || duration === 0}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>
          {formatTime(position)}
        </Text>
        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
};

export default RecordingPlayer;
