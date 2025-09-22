/**
 * Professional Error Handling Utility
 * 
 * Centralized error management with user-friendly messages
 * and comprehensive logging for debugging
 */

import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

// Error categories for better handling
export const ERROR_CATEGORIES = {
  AUDIO: 'audio',
  ALARM: 'alarm',
  RECORDING: 'recording',
  NETWORK: 'network',
  PERMISSION: 'permission',
  STORAGE: 'storage',
  UNKNOWN: 'unknown'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error types with user-friendly messages
export const ERROR_MESSAGES = {
  // Audio errors
  AUDIO_FILE_NOT_FOUND: {
    category: ERROR_CATEGORIES.AUDIO,
    severity: ERROR_SEVERITY.HIGH,
    userMessage: 'Audio file not found. Please check if the file exists.',
    technicalMessage: 'Audio file does not exist at specified path'
  },
  AUDIO_PLAYBACK_FAILED: {
    category: ERROR_CATEGORIES.AUDIO,
    severity: ERROR_SEVERITY.MEDIUM,
    userMessage: 'Failed to play audio. Please try again.',
    technicalMessage: 'Audio playback initialization failed'
  },
  AUDIO_PERMISSION_DENIED: {
    category: ERROR_CATEGORIES.PERMISSION,
    severity: ERROR_SEVERITY.HIGH,
    userMessage: 'Audio permission denied. Please enable audio permissions in settings.',
    technicalMessage: 'Audio recording/playback permission not granted'
  },
  
  // Alarm errors
  ALARM_SCHEDULE_FAILED: {
    category: ERROR_CATEGORIES.ALARM,
    severity: ERROR_SEVERITY.HIGH,
    userMessage: 'Failed to schedule alarm. Please try again.',
    technicalMessage: 'Native alarm scheduling failed'
  },
  ALARM_CANCEL_FAILED: {
    category: ERROR_CATEGORIES.ALARM,
    severity: ERROR_SEVERITY.MEDIUM,
    userMessage: 'Failed to cancel alarm. Please try again.',
    technicalMessage: 'Native alarm cancellation failed'
  },
  
  // Recording errors
  RECORDING_START_FAILED: {
    category: ERROR_CATEGORIES.RECORDING,
    severity: ERROR_SEVERITY.HIGH,
    userMessage: 'Failed to start recording. Please check permissions.',
    technicalMessage: 'Audio recording initialization failed'
  },
  RECORDING_SAVE_FAILED: {
    category: ERROR_CATEGORIES.RECORDING,
    severity: ERROR_SEVERITY.HIGH,
    userMessage: 'Failed to save recording. Please try again.',
    technicalMessage: 'Recording file save operation failed'
  },
  
  // Storage errors
  STORAGE_FULL: {
    category: ERROR_CATEGORIES.STORAGE,
    severity: ERROR_SEVERITY.HIGH,
    userMessage: 'Storage is full. Please free up space and try again.',
    technicalMessage: 'Insufficient storage space available'
  },
  FILE_ACCESS_DENIED: {
    category: ERROR_CATEGORIES.STORAGE,
    severity: ERROR_SEVERITY.HIGH,
    userMessage: 'File access denied. Please check permissions.',
    technicalMessage: 'File system access permission denied'
  },
  
  // Network errors
  NETWORK_UNAVAILABLE: {
    category: ERROR_CATEGORIES.NETWORK,
    severity: ERROR_SEVERITY.MEDIUM,
    userMessage: 'Network unavailable. Please check your connection.',
    technicalMessage: 'Network connection not available'
  },
  
  // Generic errors
  UNKNOWN_ERROR: {
    category: ERROR_CATEGORIES.UNKNOWN,
    severity: ERROR_SEVERITY.MEDIUM,
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalMessage: 'Unknown error occurred'
  }
};

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100; // Keep last 100 errors
  }

  /**
   * Log error with comprehensive details
   */
  logError(error, context = {}) {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      context,
      category: this.categorizeError(error),
      severity: this.determineSeverity(error)
    };

    // Add to log
    this.errorLog.push(errorDetails);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console with appropriate level
    this.logToConsole(errorDetails);
  }

  /**
   * Categorize error based on message and context
   */
  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('audio') || message.includes('sound') || message.includes('playback')) {
      return ERROR_CATEGORIES.AUDIO;
    }
    if (message.includes('alarm') || message.includes('schedule') || message.includes('cancel')) {
      return ERROR_CATEGORIES.ALARM;
    }
    if (message.includes('recording') || message.includes('record')) {
      return ERROR_CATEGORIES.RECORDING;
    }
    if (message.includes('permission') || message.includes('denied')) {
      return ERROR_CATEGORIES.PERMISSION;
    }
    if (message.includes('storage') || message.includes('file') || message.includes('disk')) {
      return ERROR_CATEGORIES.STORAGE;
    }
    if (message.includes('network') || message.includes('connection')) {
      return ERROR_CATEGORIES.NETWORK;
    }
    
    return ERROR_CATEGORIES.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error) {
    const message = error.message?.toLowerCase() || '';
    
    // Critical errors that prevent core functionality
    if (message.includes('crash') || message.includes('fatal') || message.includes('corrupt')) {
      return ERROR_SEVERITY.CRITICAL;
    }
    
    // High severity errors that affect main features
    if (message.includes('failed') || message.includes('error') || message.includes('exception')) {
      return ERROR_SEVERITY.HIGH;
    }
    
    // Medium severity warnings
    if (message.includes('warning') || message.includes('timeout')) {
      return ERROR_SEVERITY.MEDIUM;
    }
    
    return ERROR_SEVERITY.LOW;
  }

  /**
   * Log to console with appropriate formatting
   */
  logToConsole(errorDetails) {
    const { category, severity, message, context } = errorDetails;
    
    const logMessage = `[${severity.toUpperCase()}] ${category.toUpperCase()}: ${message}`;
    const contextStr = Object.keys(context).length > 0 ? `\nContext: ${JSON.stringify(context, null, 2)}` : '';
    
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        console.error(`🚨 ${logMessage}${contextStr}`);
        break;
      case ERROR_SEVERITY.HIGH:
        console.error(`❌ ${logMessage}${contextStr}`);
        break;
      case ERROR_SEVERITY.MEDIUM:
        console.warn(`⚠️ ${logMessage}${contextStr}`);
        break;
      case ERROR_SEVERITY.LOW:
        console.info(`ℹ️ ${logMessage}${contextStr}`);
        break;
      default:
        console.log(`📝 ${logMessage}${contextStr}`);
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error, customMessage = null) {
    if (customMessage) {
      return customMessage;
    }

    const message = error.message?.toLowerCase() || '';
    
    // Check for specific error patterns
    if (message.includes('file not found') || message.includes('does not exist')) {
      return ERROR_MESSAGES.AUDIO_FILE_NOT_FOUND.userMessage;
    }
    if (message.includes('permission') || message.includes('denied')) {
      return ERROR_MESSAGES.AUDIO_PERMISSION_DENIED.userMessage;
    }
    if (message.includes('storage') || message.includes('space')) {
      return ERROR_MESSAGES.STORAGE_FULL.userMessage;
    }
    if (message.includes('network') || message.includes('connection')) {
      return ERROR_MESSAGES.NETWORK_UNAVAILABLE.userMessage;
    }
    
    return ERROR_MESSAGES.UNKNOWN_ERROR.userMessage;
  }

  /**
   * Show error alert to user
   */
  showErrorAlert(error, title = 'Error', customMessage = null) {
    const message = this.getUserFriendlyMessage(error, customMessage);
    
    Alert.alert(
      title,
      message,
      [
        { 
          text: 'OK', 
          style: 'default' 
        }
      ]
    );
  }

  /**
   * Show error alert with retry option
   */
  showErrorAlertWithRetry(error, title = 'Error', onRetry = null, customMessage = null) {
    const message = this.getUserFriendlyMessage(error, customMessage);
    
    const buttons = [
      { text: 'OK', style: 'default' }
    ];
    
    if (onRetry) {
      buttons.unshift({
        text: 'Retry',
        style: 'default',
        onPress: onRetry
      });
    }
    
    Alert.alert(title, message, buttons);
  }

  /**
   * Handle async operation with error handling
   */
  async handleAsyncOperation(operation, context = {}) {
    try {
      const result = await operation();
      return { success: true, result };
    } catch (error) {
      this.logError(error, context);
      return { 
        success: false, 
        error: error.message,
        details: this.getUserFriendlyMessage(error)
      };
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byCategory: {},
      bySeverity: {},
      recent: this.errorLog.slice(-10) // Last 10 errors
    };

    // Count by category
    this.errorLog.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error log
   */
  clearLog() {
    this.errorLog = [];
  }

  /**
   * Export error log for debugging
   */
  exportErrorLog() {
    return {
      timestamp: new Date().toISOString(),
      errors: this.errorLog,
      stats: this.getErrorStats()
    };
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

export default errorHandler;

// Convenience functions for common use cases
export const handleAudioError = (error, context = {}) => {
  errorHandler.logError(error, { ...context, category: ERROR_CATEGORIES.AUDIO });
  return errorHandler.getUserFriendlyMessage(error);
};

export const handleAlarmError = (error, context = {}) => {
  errorHandler.logError(error, { ...context, category: ERROR_CATEGORIES.ALARM });
  return errorHandler.getUserFriendlyMessage(error);
};

export const handleRecordingError = (error, context = {}) => {
  errorHandler.logError(error, { ...context, category: ERROR_CATEGORIES.RECORDING });
  return errorHandler.getUserFriendlyMessage(error);
};

export const showErrorAlert = (error, title = 'Error', customMessage = null) => {
  errorHandler.showErrorAlert(error, title, customMessage);
};

export const showErrorAlertWithRetry = (error, title = 'Error', onRetry = null, customMessage = null) => {
  errorHandler.showErrorAlertWithRetry(error, title, onRetry, customMessage);
};