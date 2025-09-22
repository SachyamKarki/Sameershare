package com.shakshamkarki.practice;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.util.Log;
import android.content.SharedPreferences;
import androidx.core.app.NotificationManagerCompat;

import java.util.Calendar;

public class AlarmActionReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmActionReceiver";
    private static final int NOTIFICATION_ID = 12345; // Match AlarmAudioService notification ID
    private static final String PREFS_NAME = "alarm_prefs";
    private static final String SNOOZE_COUNT_PREFIX = "snooze_count_";

    // Custom snooze sequence: 5,5,5,10,3,3,3,4,4,4,2,3,4,5,6 (minutes)
    private static final int[] SNOOZE_SEQUENCE_MINUTES = new int[] {5,5,5,10,3,3,3,4,4,4,2,3,4,5,6};

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String alarmId = intent.getStringExtra("alarmId");
        
        Log.d(TAG, "🎯 Notification action received: " + action + " for alarm: " + alarmId);

        if ("STOP".equals(action) || "STOP_ALARM".equals(action)) {
            stopAlarm(context, alarmId);
        } else if ("SNOOZE".equals(action) || "SNOOZE_ALARM".equals(action)) {
            // Get audio path from current alarm service state or pass as extra
            String audioPath = intent.getStringExtra("audioPath");
            snoozeAlarm(context, alarmId, audioPath);
        } else if ("ALARM_NOTIFICATION_DISMISSED".equals(action)) {
            // User attempted to swipe/dismiss; open the alarm screen and rebuild notification
            try {
                String audioPath = intent.getStringExtra("audioPath");

                // Open full-screen activity
                Intent activityIntent = new Intent(context, AlarmActivity.class);
                activityIntent.setAction("OPEN_ALARM_SCREEN");
                activityIntent.putExtra("alarmId", alarmId != null ? alarmId : "default");
                activityIntent.putExtra("alarmTime", "Alarm Ringing");
                activityIntent.putExtra("audioPath", audioPath != null ? audioPath : "");
                activityIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TOP |
                    Intent.FLAG_ACTIVITY_SINGLE_TOP |
                    Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
                );
                context.startActivity(activityIntent);

                // Re-notify to reassert foreground status
                Intent reNotify = new Intent(context, AlarmAudioService.class);
                reNotify.setAction(AlarmAudioService.ACTION_RENOTIFY);
                context.startService(reNotify);
            } catch (Exception e) {
                Log.e(TAG, "Failed to handle notification dismiss attempt", e);
            }
        }
    }

    private void stopAlarm(Context context, String alarmId) {
        try {
            Log.d(TAG, "🛑 Stopping alarm from notification: " + alarmId);
            
            // Stop the foreground service
            Intent serviceIntent = new Intent(context, AlarmAudioService.class);
            serviceIntent.setAction(AlarmAudioService.ACTION_STOP_ALARM);
            context.startService(serviceIntent);
            
            // Stop audio and vibration (fallback)
            AlarmReceiver.stopAlarmAudio();
            
            // Cancel notification
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
            notificationManager.cancel(NOTIFICATION_ID);
            
            // Notify the app if it's running
            Intent appIntent = new Intent("com.shakshamkarki.practice.ALARM_STOPPED");
            appIntent.putExtra("alarmId", alarmId);
            context.sendBroadcast(appIntent);
            
            Log.d(TAG, "✅ Alarm stopped successfully from notification");

            // Reset snooze count for this alarm
            resetSnoozeCount(context, getBaseAlarmId(alarmId));
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop alarm", e);
        }
    }

    private void snoozeAlarm(Context context, String alarmId, String audioPath) {
        try {
            Log.d(TAG, "😴 Snoozing alarm: " + alarmId);
            
            // Stop current alarm audio service
            Intent serviceIntent = new Intent(context, AlarmAudioService.class);
            serviceIntent.setAction(AlarmAudioService.ACTION_STOP_ALARM);
            context.startService(serviceIntent);
            
            // Cancel current notification
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
            notificationManager.cancel(NOTIFICATION_ID);
            
            // Determine next snooze delay using sequence
            String baseId = getBaseAlarmId(alarmId);
            int delayMinutes = getNextSnoozeDelayMinutes(context, baseId);
            Calendar snoozeTime = Calendar.getInstance();
            snoozeTime.add(Calendar.MINUTE, delayMinutes);
            
            Intent snoozeIntent = new Intent(context, AlarmReceiver.class);
            snoozeIntent.putExtra("audioPath", audioPath);
            // Use a unique id per snooze but keep base id trackable
            String nextAlarmId = baseId + "_snooze_" + System.currentTimeMillis();
            snoozeIntent.putExtra("alarmId", nextAlarmId);
            snoozeIntent.putExtra("alarmTime", "Snoozed Alarm");
            
            PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
                context, 
                nextAlarmId.hashCode(), 
                snoozeIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP, 
                    snoozeTime.getTimeInMillis(), 
                    snoozePendingIntent
                );
                Log.d(TAG, "⏰ Snooze alarm scheduled for: " + snoozeTime.getTime() + " (" + delayMinutes + " min)");
            }
            
            // Notify the app if it's running
            Intent appIntent = new Intent("com.shakshamkarki.practice.ALARM_SNOOZED");
            appIntent.putExtra("alarmId", alarmId);
            appIntent.putExtra("snoozeTime", snoozeTime.getTimeInMillis());
            appIntent.putExtra("snoozeDelayMinutes", delayMinutes);
            context.sendBroadcast(appIntent);
            
            Log.d(TAG, "✅ Alarm snoozed for " + delayMinutes + " minutes");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to snooze alarm", e);
        }
    }

    private static String getBaseAlarmId(String alarmId) {
        if (alarmId == null) return "default";
        int idx = alarmId.indexOf("_snooze");
        if (idx >= 0) {
            return alarmId.substring(0, idx);
        }
        return alarmId;
    }

    private static int getNextSnoozeDelayMinutes(Context context, String baseAlarmId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String key = SNOOZE_COUNT_PREFIX + baseAlarmId;
        int currentCount = prefs.getInt(key, 0);
        int index = Math.min(currentCount, SNOOZE_SEQUENCE_MINUTES.length - 1);
        int delay = SNOOZE_SEQUENCE_MINUTES[index];
        // Increment for next time
        prefs.edit().putInt(key, currentCount + 1).apply();
        Log.d(TAG, "Snooze count for " + baseAlarmId + " = " + (currentCount + 1) + ", delay=" + delay + "m");
        return delay;
    }

    private static void resetSnoozeCount(Context context, String baseAlarmId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().remove(SNOOZE_COUNT_PREFIX + baseAlarmId).apply();
            Log.d(TAG, "Snooze count reset for " + baseAlarmId);
        } catch (Exception ignored) {}
    }
}

