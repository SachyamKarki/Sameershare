package com.shakshamkarki.practice;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.util.Log;
import androidx.core.app.NotificationManagerCompat;

import java.util.Calendar;

public class AlarmActionReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmActionReceiver";
    private static final int NOTIFICATION_ID = 1001;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String alarmId = intent.getStringExtra("alarmId");
        
        Log.d(TAG, "🎯 Notification action received: " + action + " for alarm: " + alarmId);

        if ("STOP".equals(action)) {
            stopAlarm(context, alarmId);
        } else if ("SNOOZE".equals(action)) {
            String audioPath = intent.getStringExtra("audioPath");
            snoozeAlarm(context, alarmId, audioPath);
        } else if ("STOP_ALARM".equals(action)) {
            stopAlarm(context, alarmId);
        } else if ("SNOOZE_ALARM".equals(action)) {
            String audioPath = intent.getStringExtra("audioPath");
            snoozeAlarm(context, alarmId, audioPath);
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
            
            // Schedule snooze alarm (5 minutes)
            Calendar snoozeTime = Calendar.getInstance();
            snoozeTime.add(Calendar.MINUTE, 5);
            
            Intent snoozeIntent = new Intent(context, AlarmReceiver.class);
            snoozeIntent.putExtra("audioPath", audioPath);
            snoozeIntent.putExtra("alarmId", alarmId + "_snooze");
            snoozeIntent.putExtra("alarmTime", "Snoozed Alarm");
            
            PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
                context, 
                (alarmId + "_snooze").hashCode(), 
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
                Log.d(TAG, "⏰ Snooze alarm scheduled for: " + snoozeTime.getTime());
            }
            
            // Notify the app if it's running
            Intent appIntent = new Intent("com.shakshamkarki.practice.ALARM_SNOOZED");
            appIntent.putExtra("alarmId", alarmId);
            appIntent.putExtra("snoozeTime", snoozeTime.getTimeInMillis());
            context.sendBroadcast(appIntent);
            
            Log.d(TAG, "✅ Alarm snoozed for 5 minutes");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to snooze alarm", e);
        }
    }
}

