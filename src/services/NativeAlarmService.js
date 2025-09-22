/**
 * Native Alarm Service
 * 
 * Bridge to native Android AlarmManager for alarms that work when app is terminated
 */

import { NativeModules, Platform } from 'react-native';

const { NativeAlarmModule } = NativeModules;

// Safely import utils
let nextDateForDayAtTime;
try {
  const timeUtils = require('../utils/time');
  nextDateForDayAtTime = timeUtils.nextDateForDayAtTime;
} catch (error) {
  console.warn('Could not import time utils:', error);
}

class NativeAlarmService {
  /**
   * Check if native alarm module is available
   */
  static isAvailable() {
    try {
      return Platform.OS === 'android' && NativeAlarmModule != null;
    } catch (error) {
      console.warn('Error checking native alarm availability:', error);
      return false;
    }
  }

  /**
   * Schedule a native alarm that works when app is terminated
   * @param {Object} params - Alarm parameters
   * @returns {Promise<boolean>} Success status
   */
  static async scheduleNativeAlarm({
    alarmId,
    fireDate,
    audioPath,
    alarmTime,
  }) {
    try {
      if (!this.isAvailable()) {
        console.warn('Native alarm module not available');
        return false;
      }

      console.log('🚨 Scheduling native alarm:', {
        alarmId,
        fireDate: new Date(fireDate).toLocaleString(),
        audioPath,
        alarmTime,
      });

      await NativeAlarmModule.scheduleAlarm(
        alarmId,
        fireDate,
        audioPath || '',
        alarmTime || 'Alarm'
      );

      console.log('✅ Native alarm scheduled successfully');
      return true;

    } catch (error) {
      console.error('Failed to schedule native alarm:', error);
      return false;
    }
  }

  /**
   * Cancel a native alarm
   * @param {string} alarmId - Alarm ID to cancel
   * @returns {Promise<boolean>} Success status
   */
  static async cancelNativeAlarm(alarmId) {
    try {
      if (!this.isAvailable()) {
        console.warn('Native alarm module not available');
        return false;
      }

      console.log('🛑 Canceling native alarm:', alarmId);

      await NativeAlarmModule.cancelAlarm(alarmId);

      console.log('✅ Native alarm canceled successfully');
      return true;

    } catch (error) {
      console.error('Failed to cancel native alarm:', error);
      return false;
    }
  }

  /**
   * Start immediate alarm playback (for when alarm should ring right now)
   * @param {string} alarmId - Unique alarm identifier
   * @param {string} audioUri - Path to the audio file
   * @returns {Promise<boolean>} Success status
   */
  static async startImmediateAlarm(alarmId, audioUri) {
    try {
      if (!this.isAvailable()) {
        console.warn('Native alarm module not available');
        return false;
      }

      console.log('🚨 Starting immediate native alarm:', { alarmId, audioUri });

      await NativeAlarmModule.startImmediateAlarm(alarmId, audioUri);
      console.log('✅ Immediate alarm started successfully');
      return true;

    } catch (error) {
      console.error('Failed to start immediate alarm:', error);
      return false;
    }
  }

