/**
 * Professional Audio Service
 * 
 * Centralized audio management with comprehensive error handling
 * Handles default LFG audio, custom recordings, and alarm audio
 */

import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import errorHandler, { handleAudioError } from '../utils/errorHandler';
import AudioModeHandler from '../utils/audioModeHandler';

// Default LFG audio asset
const LFG_AUDIO_ASSET = require('../../assets/audio/lfg_default.mp3');

class AudioService {
  constructor() {
    this.currentSound = null;
    this.currentUri = null;
    this.isPlaying = false;
    this.lfgResolvedUri = null;
    this.initialized = false;
  }

  /**
   * Initialize the audio service
   */
  async initialize() {
    if (this.initialized) return { success: true };

    try {
      console.log('🎵 Initializing AudioService...');
      
      // Preload LFG audio asset
      await this.preloadLFGAudio();
      
      // Set initial audio mode
      await this.setPlaybackAudioMode();
      
      this.initialized = true;
      console.log('✅ AudioService initialized successfully');
      
      return { success: true };
    } catch (error) {
      errorHandler.logError(error, { operation: 'initialize' });
      return { 
        success: false, 
        error: error.message,
        details: handleAudioError(error, { operation: 'initialize' })
      };
    }
  }

  /**
   * Preload LFG audio asset for reliable playback
   */
  async preloadLFGAudio() {
    try {
      console.log('🎵 Preloading LFG audio asset...');
      
      // Try multiple approaches to resolve the LFG audio asset
      let resolvedUri = null;
      
      try {
        // Method 1: Try Asset.fromModule if available
        if (Asset && typeof Asset.fromModule === 'function') {
          console.log('🎵 Using Asset.fromModule method...');
          const asset = Asset.fromModule(LFG_AUDIO_ASSET);
          
          if (!asset.localUri && !asset.downloaded) {
            console.log('📥 Downloading LFG audio asset...');
            await asset.downloadAsync();
          }
          
          resolvedUri = asset.localUri || asset.uri;
          console.log('✅ LFG audio resolved via Asset.fromModule:', resolvedUri);
        } else {
          throw new Error('Asset.fromModule not available');
        }
      } catch (error) {
        console.warn('⚠️ Asset.fromModule failed, trying alternative methods:', error.message);
        
        try {
          // Method 2: Try to resolve using require() directly
          console.log('🎵 Using direct require method...');
          resolvedUri = LFG_AUDIO_ASSET;
          console.log('✅ LFG audio resolved via direct require:', resolvedUri);
        } catch (requireError) {
          console.warn('⚠️ Direct require failed:', requireError.message);
          
          // Method 3: Use a fallback path
          console.log('🎵 Using fallback method...');
          resolvedUri = null; // Will use asset directly in playback
        }
      }
      
      this.lfgResolvedUri = resolvedUri;
      console.log('✅ LFG audio preload completed:', this.lfgResolvedUri);
      
      return { success: true, uri: this.lfgResolvedUri };
    } catch (error) {
      console.warn('⚠️ LFG audio preload failed, will use asset directly:', error.message);
      this.lfgResolvedUri = null; // Will use asset directly
      return { success: true, uri: null };
    }
  }

  /**
   * Set audio mode for playback with comprehensive error handling
   */
  async setPlaybackAudioMode() {
    const result = await AudioModeHandler.configureForOperation('playback');
    if (!result.success) {
      errorHandler.logError(new Error(result.error), { operation: 'setPlaybackAudioMode' });
    }
    return result;
  }

  /**
   * Set audio mode for recording with comprehensive error handling
   */
  async setRecordingAudioMode() {
    const result = await AudioModeHandler.configureForOperation('recording');
    if (!result.success) {
      errorHandler.logError(new Error(result.error), { operation: 'setRecordingAudioMode' });
    }
    return result;
  }

