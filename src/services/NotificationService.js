/**
 * Notification Service
 * 
 * Centralized notification management
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATION_CATEGORIES, DAYS } from '../constants/app';
import { formatTimeLabel, nextDateForDayAtTime } from '../utils/time';
import NativeAlarmService from './NativeAlarmService';

class NotificationService {
  /**
   * Initialize notification service with native alarm support
   */
  static async initialize() {
    // Check native alarm permissions on startup
    const hasNativePermissions = await NativeAlarmService.checkAlarmPermissions();
    if (!hasNativePermissions) {
      console.warn('⚠️ Native alarm permissions not granted - alarms may not work when app is terminated');
    }
    // Request permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const isAlarm = notification.request.content.data?.action === 'ALARM_RINGING';
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: isAlarm ? true : false, // Enable sound for alarms
          shouldSetBadge: isAlarm ? true : false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });

    // Create dedicated alarm notification channel (Android)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alarm-channel', {
        name: 'Alarm Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        description: 'Critical alarm notifications with audio',
        sound: 'default', // Enable default notification sound
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });
    }

    // Create notification categories with enhanced action buttons
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.ALARM_ACTIONS, [
      { 
        identifier: 'STOP', 
        buttonTitle: '🛑 Stop', 
        options: { 
          opensAppToForeground: false,  // Stop without opening app
          isDestructive: true 
        } 
      },
      { 
        identifier: 'SNOOZE', 
        buttonTitle: '😴 Snooze 5min', 
        options: { 
          opensAppToForeground: false,  // Snooze without opening app
          isAuthenticationRequired: false 
        } 
      },
    ]);
  }

  /**
   * Enhanced alarm scheduling with native support for terminated app functionality
   * @param {Object} params - Alarm parameters
   * @returns {Promise<Object>} Object containing both expo and native alarm IDs
   */
  static async scheduleEnhancedAlarmsForDays({
    hour24,
    minute,
    alarmId,
    audioUri,
    displayHour,
    displayMinute,
    displayAmPm,
    days,
  }) {
    const result = {
      expoIds: [],
      nativeIds: [],
      success: false,
    };

    try {
      console.log('🚨 Scheduling NATIVE-FIRST alarms (Native Primary + Expo Fallback)');

      // CRITICAL: Clean up old alarms FIRST to prevent 500 limit
      if (NativeAlarmService.isAvailable()) {
        console.log('🧹 CLEANUP: Preventing 500 alarm limit by cleaning old alarms');
        try {
          await NativeAlarmService.cancelAllAlarms();
        } catch (cleanupError) {
          console.warn('Alarm cleanup failed, continuing:', cleanupError);
        }
      }

      // SIMPLIFIED: Use ONLY native alarms for ALL alarm functionality
      if (NativeAlarmService.isAvailable()) {
        console.log('🚨 NATIVE-ONLY ALARM SYSTEM - Simplified and Professional');
        
        // Schedule native alarms that handle everything independently
        const nativeResult = await NativeAlarmService.scheduleNativeAlarmsForDays({
          alarmId,
          audioUri,
          days,
          time: {
            hour: displayHour,
            minute: displayMinute,
            ampm: displayAmPm,
          },
        });

        if (nativeResult && nativeResult.success) {
          result.nativeIds = nativeResult.alarmIds || [];
          result.success = true;
          console.log('✅ NATIVE-ONLY SYSTEM: Professional single notification per alarm');
          console.log(`📅 Scheduled ${result.nativeIds.length} native alarms for days:`, days);
          
          // CRITICAL: No Expo notifications - native system provides professional notifications
          result.expoIds = [];
          
          // Return immediately - no fallback needed
          return result;
          
        } else {
          console.error('❌ Native alarm scheduling failed:', nativeResult?.error);
        }
      } else {
        console.warn('⚠️ Native alarm service not available');
      }

      // 3. FALLBACK: Only use Expo if native completely failed
      if (!result.success) {
        console.log('⚠️ FALLBACK: Using Expo notifications only (limited functionality when app terminated)');
        
        // Also cleanup Expo notifications to prevent buildup
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
          console.log('🧹 Cleaned up old Expo notifications');
        } catch (error) {
          console.warn('Failed to cleanup Expo notifications:', error);
        }
        
        const expoIds = await this.scheduleAlarmsForDays({
          hour24,
          minute,
          alarmId,
          audioUri,
          displayHour,
          displayMinute,
          displayAmPm,
          days,
        });

        result.expoIds = expoIds;
        result.success = result.expoIds.length > 0;
      }
      
      console.log(`✅ Enhanced alarms scheduled:`, {
        expo: result.expoIds.length,
        native: result.nativeIds.length,
      });

      return result;

    } catch (error) {
      console.error('Failed to schedule enhanced alarms:', error);
      return result;
    }
  }

  /**
   * Cancel enhanced alarms (both Expo and native)
   * @param {Object} alarmData - Alarm data with IDs
   * @returns {Promise<boolean>} Success status
   */
  static async cancelEnhancedAlarms(alarmData) {
    try {
      let success = true;

      // Cancel Expo notifications
      if (alarmData.expoIds && alarmData.expoIds.length > 0) {
        for (const expoId of alarmData.expoIds) {
          try {
            await Notifications.cancelScheduledNotificationAsync(expoId);
          } catch (error) {
            console.warn('Failed to cancel expo notification:', expoId, error);
            success = false;
          }
        }
      }

      // Cancel native alarms
      if (alarmData.nativeIds && alarmData.nativeIds.length > 0) {
        const canceledCount = await NativeAlarmService.cancelMultipleNativeAlarms(alarmData.nativeIds);
        if (canceledCount < alarmData.nativeIds.length) {
          success = false;
        }
      }

      console.log('✅ Enhanced alarms canceled');
      return success;

    } catch (error) {
      console.error('Failed to cancel enhanced alarms:', error);
      return false;
    }
  }

  /**
   * Schedule alarms for multiple days (legacy method - now used internally)
   * @param {Object} params - Alarm parameters
   * @returns {Promise<Array>} Array of notification IDs
   */
  static async scheduleAlarmsForDays({
    hour24,
    minute,
    alarmId,
    audioUri,
    displayHour,
    displayMinute,
    displayAmPm,
    days,
  }) {
    const ids = [];
    const timeLabel = formatTimeLabel(displayHour, displayMinute, displayAmPm);

    for (const day of days) {
      const fireDate = nextDateForDayAtTime(day, hour24, minute);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 Alarm - ${timeLabel}`,
          body: `It's ${timeLabel}. Your custom alarm is playing!`,
          categoryIdentifier: NOTIFICATION_CATEGORIES.ALARM_ACTIONS,
          sound: audioUri ? 'default' : 'default', // Enable notification sound
          priority: 'max',
          vibrationPattern: [0, 250, 250, 250],
          badge: 1,
          data: {
            alarmId,
            audioUri,
            repeatWeekly: true,
            day,
            hour24,
            minute,
            scheduledFor: fireDate.getTime(),
            action: 'ALARM_RINGING', // Add action for app handling
          },
        },
        trigger: { 
          type: 'date', 
          date: fireDate,
          channelId: 'alarm-channel' // Use dedicated alarm channel
        },
      });

      ids.push(id);
    }

    return ids;
  }

  /**
   * Schedule a snooze notification
   * @param {string} alarmId - Alarm ID
   * @param {string} audioUri - Audio URI
   * @param {number} snoozeMinutes - Minutes to snooze (default: 5)
   * @returns {Promise<string>} Notification ID
   */
  static async scheduleSnoozeNotification(alarmId, audioUri, snoozeMinutes = 5) {
    const now = new Date();
    const snoozeTime = new Date(now.getTime() + snoozeMinutes * 60 * 1000);

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '😴 Alarm (Snoozed)',
        body: `Your alarm will ring again in ${snoozeMinutes} minutes.`,
        categoryIdentifier: NOTIFICATION_CATEGORIES.ALARM_ACTIONS,
        sound: 'default',
        priority: 'max',
        vibrationPattern: [0, 250, 250, 250],
        data: { 
          alarmId, 
          audioUri, 
          isSnooze: true,
          action: 'ALARM_RINGING'
        },
      },
      trigger: { 
        type: 'date', 
        date: snoozeTime,
        channelId: 'alarm-channel'
      },
    });
  }

  /**
   * Cancel a notification
   * @param {string} notificationId - Notification ID to cancel
   * @returns {Promise<void>}
   */
  static async cancelNotification(notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all notifications for an alarm
   * @param {Array} notificationIds - Array of notification IDs
   * @returns {Promise<void>}
   */
  static async cancelAlarmNotifications(notificationIds) {
    const promises = notificationIds.map(id => 
      Notifications.cancelScheduledNotificationAsync(id)
    );
    await Promise.all(promises);
  }

  /**
   * Add notification listeners
   * @param {Function} onReceived - Callback for received notifications
   * @param {Function} onResponse - Callback for notification responses
   * @returns {Object} Object with remove functions for cleanup
   */
  static addNotificationListeners(onReceived, onResponse) {
    const receivedSubscription = Notifications.addNotificationReceivedListener(onReceived);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(onResponse);

    return {
      remove: () => {
        receivedSubscription.remove();
        responseSubscription.remove();
      }
    };
  }
}

export default NotificationService;

