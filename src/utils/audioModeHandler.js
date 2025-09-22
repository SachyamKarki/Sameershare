/**
 * Audio Mode Handler
 * 
 * Comprehensive error handling for audio mode configuration
 * Handles platform-specific differences and fallback strategies
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import errorHandler from './errorHandler';

class AudioModeHandler {
  /**
   * Configure audio mode with comprehensive error handling
   */
  static async configureAudioMode(config, operation = 'unknown') {
    try {
      console.log(`🎵 Configuring audio mode for ${operation}...`);
      
      // Validate configuration
      const validatedConfig = this.validateConfig(config);
      
      // Apply platform-specific configurations
      const platformConfig = this.applyPlatformSpecificConfig(validatedConfig);
      
      // Attempt to set audio mode
      await Audio.setAudioModeAsync(platformConfig);
      
      console.log(`✅ Audio mode configured successfully for ${operation}`);
      return { success: true, config: platformConfig };
      
    } catch (error) {
      console.error(`❌ Audio mode configuration failed for ${operation}:`, error);
      errorHandler.logError(error, { operation, platform: Platform.OS });
      
      // Try fallback configuration
      return await this.tryFallbackConfiguration(config, operation);
    }
  }

  /**
   * Validate audio mode configuration
   */
  static validateConfig(config) {
    const validatedConfig = { ...config };
    
    // Ensure required properties exist
    const requiredProps = ['allowsRecordingIOS', 'playsInSilentModeIOS'];
    requiredProps.forEach(prop => {
      if (validatedConfig[prop] === undefined) {
        validatedConfig[prop] = prop === 'allowsRecordingIOS' ? false : true;
      }
    });
    
    return validatedConfig;
  }

  /**
   * Apply platform-specific configurations
   */
  static applyPlatformSpecificConfig(config) {
    const platformConfig = { ...config };
    
    try {
      // Add Android-specific configurations
      if (Platform.OS === 'android') {
        if (config.interruptionModeAndroid !== undefined) {
          platformConfig.interruptionModeAndroid = config.interruptionModeAndroid;
        }
        if (config.shouldDuckAndroid !== undefined) {
          platformConfig.shouldDuckAndroid = config.shouldDuckAndroid;
        }
        if (config.playThroughEarpieceAndroid !== undefined) {
          platformConfig.playThroughEarpieceAndroid = config.playThroughEarpieceAndroid;
        }
      }
      
      // Add iOS-specific configurations
      if (Platform.OS === 'ios') {
        if (config.interruptionModeIOS !== undefined) {
          platformConfig.interruptionModeIOS = config.interruptionModeIOS;
        }
        if (config.playsInSilentModeIOS !== undefined) {
          platformConfig.playsInSilentModeIOS = config.playsInSilentModeIOS;
        }
        if (config.allowsRecordingIOS !== undefined) {
          platformConfig.allowsRecordingIOS = config.allowsRecordingIOS;
        }
      }
      
      // Add common configurations
      if (config.staysActiveInBackground !== undefined) {
        platformConfig.staysActiveInBackground = config.staysActiveInBackground;
      }
      
    } catch (platformError) {
      console.warn('⚠️ Platform-specific configuration failed:', platformError.message);
      // Continue with basic config
    }
    
    return platformConfig;
  }

  /**
   * Try fallback configuration if primary fails
   */
  static async tryFallbackConfiguration(originalConfig, operation) {
    try {
      console.log(`🔄 Attempting fallback audio mode configuration for ${operation}...`);
      
      // Create minimal fallback configuration
      const fallbackConfig = {
        allowsRecordingIOS: originalConfig.allowsRecordingIOS || false,
        playsInSilentModeIOS: originalConfig.playsInSilentModeIOS !== false,
        staysActiveInBackground: originalConfig.staysActiveInBackground !== false,
      };
      
      // Add platform-specific fallbacks
      if (Platform.OS === 'android') {
        fallbackConfig.shouldDuckAndroid = originalConfig.shouldDuckAndroid !== false;
        fallbackConfig.playThroughEarpieceAndroid = originalConfig.playThroughEarpieceAndroid !== false;
      }
      
      await Audio.setAudioModeAsync(fallbackConfig);
      
      console.log(`✅ Fallback audio mode configuration successful for ${operation}`);
      return { success: true, config: fallbackConfig, fallback: true };
      
    } catch (fallbackError) {
      console.error(`❌ Fallback audio mode configuration also failed for ${operation}:`, fallbackError);
      errorHandler.logError(fallbackError, { operation: `${operation}_fallback`, platform: Platform.OS });
      
      return { 
        success: false, 
        error: fallbackError.message,
        details: `Failed to configure audio mode for ${operation}`
      };
    }
  }

  /**
   * Get optimal audio mode configuration for different operations
   */
  static getOptimalConfig(operation) {
    const configs = {
      playback: {
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
        // Remove problematic interruption modes for now
        // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      },
      
      recording: {
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: true,
        staysActiveInBackground: true,
      },
      
      alarm: {
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
        // Remove problematic interruption modes for now
        // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      },
      
      default: {
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      }
    };
    
    return configs[operation] || configs.default;
  }

  /**
   * Configure audio mode for specific operation
   */
  static async configureForOperation(operation) {
    const config = this.getOptimalConfig(operation);
    return await this.configureAudioMode(config, operation);
  }
}

export default AudioModeHandler;