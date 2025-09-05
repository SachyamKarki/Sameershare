/**
 * Src Index
 * 
 * Main entry point for the src directory
 * Professional export structure for the entire application
 */

// Main App Component
export { default as App } from './App';

// Navigation
export { default as TabNavigator } from './navigation/navigation';
export { navigationRef, navigate, navigateNested } from './navigation/navigation';

// Context Providers
export { AlarmProvider, useAlarm } from './context';

// Screen Components
export {
  HomeScreen,
  SetAlarmScreen,
  RecordingScreen,
} from './screens';

// UI Components
export {
  TimeDisplay,
  AmPmSelector,
  DaysSelector,
  AlarmList,
  Recorder
} from './components';

// Services
export { default as NotificationService } from './services/NotificationService';

// Constants
export * from './constants/app';

// Utilities
export * from './utils';
