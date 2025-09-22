import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Animated, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { setAlarmAudioMode } from '../../utils/audio';
import { v4 as uuidv4 } from 'uuid';
import { useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useAlarm, useTheme } from '../../context';
import { validateRecording, moveToDocumentDirectory, STORAGE_CONFIG } from '../../utils/storageManager';
import { Toast } from '../ui/Toast';
import { NavigationService, AlarmActions } from '../../services';
import { useTranslation } from 'react-i18next';

export default function Recorder() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { addRecording, recordings = [], setRecordingState } = useAlarm();
  const { colors } = useTheme();
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isStopping, setIsStopping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const processAnim = useRef(new Animated.Value(0)).current;
  const navAnim = useRef(new Animated.Value(1)).current;

  const timerRef = useRef(null);
  const meteringRef = useRef(null);
  const animatedBars = useRef(
    Array(40).fill(0).map(() => new Animated.Value(4))
  ).current;

  // Professional emulator detection function
  const checkIfEmulator = async () => {
    if (Platform.OS !== 'android') return false;
    
    try {
      const brand = await import('expo-device').then(device => device.default?.brand);
      const modelName = await import('expo-device').then(device => device.default?.modelName);
      
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
        const permission = await Audio.getPermissionsAsync();
        let status = permission.status;
        let canAskAgain = permission.canAskAgain ?? true;
        if (status !== 'granted' && canAskAgain) {
          const req = await Audio.requestPermissionsAsync();
          status = req.status;
          canAskAgain = req.canAskAgain ?? false;
        }
        if (status !== 'granted') {
          Toast.error(t('recorder.recording_failed'), t('recorder.permission_denied'));
          return;
        }

        const audioModeConfig = {
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        };

        try {
          await Audio.setAudioModeAsync(audioModeConfig);
        } catch (modeError) {
          console.warn('Failed to set audio mode, retrying with safe defaults:', modeError);
          try {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
            });
          } catch (secondError) {
            console.warn('Second attempt to set audio mode failed:', secondError);
          }
        }
        
        if (Platform.OS === 'android') {
          console.log('Running on Android - checking device type...');
          
          const isEmulator = await checkIfEmulator();
          
          if (isEmulator) {
            console.log('Android emulator detected - applying special audio configuration');
            Toast.warning('Emulator Detected', t('recorder.recording_failed'));
          } else {
            console.log('Physical Android device detected - full audio support available');
          }
        }
        
      } catch (error) {
        console.error('Audio initialization failed:', error);
        Toast.error('Audio Setup Failed', t('recorder.recording_failed'));
      }
    };

    initializeAudio();
  }, [t]);

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

  useEffect(() => {
    return () => {
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

    // Compute audio activity level (0..1)
    let level;
    if (power <= NOISE_FLOOR) {
      level = 0;
    } else {
      const range = 0 - NOISE_FLOOR;
      const aboveFloor = power - NOISE_FLOOR;
      level = Math.pow(aboveFloor / range, GAIN);
    }

    const baseHeight = MIN_HEIGHT + level * (MAX_HEIGHT - MIN_HEIGHT);

    animatedBars.forEach((bar, index) => {
      const hasAudio = level > 0.0001;
      const waveEffect = hasAudio ? Math.sin((index / 40) * Math.PI * 4) * level * 8 : 0;
      const freqEffect = hasAudio ? Math.sin((index / 10) * Math.PI) * level * 10 : 0;
      const randomness = hasAudio ? (Math.random() - 0.5) * 10 * level : 0;

      // Keep subtle idle motion even during silence so UI doesn’t look frozen
      const idleJitter = hasAudio ? 0 : (Math.sin((Date.now() / 120) + index * 0.3) * 2);
      const idleBaseline = hasAudio ? 0 : 4;

      const finalHeight = Math.max(
        MIN_HEIGHT,
        Math.min(
          MAX_HEIGHT,
          baseHeight + waveEffect + freqEffect + randomness + idleJitter + idleBaseline
        )
      );

      Animated.timing(bar, {
        toValue: finalHeight,
        duration: 80,
        useNativeDriver: false,
      }).start();
    });
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording process...');
      
      console.log('🔍 Checking permissions...');
      let { status, canAskAgain } = await Audio.getPermissionsAsync();
      console.log('📋 Permission status:', status);
      
      if (status !== 'granted') {
        if (canAskAgain) {
          const req = await Audio.requestPermissionsAsync();
          status = req.status;
          canAskAgain = req.canAskAgain;
        }
        if (status !== 'granted') {
          console.log('❌ Permission denied');
          Toast.error(t('recorder.recording_failed'), t('recorder.permission_denied'));
          return;
        }
      }

      if (recording) {
        console.log('🧹 Cleaning up existing recording...');
        try {
          await recording.stopAndUnloadAsync();
          console.log('✅ Existing recording stopped');
        } catch (cleanupError) {
          console.log('⚠️ Cleanup error:', cleanupError);
        }
        setRecording(null);
      }

      console.log('🛑 Clearing intervals...');
      if (timerRef.current) clearInterval(timerRef.current);
      if (meteringRef.current) clearInterval(meteringRef.current);

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: Platform.OS === 'android' ? 22050 : 44100,
          numberOfChannels: 1,
          bitRate: Platform.OS === 'android' ? 64000 : 128000,
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

      console.log('Creating new Audio.Recording instance...');
      const rec = new Audio.Recording();
      
      console.log('Preparing recording with options:', recordingOptions);
      try {
        await rec.prepareToRecordAsync(recordingOptions);
        console.log('✅ Recording prepared successfully');
      } catch (prepError) {
        console.error('Recording preparation failed:', prepError);
        
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
            isMeteringEnabled: false,
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

      // Ensure we are in recording mode (speaker off for mic quality but still loud in playback later)
      try { await setAlarmAudioMode(); } catch {}
      console.log('▶️ Starting recording...');
      await rec.startAsync();
      console.log('✅ Recording started successfully');
      
      console.log('🔄 Setting recording state...');
      setRecording(rec);
      setIsRecording(true);
      setRecordingState(true); // Update global recording state
      setSeconds(0);
      console.log('✅ Recording state set successfully');

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          
          if (newSeconds >= STORAGE_CONFIG.MAX_RECORDING_DURATION_MS / 1000) {
            console.log('📏 Maximum recording duration reached, auto-stopping...');
            stopRecording();
            return newSeconds;
          }
          
          return newSeconds;
        });
      }, 1000);

      meteringRef.current = setInterval(async () => {
        if (rec) {
          try {
            const status = await rec.getStatusAsync();
            if (status.isRecording) {
              // Even if metering is undefined on some devices, keep idle animation
              updateWaveVisualization(status.metering ?? -160);
            }
          } catch (error) {
            console.log('Metering error:', error);
          }
        }
      }, 120);
    } catch (error) {
      console.error('❌ Recording start failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = t('recorder.recording_failed');
      if (error.message.includes('permission')) {
        errorMessage = t('recorder.permission_denied');
      } else if (error.message.includes('busy') || error.message.includes('in use')) {
        errorMessage = t('recorder.recording_failed');
      } else if (error.message.includes('prepare')) {
        errorMessage = t('recorder.recording_failed');
      } else if (error.message.includes('start')) {
        errorMessage = t('recorder.recording_failed');
      } else if (Platform.OS === 'android') {
        errorMessage = t('recorder.recording_failed');
      }
      
      console.log('📢 Showing error toast:', errorMessage);
      Toast.error(t('recorder.recording_failed'), errorMessage);
      
      console.log('🔄 Resetting state after error...');
      setIsRecording(false);
      setRecordingState(false); // Update global recording state
      setRecording(null);
      if (timerRef.current) clearInterval(timerRef.current);
      if (meteringRef.current) clearInterval(meteringRef.current);
      console.log('✅ State reset completed');
    }
  };

  const stopRecording = async () => {
    try {
      console.log('🛑 Attempting to stop recording...');
      
      if (isStopping) {
        console.log('⏳ Already stopping recording, ignoring request');
        return;
      }
      
      if (!recording) {
        console.log('❌ No recording object found');
        Toast.warning(t('recorder.no_recording'), t('recorder.no_recording'));
        return;
      }
      
      setIsStopping(true);
      console.log('🔒 Set stopping state to prevent multiple calls');

      console.log('📱 Recording object exists, stopping...');
      clearInterval(timerRef.current);
      clearInterval(meteringRef.current);

      console.log('🎵 Calling stopAndUnloadAsync...');
      await recording.stopAndUnloadAsync();
      console.log('✅ Recording stopped successfully');
      const uri = recording.getURI();
      console.log('📁 Recording URI obtained:', uri);
      
      setIsRecording(false);
      setRecordingState(false); // Update global recording state
      setRecording(null);
      setSeconds(0);
      
      console.log('🔄 Recording state reset completed');
      
      if (!uri) {
        Toast.error(t('recorder.recording_failed'), t('recorder.recording_failed'));
        setIsStopping(false);
        return;
      }
      
      let fileInfo = { exists: true, size: 0 };
      
      try {
        fileInfo = await FileSystem.getInfoAsync(uri);
        console.log('Recording file info:', fileInfo);
        
        if (!fileInfo.exists) {
          Toast.error(t('recorder.recording_failed'), t('recorder.recording_failed'));
          setIsStopping(false);
          return;
        }
        
        if (fileInfo.size === 0) {
          Toast.error(t('recorder.recording_failed'), t('recorder.recording_empty'));
          setIsStopping(false);
          return;
        }
        
        console.log(`Recording saved successfully: ${fileInfo.size} bytes`);
        
      } catch (error) {
        console.error('Error checking recording file:', error);
      }

      animatedBars.forEach(bar => {
        Animated.timing(bar, {
          toValue: 4,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });

      const durationMs = seconds * 1000;
      const MIN_SECONDS = 3;
      if (durationMs < MIN_SECONDS * 1000) {
        try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch (e) {}
        Toast.warning(t('recorder.recording_invalid'), t('recorder.recording_too_short') || 'Recording is too short. Please record at least 3 seconds.');
        setIsStopping(false);
        return;
      }
      const validation = await validateRecording(uri, durationMs);
      
      if (!validation.valid) {
        Toast.error(t('recorder.recording_invalid'), validation.reason || t('recorder.recording_failed'));
        setIsStopping(false);
        return;
      }

      const now = new Date();
      const timestamp = now.getTime();
      const baseUuid = uuidv4().replace(/-/g, '');
      const uniqueId = (timestamp * parseInt(baseUuid.substring(0, 8), 16)).toString(36);
      const recordingId = `rec_${uniqueId}`;
      const fileName = `recording-${recordingId}.m4a`;
      
      const moveResult = await moveToDocumentDirectory(uri, fileName);
      
      if (!moveResult.success) {
        Toast.error(t('recorder.storage_error'), t('recorder.storage_error'));
        return;
      }

      const currentRecordingCount = recordings.length + 1;
      
      const recordingData = {
        id: recordingId,
        audioUri: moveResult.newUri,
        name: `# Recording ${currentRecordingCount.toString().padStart(2, '0')}`,
        duration: durationMs,
        uploadedAt: now.getTime(),
        fileSize: moveResult.fileInfo?.size || 0
      };

      addRecording(recordingData);
      console.log('✅ Recording saved to permanent storage:', recordingData);

      // After recording completes, navigate to Set Alarm screen
      try {
        navigation.navigate('HomeTab', {
          screen: 'SetAlarmScreen',
          params: { selectedAudio: recordingData.audioUri, recordingId: recordingData.id }
        });
      } catch (e) {
        console.warn('Navigation to SetAlarmScreen failed, fallback to home');
        navigation.navigate('HomeTab');
      }
      
      setIsStopping(false);
      console.log('🏁 Recording stop completed successfully');
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      setIsRecording(false);
      setRecordingState(false); // Update global recording state
      setRecording(null);
      setSeconds(0);
      setIsStopping(false);
      
      if (timerRef.current) clearInterval(timerRef.current);
      if (meteringRef.current) clearInterval(meteringRef.current);
      
      let errorMessage = t('recorder.recording_failed');
      if (error.message?.includes('recording')) {
        errorMessage = t('recorder.recording_failed');
      } else if (error.message?.includes('permission')) {
        errorMessage = t('recorder.permission_denied');
      } else if (error.message?.includes('file')) {
        errorMessage = t('recorder.storage_error');
      }
      
      Toast.error(t('recorder.recording_failed'), errorMessage);
    }
  };

  const importAudio = async () => {
    try {
      // Do not allow import while recording is active
      if (isRecording) {
        Toast.warning(t('recorder.import_blocked'), t('recorder.import_blocked_message'));
        return;
      }
      // Check if audio is currently being played by checking AlarmActions
      const alarmStatus = AlarmActions.getCurrentAlarmStatus();
      if (alarmStatus.isActive) {
        Toast.warning(t('recorder.import_blocked'), t('recorder.import_blocked_message'));
        return;
      }

      setIsProcessing(true);
      Animated.spring(processAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: false,
      }).start();

      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsProcessing(false);
        Animated.timing(processAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
        return;
      }

      const file = result.assets[0];
      
      if (file.size > 10 * 1024 * 1024) {
        Toast.error(t('recorder.file_too_large'), t('recorder.file_too_large'));
        return;
      }

      const recordingId = uuidv4();
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/[/,:]/g, '').replace(' ', '-');
      
      const fileExtension = file.name.split('.').pop() || 'm4a';
      const fileName = `upload-${formattedDate}-${recordingId}.${fileExtension}`;
      
      const validation = await validateRecording(file.uri, file.size);
      if (!validation.valid) {
        Toast.error(t('recorder.invalid_audio'), validation.reason);
        return;
      }

      const moveResult = await moveToDocumentDirectory(file.uri, fileName);
      if (!moveResult.success) {
        setIsProcessing(false);
        Animated.timing(processAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
        Toast.error(t('recorder.import_failed'), t('recorder.import_failed'));
        return;
      }

      const recordingData = {
        id: recordingId,
        audioUri: moveResult.newUri,
        name: file.name.replace(/\.[^/.]+$/, ""),
        duration: validation.durationMs || 0,
        uploadedAt: now.getTime(),
        fileSize: moveResult.fileInfo?.size || file.size,
        isUploaded: true
      };

      addRecording(recordingData);
      
      setIsProcessing(false);
      setIsNavigating(true);
      
      Animated.parallel([
        Animated.timing(processAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(navAnim, {
          toValue: 0.8,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        })
      ]).start();

      setTimeout(() => {
        Animated.spring(navAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }).start(() => {
          setIsNavigating(false);
          NavigationService.navigateToRecordingsWithHighlight(recordingData.id, {
            source: 'recorder',
            timestamp: Date.now(),
          });
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error importing audio:', error);
      setIsProcessing(false);
      setIsNavigating(false);
      Animated.parallel([
        Animated.timing(processAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(navAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        })
      ]).start();
      Toast.error(t('recorder.import_failed'), t('recorder.import_failed'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.waveContainer}>
        {animatedBars.map((animatedValue, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveBar,
              {
                height: animatedValue,
                opacity: isRecording ? 1 : 0.3,
              }
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.recordButtonWrapper}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.6}
            disabled={isStopping}
            style={[
              styles.recordButton,
              {
                flexDirection: isRecording ? 'column' : 'row',
                backgroundColor: 'rgba(255,0,0,0.8)',
              }
            ]}
          >
            {!isRecording ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome6 name="microphone" size={24} color="white" />
                <Text style={styles.recordButtonText}>{t('recorder.record')}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.recordButtonText}>{isStopping ? t('recorder.stopping') : t('recorder.stop')}</Text>
                <Animated.Text style={styles.timerText}>
                  {formatTime(seconds)}
                </Animated.Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Default Alarm Button Removed */}
      <View style={styles.uploadContainer}>
        <View style={styles.uploadButtonWrapper}>
          {/* Default alarm button removed as requested */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    marginBottom: 8,
    borderRadius: 20,
    marginHorizontal: 8,
    paddingVertical: 12,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    marginHorizontal: 12,
    marginTop: 8,
    gap: 2,
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'transparent', // Blend into background
    borderRadius: 0,
    paddingHorizontal: 0,
  },
  waveBar: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
    // Ensure no shadow at all for a clean, professional look
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 2,
    zIndex: 1,
  },
  recordButtonWrapper: {
    position: 'relative',
  },
  recordButton: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    minWidth: 220,
    minHeight: 65,
    justifyContent: 'center',
    // Remove shadows for flat look
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    marginVertical: 8,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: -0.5,
    fontFamily: 'Times New Roman',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
    marginTop: 2,
    fontFamily: 'Times New Roman',
  },
  separatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  separatorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'Times New Roman',
  },
  uploadContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  uploadButtonWrapper: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 100,
    minHeight: 32,
    shadowColor: 'rgba(128,128,128,0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  uploadButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Times New Roman',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 120,
    minHeight: 44,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.3)',
    // Remove shadow/inner dark container on Android
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  defaultAlarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,165,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.4)',
    shadowColor: 'rgba(255,165,0,0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  defaultAlarmButtonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 6,
    fontFamily: 'Times New Roman',
  },
});