  /**
   * Play audio with comprehensive error handling
   */
  async playAudio(audioItem, options = {}) {
    try {
      console.log('🎵 Starting audio playback:', { 
        id: audioItem?.id, 
        uri: audioItem?.audioUri || audioItem?.uri,
        type: audioItem?.id === 'lfg_default_audio' ? 'default' : 'custom'
      });

      // Initialize if not done
      if (!this.initialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error(initResult.details || 'Audio service initialization failed');
        }
      }

      // Stop current audio if playing
      if (this.isPlaying) {
        await this.stopAudio();
      }

      // Set playback audio mode
      const modeResult = await this.setPlaybackAudioMode();
      if (!modeResult.success) {
        console.warn('⚠️ Audio mode configuration failed, continuing anyway:', modeResult.error);
      }

      // Determine audio source
      const audioSource = await this.resolveAudioSource(audioItem);
      if (!audioSource.success) {
        throw new Error(audioSource.details || 'Failed to resolve audio source');
      }

      // Create and play sound
      const soundResult = await this.createAndPlaySound(audioSource.source, options);
      if (!soundResult.success) {
        throw new Error(soundResult.details || 'Failed to create and play sound');
      }

      this.currentSound = soundResult.sound;
      this.currentUri = audioItem?.audioUri || audioItem?.uri;
      this.isPlaying = true;

      console.log('✅ Audio playback started successfully');
      return { 
        success: true, 
        sound: this.currentSound,
        duration: soundResult.duration 
      };

    } catch (error) {
      console.error('❌ Audio playback failed:', error);
      
      // Clean up on error
      await this.cleanup();
      
      return { 
        success: false, 
        error: error.message,
        details: 'Audio playback failed'
      };
    }
  }

  /**
   * Resolve audio source (default LFG or custom)
   */
  async resolveAudioSource(audioItem) {
    try {
      const audioUri = audioItem?.audioUri || audioItem?.uri;
      
      // Handle default LFG audio
      if (audioItem?.id === 'lfg_default_audio' || audioUri === 'default_alarm_sound') {
        console.log('🎵 Resolving default LFG audio...');
        
        try {
          // Try to get the resolved URI first
          if (this.lfgResolvedUri) {
            console.log('🎵 Using preloaded LFG URI:', this.lfgResolvedUri);
            return { 
              success: true, 
              source: { uri: this.lfgResolvedUri },
              type: 'default_lfg'
            };
          } else {
            // Fallback to asset directly
            console.log('🎵 Using LFG asset directly (Asset.fromModule not available)');
            return { 
              success: true, 
              source: LFG_AUDIO_ASSET,
              type: 'default_lfg_asset'
            };
          }
        } catch (error) {
          console.error('❌ Failed to resolve LFG audio:', error);
          // Final fallback to asset
          return { 
            success: true, 
            source: LFG_AUDIO_ASSET,
            type: 'default_lfg_asset_fallback'
          };
        }
      }
      
      // Handle custom audio
      if (audioUri && typeof audioUri === 'string') {
        // Validate file exists
        if (audioUri.startsWith('file://') || audioUri.startsWith('/')) {
          const fileInfo = await FileSystem.getInfoAsync(audioUri);
          if (!fileInfo.exists) {
            throw new Error('Audio file does not exist');
          }
        }
        
        return { 
          success: true, 
          source: { uri: audioUri },
          type: 'custom'
        };
      }
      
      throw new Error('No valid audio source found');
      
    } catch (error) {
      console.error('❌ Failed to resolve audio source:', error);
      return { 
        success: false, 
        error: error.message,
        details: 'Failed to resolve audio source'
      };
    }
  }

  /**
   * Create and play sound with error handling
   */
  async createAndPlaySound(source, options = {}) {
    try {
      console.log('🎵 Creating sound object...', { source, type: typeof source });
      
      const playbackOptions = {
        shouldPlay: true,
        volume: options.volume || 1.0,
        isLooping: options.isLooping || false,
        isMuted: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        ...options.playbackOptions
      };

      // Handle different source types
      let audioSource = source;
      if (typeof source === 'object' && source.uri) {
        audioSource = source;
      } else if (typeof source === 'number') {
        // Asset module
        audioSource = source;
      } else if (typeof source === 'string') {
        audioSource = { uri: source };
      }

      console.log('🎵 Final audio source:', audioSource);

      const { sound, status } = await Audio.Sound.createAsync(audioSource, playbackOptions);
      
      // Get duration
      const duration = status.durationMillis || 0;
      console.log('🎵 Sound created successfully, duration:', duration);
      
      return { 
        success: true, 
        sound, 
        duration,
        status 
      };
      
    } catch (error) {
      console.error('❌ Failed to create sound:', error);
      console.error('❌ Source was:', source);
      console.error('❌ Options were:', options);
      
      return { 
        success: false, 
        error: error.message,
        details: 'Failed to create audio sound object'
      };
    }
  }

  /**
   * Stop current audio playback
   */
  async stopAudio() {
    try {
      if (this.currentSound) {
        console.log('🛑 Stopping audio playback...');
        
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        
        this.currentSound = null;
        this.currentUri = null;
        this.isPlaying = false;
        
        console.log('✅ Audio playback stopped');
        return { success: true };
      }
      
      return { success: true, message: 'No audio was playing' };
      
    } catch (error) {
      console.error('❌ Failed to stop audio:', error);
      
      // Force cleanup
      await this.cleanup();
      
      return { 
        success: false, 
        error: error.message,
        details: 'Failed to stop audio playback'
      };
    }
  }

  /**
   * Pause current audio playback
   */
  async pauseAudio() {
    try {
      if (this.currentSound && this.isPlaying) {
        console.log('⏸️ Pausing audio playback...');
        
        await this.currentSound.pauseAsync();
        this.isPlaying = false;
        
        console.log('✅ Audio playback paused');
        return { success: true };
      }
      
      return { success: true, message: 'No audio was playing' };
      
    } catch (error) {
      console.error('❌ Failed to pause audio:', error);
      return { 
        success: false, 
        error: error.message,
        details: 'Failed to pause audio playback'
      };
    }
  }

  /**
   * Resume paused audio playback
   */
  async resumeAudio() {
    try {
      if (this.currentSound && !this.isPlaying) {
        console.log('▶️ Resuming audio playback...');
        
        await this.currentSound.playAsync();
        this.isPlaying = true;
        
        console.log('✅ Audio playback resumed');
        return { success: true };
      }
      
      return { success: true, message: 'No audio to resume' };
      
    } catch (error) {
      console.error('❌ Failed to resume audio:', error);
      return { 
        success: false, 
        error: error.message,
        details: 'Failed to resume audio playback'
      };
    }
  }

  /**
   * Get current playback status
   */
  async getPlaybackStatus() {
    try {
      if (!this.currentSound) {
        return { 
          success: true, 
          status: { 
            isPlaying: false, 
            position: 0, 
            duration: 0 
          } 
        };
      }

      const status = await this.currentSound.getStatusAsync();
      
      return { 
        success: true, 
        status: {
          isPlaying: status.isPlaying || false,
          position: status.positionMillis || 0,
          duration: status.durationMillis || 0,
          isLoaded: status.isLoaded || false,
          didJustFinish: status.didJustFinish || false
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get playback status:', error);
      return { 
        success: false, 
        error: error.message,
        details: 'Failed to get playback status'
      };
    }
  }

  /**
   * Seek to specific position
   */
  async seekToPosition(positionMillis) {
    try {
      if (!this.currentSound) {
        throw new Error('No audio is currently loaded');
      }

      await this.currentSound.setPositionAsync(positionMillis);
      
      console.log('✅ Seeked to position:', positionMillis);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to seek:', error);
      return { 
        success: false, 
        error: error.message,
        details: 'Failed to seek to position'
      };
    }
  }

  /**
   * Set volume
   */
  async setVolume(volume) {
    try {
      if (!this.currentSound) {
        throw new Error('No audio is currently loaded');
      }

      await this.currentSound.setVolumeAsync(volume);
      
      console.log('✅ Volume set to:', volume);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to set volume:', error);
      return { 
        success: false, 
        error: error.message,
        details: 'Failed to set volume'
      };
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      if (this.currentSound) {
        await this.currentSound.unloadAsync();
      }
      
      this.currentSound = null;
      this.currentUri = null;
      this.isPlaying = false;
      
      console.log('🧹 Audio service cleaned up');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return { 
        success: false, 
        error: error.message,
        details: 'Failed to cleanup audio service'
      };
    }
  }

  /**
   * Validate audio file
   */
  async validateAudioFile(audioUri) {
    try {
      if (!audioUri || typeof audioUri !== 'string') {
        return { 
          valid: false, 
          error: 'Invalid audio URI',
          details: 'Audio URI must be a valid string'
        };
      }

      // Check if it's a file URI
      if (audioUri.startsWith('file://') || audioUri.startsWith('/')) {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        
        if (!fileInfo.exists) {
          return { 
            valid: false, 
            error: 'File does not exist',
            details: 'Audio file not found at specified path'
          };
        }
        
        if (fileInfo.size === 0) {
          return { 
            valid: false, 
            error: 'Empty file',
            details: 'Audio file is empty'
          };
        }
      }

      return { valid: true };
      
    } catch (error) {
      console.error('❌ Audio validation failed:', error);
      return { 
        valid: false, 
        error: error.message,
        details: 'Failed to validate audio file'
      };
    }
  }

  /**
   * Show user-friendly error alert
   */
  showErrorAlert(error, title = 'Audio Error') {
    errorHandler.showErrorAlert(error, title, error.details);
  }
}

// Create singleton instance
const audioService = new AudioService();

export default audioService;