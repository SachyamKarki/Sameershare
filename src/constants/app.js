/**
 * Application Constants
 * 
 * Centralized location for all app-wide constants
 */

// Days of the week
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  MAX_RECORDING_DURATION: 300000, // 5 minutes in milliseconds
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
  PRIMARY: '#FFA500', // Orange
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
  ALARM: [500, 500], // vibrate 500ms, pause 500ms
};
