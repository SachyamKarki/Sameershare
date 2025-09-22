import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import audioService from '../services/AudioService';

export const useAudioPlayer = () => {
  const { t } = useTranslation();
  const [sound, setSound] = useState(null);
  const [playingUri, setPlayingUri] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const intervalRef = useRef(null);

  // Initialize audio service
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const initResult = await audioService.initialize();
        if (!initResult.success && mounted) {
          console.warn('Audio service initialization failed:', initResult.error);
        }
      } catch (error) {
        console.warn('Failed to initialize audio service:', error);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const playAudio = async (item) => {
    try {
      if (!item) {
        console.warn('No item provided to playAudio');
        return;
      }
      
      const audioUri = item.audioUri || item.uri;
      
      // If same audio is already playing, pause it
      if (sound && playingUri === audioUri && isPlayingAudio) {
        const pauseResult = await audioService.pauseAudio();
        if (pauseResult.success) {
          setIsPlayingAudio(false);
          clearInterval(intervalRef.current);
        }
        return;
      }

      setIsLoading(true);
      
      // Use the professional audio service
      const playResult = await audioService.playAudio(item, {
        volume: 1.0,
        isLooping: false,
        playbackOptions: {
          shouldPlay: true,
          playsInSilentMode: true,
          staysActiveInBackground: true,
        }
      });

      if (!playResult.success) {
        console.error('🎵 Audio playback failed:', playResult.error);
        audioService.showErrorAlert(playResult, 'Playback Error');
        return;
      }

      // Update state
      setSound(playResult.sound);
      setPlayingUri(audioUri);
      setIsPlayingAudio(true);
      setDuration(playResult.duration || 0);

      // Start position tracking
      startPositionTracking();

      console.log('🎵 Audio playback started successfully');

    } catch (error) {
      console.error('🎵 Playback error:', error);
      Alert.alert(t('common.error'), t('recordings.playError'));
    } finally {
      setIsLoading(false);
    }
  };

  const startPositionTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const statusResult = await audioService.getPlaybackStatus();
        if (statusResult.success) {
          const status = statusResult.status;
          setPosition(status.position);
          
          if (status.didJustFinish) {
            console.log('🎵 Audio finished playing');
            setIsPlayingAudio(false);
            setPosition(0);
            clearInterval(intervalRef.current);
          }
        }
      } catch (intervalErr) {
        console.warn('🎵 Position update error:', intervalErr);
      }
    }, 100);
  };

  const stopAudio = async () => {
    try {
      const stopResult = await audioService.stopAudio();
      if (stopResult.success) {
        clearInterval(intervalRef.current);
        setSound(null);
        setPlayingUri(null);
        setIsPlayingAudio(false);
        setPosition(0);
        setDuration(0);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const seekToPosition = async (value) => {
    try {
      const seekResult = await audioService.seekToPosition(value);
      if (seekResult.success) {
        setPosition(value);
      }
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Audio service will handle cleanup
      audioService.cleanup();
    };
  }, []);

  return {
    sound,
    playingUri,
    position,
    duration,
    isPlayingAudio,
    isLoading,
    playAudio,
    stopAudio,
    seekToPosition,
  };
};