  /**
   * Stop the currently playing alarm and foreground service
   * @returns {Promise<boolean>} Success status
   */
  static async stopCurrentAlarm() {
    try {
      if (!this.isAvailable()) {
        console.warn('Native alarm module not available');
        return false;
      }

      console.log('🛑 Stopping native alarm and foreground service');
      await NativeAlarmModule.stopCurrentAlarm();
      console.log('✅ Native alarm and foreground service stopped');
      return true;

    } catch (error) {
      console.error('Failed to stop current alarm:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled alarms to prevent hitting the 500 alarm limit
   * @returns {Promise<boolean>} Success status
   */
  static async cancelAllAlarms() {
    try {
      if (!this.isAvailable()) {
        console.warn('Native alarm module not available');
        return false;
      }

      console.log('🧹 Cleaning up all scheduled alarms to prevent 500 limit');
      const result = await NativeAlarmModule.cancelAllAlarms();
      console.log('✅ Alarm cleanup completed:', result);
      return true;

    } catch (error) {
      console.error('Failed to cancel all alarms:', error);
      return false;
    }
  }

  /**
   * Check if the app has permission to schedule exact alarms (Android 12+)
   * @returns {Promise<boolean>} Permission status
   */
  static async checkAlarmPermissions() {
    try {
      if (!this.isAvailable()) {
        return true; // Assume permissions are fine if not on Android
      }

      const hasPermission = await NativeAlarmModule.checkAlarmPermissions();
      
      if (!hasPermission) {
        console.warn('⚠️ App does not have permission to schedule exact alarms');
        console.warn('User needs to grant "Schedule exact alarms" permission in system settings');
      }

      return hasPermission;

    } catch (error) {
      console.error('Failed to check alarm permissions:', error);
      return false;
    }
  }

  /**
   * Schedule multiple native alarms for different days
   * @param {Object} params - Alarm parameters with days array
   * @returns {Promise<Array>} Array of scheduled alarm IDs
   */
  static async scheduleNativeAlarmsForDays({
    alarmId,
    audioUri,
    days,
    time,
  }) {
    try {
      console.log('🚨 SIMPLIFIED Native Alarm Scheduling:', {
        alarmId,
        audioUri,
        days,
        time,
      });

      // Convert audioUri to proper file path
      let audioPath = '';
      if (audioUri) {
        if (audioUri === 'default_alarm_sound') {
          // Pass the special identifier to Android - it will handle loading LFG audio from assets
          audioPath = 'default_alarm_sound';
          console.log(`🎵 Using LFG default audio identifier`);
        } else if (audioUri.startsWith('file://')) {
          audioPath = audioUri.replace('file://', '');
        } else {
          audioPath = audioUri;
        }
        console.log(`🎵 Audio conversion: ${audioUri} -> ${audioPath}`);
      }

      const scheduledIds = [];
      const { hour, minute, ampm } = time;
      
      // Convert to 24-hour format
      let hour24 = parseInt(hour);
      if (ampm === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (ampm === 'AM' && hour24 === 12) {
        hour24 = 0;
      }

      const timeLabel = `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;

      for (const day of days) {
        const fireDate = nextDateForDayAtTime(day, hour24, minute);
        const uniqueAlarmId = `${alarmId}-${day}`;

        console.log(`📅 Scheduling for ${day}: ${uniqueAlarmId} at ${fireDate.toLocaleString()}`);

        const success = await this.scheduleNativeAlarm({
          alarmId: uniqueAlarmId,
          fireDate: fireDate.getTime(),
          audioPath,
          alarmTime: timeLabel,
        });

        if (success) {
          scheduledIds.push(uniqueAlarmId);
        }
      }

      console.log(`✅ Native alarms scheduled: ${scheduledIds.length}/${days.length}`);
      
      return {
        success: scheduledIds.length > 0,
        alarmIds: scheduledIds,
        error: scheduledIds.length === 0 ? 'No alarms scheduled' : null,
      };

    } catch (error) {
      console.error('Failed to schedule native alarms for days:', error);
      return {
        success: false,
        alarmIds: [],
        error: error.message,
      };
    }
  }

  /**
   * Cancel multiple native alarms
   * @param {Array} alarmIds - Array of alarm IDs to cancel
   * @returns {Promise<number>} Number of successfully canceled alarms
   */
  static async cancelMultipleNativeAlarms(alarmIds) {
    let canceledCount = 0;

    try {
      for (const alarmId of alarmIds) {
        const success = await this.cancelNativeAlarm(alarmId);
        if (success) {
          canceledCount++;
        }
      }

      console.log(`✅ Canceled ${canceledCount}/${alarmIds.length} native alarms`);
      return canceledCount;

    } catch (error) {
      console.error('Failed to cancel multiple native alarms:', error);
      return canceledCount;
    }
  }

}

export default NativeAlarmService;

