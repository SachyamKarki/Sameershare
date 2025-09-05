/**
 * Audio Utility Functions
 * 
 * Centralized audio management functions
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { AUDIO_CONFIG } from '../constants/app';

/**
 * Configure audio mode for recording
 * @returns {Promise<void>}
 */
export const setRecordingAudioMode = async () => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: AUDIO_CONFIG.ALLOW_RECORDING_IOS,
    playsInSilentModeIOS: AUDIO_CONFIG.PLAYS_IN_SILENT_MODE_IOS,
  });
};

/**
 * Configure audio mode for playback
 * @returns {Promise<void>}
 */
export const setPlaybackAudioMode = async () => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: AUDIO_CONFIG.PLAYS_IN_SILENT_MODE_IOS,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: AUDIO_CONFIG.PLAY_THROUGH_EARPIECE_ANDROID,
    staysActiveInBackground: AUDIO_CONFIG.STAYS_ACTIVE_IN_BACKGROUND,
  });
};

/**
 * Configure audio mode for alarm playback (loudspeaker)
 * @returns {Promise<void>}
 */
export const setAlarmAudioMode = async () => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: AUDIO_CONFIG.PLAYS_IN_SILENT_MODE_IOS,
    staysActiveInBackground: AUDIO_CONFIG.STAYS_ACTIVE_IN_BACKGROUND,
    playThroughEarpieceAndroid: false, // FALSE = Use loudspeaker
  });
};

/**
 * Configure audio mode specifically for loudspeaker playback
 * @returns {Promise<void>}
 */
export const setLoudspeakerAudioMode = async () => {
  try {
    // Professional Android loudspeaker configuration
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false, // FALSE = Force loudspeaker
      staysActiveInBackground: true,
      // Android-specific: Force speakerphone mode for maximum volume
      ...(Platform.OS === 'android' && {
        interruptionModeAndroid: 1, // DO_NOT_MIX for priority audio
      }),
    });
    console.log('Audio mode configured for MAXIMUM LOUDSPEAKER playback');
  } catch (error) {
    console.error('Failed to set loudspeaker audio mode:', error);
  }
};

/**
 * Professional Android speakerphone activation
 * Forces audio through the loudest external speaker
 * @returns {Promise<void>}
 */
export const activateSpeakerphone = async () => {
  if (Platform.OS !== 'android') return;
  
  try {
    // Force maximum volume loudspeaker mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false, // Critical: FALSE for external speaker
      staysActiveInBackground: true,
      interruptionModeAndroid: 1, // Priority audio mode
    });
    
    console.log('🔊 SPEAKERPHONE MODE ACTIVATED - Maximum volume external speaker');
  } catch (error) {
    console.error('Failed to activate speakerphone:', error);
  }
};

/**
 * Validate audio file duration
 * @param {Object} sound - Audio.Sound instance
 * @param {Object} status - Audio status object
 * @returns {boolean} True if duration is valid
 */
export const isValidAudioDuration = (status) => {
  return status.durationMillis <= AUDIO_CONFIG.MAX_RECORDING_DURATION;
};

/**
 * Request audio permissions
 * @returns {Promise<boolean>} True if permissions granted
 */
export const requestAudioPermissions = async () => {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
};
