package com.shakshamkarki.practice;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.util.Calendar;

public class NativeAlarmModule extends ReactContextBaseJavaModule {
    private static final String TAG = "NativeAlarmModule";
    private ReactApplicationContext reactContext;

    public NativeAlarmModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "NativeAlarmModule";
    }

    @ReactMethod
    public void scheduleAlarm(String alarmId, double fireTimeMs, String audioPath, String alarmTime, Promise promise) {
        try {
            Log.d(TAG, "Scheduling native alarm: " + alarmId + " at " + fireTimeMs);
            
            Context context = getReactApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            if (alarmManager == null) {
                promise.reject("ALARM_MANAGER_NULL", "AlarmManager is null");
                return;
            }

            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("alarmId", alarmId);
            intent.putExtra("audioPath", audioPath);
            intent.putExtra("alarmTime", alarmTime);
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, 
                alarmId.hashCode(), 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // Use setExactAndAllowWhileIdle for precise timing even in doze mode
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP, 
                (long) fireTimeMs, 
                pendingIntent
            );

            Log.d(TAG, "✅ Native alarm scheduled successfully");
            promise.resolve("Alarm scheduled");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule alarm", e);
            promise.reject("SCHEDULE_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void cancelAlarm(String alarmId, Promise promise) {
        try {
            Log.d(TAG, "Canceling native alarm: " + alarmId);
            
            Context context = getReactApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            if (alarmManager == null) {
                promise.reject("ALARM_MANAGER_NULL", "AlarmManager is null");
                return;
            }

            Intent intent = new Intent(context, AlarmReceiver.class);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, 
                alarmId.hashCode(), 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();

            Log.d(TAG, "✅ Native alarm canceled successfully");
            promise.resolve("Alarm canceled");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel alarm", e);
            promise.reject("CANCEL_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void startImmediateAlarm(String alarmId, String audioUri, Promise promise) {
        try {
            Log.d(TAG, "🚨 Starting immediate alarm: " + alarmId + " with audio: " + audioUri);
            
            Context context = getReactApplicationContext();
            
            // Create intent for immediate alarm playback
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("alarmId", alarmId);
            intent.putExtra("audioUri", audioUri);
            intent.putExtra("immediate", true);
            
            // Trigger the alarm receiver immediately
            AlarmReceiver receiver = new AlarmReceiver();
            receiver.onReceive(context, intent);
            
            Log.d(TAG, "✅ Immediate alarm started successfully");
            promise.resolve("Immediate alarm started");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to start immediate alarm", e);
            promise.reject("IMMEDIATE_ALARM_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void stopCurrentAlarm(Promise promise) {
        try {
            Log.d(TAG, "🛑 Stopping current alarm and foreground service from JS");
            
            Context context = getReactApplicationContext();
            
            // Stop the foreground service
            Intent serviceIntent = new Intent(context, AlarmAudioService.class);
            serviceIntent.setAction(AlarmAudioService.ACTION_STOP_ALARM);
            context.startService(serviceIntent);
            
            // Also stop any old receiver-based audio (fallback)
            AlarmReceiver.stopAlarmAudio();
            
            Log.d(TAG, "✅ Alarm and foreground service stop command sent");
            promise.resolve("Alarm stopped");
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop current alarm", e);
            promise.reject("STOP_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void checkAlarmPermissions(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            if (alarmManager != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                boolean canScheduleExactAlarms = alarmManager.canScheduleExactAlarms();
                promise.resolve(canScheduleExactAlarms);
            } else {
                promise.resolve(true); // Older Android versions don't need special permission
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to check alarm permissions", e);
            promise.reject("PERMISSION_CHECK_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void cancelAllAlarms(Promise promise) {
        try {
            Log.d(TAG, "🧹🧹🧹 CLEANUP: Canceling ALL scheduled alarms to prevent 500 limit 🧹🧹🧹");
            
            Context context = getReactApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            int canceledCount = 0;
            
            // Cancel alarms by creating intents with the same action but different IDs
            // We'll try to cancel a reasonable range of potential alarm IDs
            for (int i = 0; i < 1000; i++) {
                try {
                    Intent intent = new Intent(context, AlarmReceiver.class);
                    PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        context, 
                        i, 
                        intent, 
                        PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                    );
                    
                    if (pendingIntent != null) {
                        alarmManager.cancel(pendingIntent);
                        pendingIntent.cancel();
                        canceledCount++;
                    }
                } catch (Exception e) {
                    // Ignore individual cancellation errors
                }
            }
            
            // Also try string-based alarm IDs that we commonly use
            String[] commonPrefixes = {"alarm-", "test-", "snooze-", ""};
            for (String prefix : commonPrefixes) {
                for (int i = 0; i < 100; i++) {
                    try {
                        String alarmId = prefix + i;
                        Intent intent = new Intent(context, AlarmReceiver.class);
                        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                            context, 
                            alarmId.hashCode(), 
                            intent, 
                            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                        );
                        
                        if (pendingIntent != null) {
                            alarmManager.cancel(pendingIntent);
                            pendingIntent.cancel();
                            canceledCount++;
                        }
                    } catch (Exception e) {
                        // Ignore individual cancellation errors
                    }
                }
            }
            
            Log.d(TAG, "✅ CLEANUP: Canceled " + canceledCount + " existing alarms");
            Log.d(TAG, "🔄 Ready to schedule new alarms without hitting 500 limit");
            promise.resolve("Canceled " + canceledCount + " alarms");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel all alarms", e);
            promise.reject("CANCEL_ALL_FAILED", e.getMessage());
        }
    }
}

