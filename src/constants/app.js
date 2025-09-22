/**
 * Application Constants
 * 
 * Centralized location for all app-wide constants
 */

// Days of the week
// Instead of hardcoding strings in UI, use translation keys
// Canonical day keys used across the app and stored in DB
export const DAYS = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat'
];

// Storage keys
export const STORAGE_KEYS = {
  ALARMS: '@alarms',
  RECORDINGS: '@recordings',
  RECORDINGS_LIST: '@recordings_list',
};

// Audio settings
export const AUDIO_CONFIG = {
  ALLOW_RECORDING_IOS: true,
  PLAYS_IN_SILENT_MODE_IOS: true,
  STAYS_ACTIVE_IN_BACKGROUND: true,
  PLAY_THROUGH_EARPIECE_ANDROID: false,
  MAX_RECORDING_DURATION: 120000, // 2 minutes in milliseconds (production limit)
};

// Storage settings (Production-Ready)
export const STORAGE_CONFIG = {
  MAX_RECORDINGS: 20,
  MAX_STORAGE_SIZE_MB: 100,
  MAX_STORAGE_SIZE_BYTES: 100 * 1024 * 1024, // 100MB
  CACHE_CLEANUP_DAYS: 7,
  MAX_RECORDING_DURATION_MS: 2 * 60 * 1000, // 2 minutes
  MIN_RECORDING_DURATION_MS: 3 * 1000, // 3 seconds
};

// Audio processing configuration for production-ready alarms
export const AUDIO_PROCESSING_CONFIG = {
  OPTIMAL_ALARM_VOLUME: 1.0,
  NIGHT_ALARM_VOLUME: 0.8,
  HIGH_QUALITY_BITRATE: 256000,
  MEDIUM_QUALITY_BITRATE: 128000,
  ACCEPTABLE_QUALITY_BITRATE: 64000,
  FADE_IN_DURATION: 2000,
  MAX_ALARM_DURATION: 30000,
  MAX_AUDIO_FILE_SIZE: 10 * 1024 * 1024,
  PREFERRED_FILE_SIZE: 5 * 1024 * 1024,
};

// UI Constants
export const UI_CONSTANTS = {
  PICKER_ITEM_SPACE: 50,
  SELECTED_TEXT_SIZE: 32,
  REGULAR_TEXT_SIZE: 20,
  PICKER_HEIGHT: 200,
};

// Colors
export const COLORS = {
  PRIMARY: '#FFA500',
  BACKGROUND: 'black',
  TEXT_PRIMARY: 'white',
  TEXT_SECONDARY: '#777',
  SUCCESS: '#228B22',
  DANGER: '#F87171',
  TRANSPARENT: 'transparent',
};

// Notification categories
export const NOTIFICATION_CATEGORIES = {
  ALARM_ACTIONS: 'alarmActions',
};

// Vibration patterns
export const VIBRATION_PATTERNS = {
  ALARM: [500, 500],
};
