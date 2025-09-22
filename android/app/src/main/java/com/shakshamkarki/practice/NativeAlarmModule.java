package com.shakshamkarki.practice;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
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

            // Use BroadcastReceiver for better reliability with terminated apps
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
            
            // Cancel any existing alarm first to prevent duplicates
            alarmManager.cancel(pendingIntent);

            // PROFESSIONAL FIX: Use setExactAndAllowWhileIdle for precise timing even in doze mode
            // CRITICAL: This prevents Android from creating its own system alarm notification
            try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP, 
                    (long) fireTimeMs, 
                    pendingIntent
                );
                Log.d(TAG, "✅ PROFESSIONAL: Exact alarm scheduled - NO system notification will be created");
            } catch (SecurityException e) {
                Log.e(TAG, "❌ SECURITY: Exact alarm permission not granted", e);
                promise.reject("EXACT_ALARM_PERMISSION_DENIED", "Please grant exact alarm permission in Settings → Apps → Practice → Special access → Alarms & reminders");
                return;
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to set exact alarm", e);
                // PROFESSIONAL FIX: Fallback to regular alarm but with explicit logging
                try {
                    alarmManager.set(AlarmManager.RTC_WAKEUP, (long) fireTimeMs, pendingIntent);
                    Log.w(TAG, "⚠️ PROFESSIONAL FALLBACK: Using regular alarm (may be delayed, but NO system notification)");
                } catch (SecurityException se) {
                    promise.reject("ALARM_PERMISSION_DENIED", "Alarm permissions denied by system");
                    return;
                }
            }

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
            
            // Create intent for immediate alarm playback using service directly
            Intent intent = new Intent(context, AlarmAudioService.class);
            intent.setAction(AlarmAudioService.ACTION_START_ALARM);
            intent.putExtra(AlarmAudioService.EXTRA_ALARM_ID, alarmId);
            intent.putExtra(AlarmAudioService.EXTRA_AUDIO_PATH, audioUri); // Convert audioUri to audioPath
            
            // Start the alarm service immediately
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
            
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
            
            // Create comprehensive permission status
            com.facebook.react.bridge.WritableMap permissionStatus = com.facebook.react.bridge.Arguments.createMap();
            
            // Check exact alarm permission (Android 12+)
            boolean canScheduleExactAlarms = BatteryOptimizationHelper.canScheduleExactAlarms(context);
            permissionStatus.putBoolean("canScheduleExactAlarms", canScheduleExactAlarms);
            
            // Check battery optimization status
            boolean isIgnoringBatteryOptimizations = BatteryOptimizationHelper.isIgnoringBatteryOptimizations(context);
            permissionStatus.putBoolean("isIgnoringBatteryOptimizations", isIgnoringBatteryOptimizations);
            
            // Get OEM-specific instructions
            String oemInstructions = BatteryOptimizationHelper.getOEMSpecificInstructions();
            permissionStatus.putString("oemInstructions", oemInstructions);
            
            // Check notification permissions
            android.app.NotificationManager notificationManager = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            boolean notificationsEnabled = true;
            if (notificationManager != null) {
                notificationsEnabled = notificationManager.areNotificationsEnabled();
            }
            permissionStatus.putBoolean("notificationsEnabled", notificationsEnabled);
            
            // Overall status
            boolean allPermissionsGranted = canScheduleExactAlarms && isIgnoringBatteryOptimizations && notificationsEnabled;
            permissionStatus.putBoolean("allPermissionsGranted", allPermissionsGranted);
            
            Log.d(TAG, "📋 Comprehensive permission check completed:");
            Log.d(TAG, "  - Exact alarms: " + canScheduleExactAlarms);
            Log.d(TAG, "  - Battery optimization: " + isIgnoringBatteryOptimizations);
            Log.d(TAG, "  - Notifications: " + notificationsEnabled);
            Log.d(TAG, "  - All granted: " + allPermissionsGranted);
            
            promise.resolve(permissionStatus);
            
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

    @ReactMethod
    public void requestBatteryOptimizationExemption(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            
            if (!BatteryOptimizationHelper.isIgnoringBatteryOptimizations(context)) {
                android.content.Intent intent = BatteryOptimizationHelper.createBatteryOptimizationIntent(context);
                if (intent != null) {
                    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    promise.resolve("Battery optimization request sent");
                } else {
                    promise.resolve("Battery optimization not required on this Android version");
                }
            } else {
                promise.resolve("Already exempted from battery optimization");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to request battery optimization exemption", e);
            promise.reject("BATTERY_OPTIMIZATION_REQUEST_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void requestExactAlarmPermission(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            
            if (!BatteryOptimizationHelper.canScheduleExactAlarms(context)) {
                android.content.Intent intent = BatteryOptimizationHelper.getExactAlarmPermissionIntent(context);
                if (intent != null) {
                    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    promise.resolve("Exact alarm permission request sent");
                } else {
                    promise.resolve("Exact alarm permission not required on this Android version");
                }
            } else {
                promise.resolve("Exact alarm permission already granted");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to request exact alarm permission", e);
            promise.reject("EXACT_ALARM_REQUEST_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void openAppSettings(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            android.content.Intent intent = BatteryOptimizationHelper.getAppBatterySettingsIntent(context);
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            promise.resolve("App settings opened");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to open app settings", e);
            promise.reject("OPEN_SETTINGS_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void openAlarmScreen(String alarmId, String alarmTime, String audioPath, Promise promise) {
        try {
            Log.d(TAG, "📱 Opening React Native alarm screen for alarm: " + alarmId);
            
            // Send event to React Native to navigate to alarm screen
            com.facebook.react.bridge.WritableMap params = com.facebook.react.bridge.Arguments.createMap();
            params.putString("alarmId", alarmId);
            params.putString("alarmTime", alarmTime);
            params.putString("audioPath", audioPath);
            
            getReactApplicationContext()
                .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("openAlarmScreen", params);
            
            promise.resolve("Alarm screen navigation sent");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to open alarm screen", e);
            promise.reject("OPEN_ALARM_SCREEN_FAILED", e.getMessage());
        }
    }
}

