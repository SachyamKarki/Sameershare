/**
 * AlarmActions Service
 * 
 * Centralized alarm control logic for stop and snooze functionality
 * Works from both app screens and notification actions
 */

import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import NotificationService from './NotificationService';
import NativeAlarmService from './NativeAlarmService';

class AlarmActions {
  static currentSound = null;
  static isAlarmActive = false;
  static currentAlarmData = null;

  /**
   * Set current alarm state
   * @param {Object} alarmData - Current alarm data
   * @param {Object} sound - Current sound instance
   */
  static setCurrentAlarm(alarmData, sound = null) {
    this.currentAlarmData = alarmData;
    this.currentSound = sound;
    this.isAlarmActive = true;
    console.log('🚨 Alarm state set:', alarmData?.alarmId);
  }

  /**
   * Clear current alarm state
   */
  static clearCurrentAlarm() {
    this.currentAlarmData = null;
    this.currentSound = null;
    this.isAlarmActive = false;
    console.log('✅ Alarm state cleared');
  }

  /**
   * Stop alarm - works from both app and notification
   * @param {Object} options - Stop options
   * @param {string} options.alarmId - Alarm ID to stop
   * @param {boolean} options.isBackgroundAlarm - Whether this is a background alarm
   * @param {Function} options.onComplete - Callback when stop is complete
   * @returns {Promise<boolean>} Success status
   */
  static async stopAlarm({ alarmId, isBackgroundAlarm, onComplete } = {}) {
    try {
      console.log('🛑 Stopping alarm:', { alarmId, isBackgroundAlarm });

      // Stop vibration
      Vibration.cancel();

      // Stop local audio
      if (this.currentSound) {
        try {
          await this.currentSound.stopAsync();
          await this.currentSound.unloadAsync();
        } catch (error) {
          console.warn('Error stopping local sound:', error);
        }
      }

      // Stop native alarm service if this is a background alarm
      if (isBackgroundAlarm) {
        console.log('🔇 Stopping native alarm service');
        await NativeAlarmService.stopCurrentAlarm();
      }

      // Dismiss all notifications
      await Notifications.dismissAllNotificationsAsync().catch(error => {
        console.warn('Error dismissing notifications:', error);
      });

      // Clear alarm state
      this.clearCurrentAlarm();

      // Call completion callback
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }

      console.log('✅ Alarm stopped successfully');
      return true;

    } catch (error) {
      console.error('❌ Error stopping alarm:', error);
      return false;
    }
  }

  /**
   * Snooze alarm - works from both app and notification
   * @param {Object} options - Snooze options
   * @param {string} options.alarmId - Alarm ID to snooze
   * @param {string} options.audioUri - Audio URI for the alarm
   * @param {boolean} options.isBackgroundAlarm - Whether this is a background alarm
   * @param {number} options.snoozeMinutes - Minutes to snooze (default: 5)
   * @param {Function} options.onComplete - Callback when snooze is complete
   * @returns {Promise<boolean>} Success status
   */
  static async snoozeAlarm({ 
    alarmId, 
    audioUri, 
    isBackgroundAlarm, 
    snoozeMinutes = 5, 
    onComplete 
  } = {}) {
    try {
      console.log('😴 Snoozing alarm:', { alarmId, snoozeMinutes });

      // First stop the current alarm
      await this.stopAlarm({ alarmId, isBackgroundAlarm });

      // Schedule snooze notification
      if (alarmId) {
        await NotificationService.scheduleSnoozeNotification(
          alarmId,
          audioUri,
          snoozeMinutes
        );
        console.log(`⏰ Snooze scheduled for ${snoozeMinutes} minutes`);
      }

      // Call completion callback
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }

      console.log('✅ Alarm snoozed successfully');
      return true;

    } catch (error) {
      console.error('❌ Error snoozing alarm:', error);
      return false;
    }
  }

  /**
   * Handle notification action
   * @param {string} action - Action identifier (STOP, SNOOZE, DEFAULT)
   * @param {Object} data - Notification data
   * @param {Function} navigationCallback - Navigation callback for opening alarm screen
   * @returns {Promise<boolean>} Success status
   */
  static async handleNotificationAction(action, data, navigationCallback) {
    try {
      console.log('📱 Handling notification action:', action, data?.alarmId);

      switch (action) {
        case 'STOP':
          return await this.stopAlarm({
            alarmId: data?.alarmId,
            isBackgroundAlarm: data?.isPersistentAlarm || data?.isBackgroundAlarm,
          });

        case 'SNOOZE':
          return await this.snoozeAlarm({
            alarmId: data?.alarmId,
            audioUri: data?.audioUri,
            isBackgroundAlarm: data?.isPersistentAlarm || data?.isBackgroundAlarm,
            snoozeMinutes: 5,
          });

        case 'DEFAULT':
          // User tapped the notification - Native Java AlarmActivity will handle this
          console.log('📱 Notification tapped - Native AlarmActivity should be open');
          // No navigation needed - native Java AlarmActivity handles alarm UI
          return true;

        default:
          console.warn('Unknown notification action:', action);
          return false;
      }

    } catch (error) {
      console.error('❌ Error handling notification action:', error);
      return false;
    }
  }

  /**
   * Get current alarm status
   * @returns {Object} Current alarm status
   */
  static getCurrentAlarmStatus() {
    return {
      isActive: this.isAlarmActive,
      alarmData: this.currentAlarmData,
      hasSound: !!this.currentSound,
    };
  }
}

export default AlarmActions;
