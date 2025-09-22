package com.shakshamkarki.practice;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * Helper to schedule snooze/reschedule alarms natively.
 */
public final class AlarmScheduler {
    private static final String TAG = "AlarmScheduler";

    private AlarmScheduler() {}

    public static void scheduleSnooze(Context context, String alarmId, String audioPath, long delayMillis) {
        try {
            long triggerAt = System.currentTimeMillis() + Math.max(0L, delayMillis);

            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("audioPath", audioPath);
            intent.putExtra("alarmId", alarmId);
            intent.putExtra("alarmTime", "Snoozed Alarm");

            int requestCode = alarmId.hashCode();
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) {
                Log.e(TAG, "AlarmManager not available");
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
            }

            Log.d(TAG, "Snooze scheduled for " + delayMillis + "ms later, id=" + alarmId);
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule snooze", e);
        }
    }
}


