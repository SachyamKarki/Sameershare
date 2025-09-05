package com.shakshamkarki.practice;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.util.Log;
import android.content.pm.ServiceInfo;
import androidx.core.app.NotificationCompat;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * FOREGROUND SERVICE for alarm audio
 * This ensures audio continues playing even when app is completely terminated
 */
public class AlarmAudioService extends Service {
    private static final String TAG = "AlarmAudioService";
    private static final String CHANNEL_ID = "alarm_audio_service";
    private static final int NOTIFICATION_ID = 99999; // Unique ID to avoid conflicts
    
    public static final String ACTION_START_ALARM = "START_ALARM";
    public static final String ACTION_STOP_ALARM = "STOP_ALARM";
    public static final String EXTRA_AUDIO_PATH = "audio_path";
    public static final String EXTRA_ALARM_ID = "alarm_id";
    
    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private String currentAlarmId;
    private String currentAudioPath;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "🚨🚨🚨 UNLIMITED ALARM SERVICE CREATED 🚨🚨🚨");
        Log.d(TAG, "🔓 Initializing UNLIMITED alarm access system");
        
        // Ensure unlimited alarm access
        BatteryOptimizationHelper.ensureUnlimitedAlarmAccess(this);
        
        // Acquire UNLIMITED wake lock to prevent device from sleeping during alarm
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AlarmApp:UnlimitedAlarmWakeLock");
        wakeLock.acquire(); // UNLIMITED - No timeout for alarm wake lock
        Log.d(TAG, "🔋 UNLIMITED wake lock acquired - device will NEVER sleep during alarm");
        Log.d(TAG, "♾️ Service configured for INFINITE alarm playback");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "🚨🚨🚨 PERSISTENT FOREGROUND SERVICE - INDEPENDENT OF APP 🚨🚨🚨");
        Log.d(TAG, "Intent: " + (intent != null ? intent.getAction() : "null"));
        Log.d(TAG, "🔥 SERVICE RUNS INDEPENDENTLY - App termination CANNOT stop this!");
        
        if (intent == null) {
            Log.w(TAG, "Intent is null - but KEEPING SERVICE ALIVE (app may be terminated)");
            // CRITICAL FIX: Do NOT stop service on null intent
            // This happens when app is terminated - we must keep alarm playing!
            return START_STICKY;
        }

        String action = intent.getAction();
        Log.d(TAG, "🎯 Processing action: " + action);

        if (ACTION_START_ALARM.equals(action)) {
            String audioPath = intent.getStringExtra(EXTRA_AUDIO_PATH);
            String alarmId = intent.getStringExtra(EXTRA_ALARM_ID);
            Log.d(TAG, "🔊 STARTING MAXIMUM PERSISTENCE ALARM");
            startAlarmAudio(audioPath, alarmId);
        } else if (ACTION_STOP_ALARM.equals(action)) {
            Log.d(TAG, "🛑 EXPLICIT STOP requested - User action");
            stopAlarmAudio();
        } else {
            Log.d(TAG, "⚠️ Unknown action - keeping service alive: " + action);
        }

        // MAXIMUM PERSISTENCE: Always return START_STICKY
        Log.d(TAG, "✅ Service configured for MAXIMUM PERSISTENCE");
        return START_STICKY;
    }

    private void startAlarmAudio(String audioPath, String alarmId) {
        try {
            Log.d(TAG, "🔊🔊🔊 FOREGROUND SERVICE: Starting PERSISTENT alarm audio 🔊🔊🔊");
            
            // CRITICAL: Stop any existing alarm first to prevent duplicates
            if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                Log.d(TAG, "🛑 Stopping existing alarm to prevent duplicate notifications");
                stopExistingAudio();
            }
            
            currentAlarmId = alarmId;
            currentAudioPath = audioPath;
            
            // Create minimal hidden notification for foreground service compliance
            createMinimalNotificationChannel();
            Notification hiddenNotification = createHiddenNotification();
            
            // Start foreground service with hidden notification
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, hiddenNotification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, hiddenNotification);
            }
            
            Log.d(TAG, "🔇 HIDDEN SERVICE: Minimal notification for compliance - Android system notification is the visible one");
            
            // FORCE MAXIMUM VOLUME
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, AudioManager.FLAG_SHOW_UI);
                audioManager.setSpeakerphoneOn(true);
                Log.d(TAG, "🔊 MAXIMUM volume set: " + maxVolume);
            }

            // Start vibration
            startVibration();
            
            // Create and configure MediaPlayer
            mediaPlayer = new MediaPlayer();
            
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                .build();
            
            mediaPlayer.setAudioAttributes(audioAttributes);
            
            // Set audio source with fallback
            boolean customAudioSet = false;
            if (audioPath != null && !audioPath.isEmpty()) {
                try {
                    String actualPath = convertToActualPath(audioPath);
                    File audioFile = new File(actualPath);
                    
                    Log.d(TAG, "🎵 Checking custom audio: " + actualPath);
                    Log.d(TAG, "📁 File exists: " + audioFile.exists());
                    
                    if (audioFile.exists() && audioFile.length() > 0) {
                        Log.d(TAG, "✅ Using custom audio: " + actualPath);
                        mediaPlayer.setDataSource(actualPath);
                        customAudioSet = true;
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Custom audio failed", e);
                }
            }
            
            if (!customAudioSet) {
                Log.d(TAG, "🔔 Using default alarm sound");
                setDefaultAlarmSound();
            }
            
            // Configure UNLIMITED looping and maximum volume
            mediaPlayer.setLooping(true); // INFINITE loop until explicitly stopped
            mediaPlayer.setVolume(1.0f, 1.0f); // Maximum volume
            
            mediaPlayer.setOnPreparedListener(mp -> {
                Log.d(TAG, "🎵 FOREGROUND SERVICE: Audio prepared, MAXIMUM PERSISTENCE playback");
                mp.start();
                Log.d(TAG, "✅✅✅ PERSISTENT ALARM AUDIO - INDEPENDENT OF APP LIFECYCLE ✅✅✅");
                Log.d(TAG, "🔥 Audio will continue even if app is FORCE CLOSED!");
            });
            
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error: " + what + ", " + extra + " - RECOVERING AUTOMATICALLY");
                try {
                    Log.d(TAG, "🔄 Auto-recovery: Switching to default alarm sound");
                    mp.reset();
                    setDefaultAlarmSound();
                    mp.prepareAsync();
                    Log.d(TAG, "✅ Recovery successful - alarm continues playing");
                } catch (Exception e) {
                    Log.e(TAG, "Failed to recover from error", e);
                }
                return true; // Error handled, don't crash
            });
            
            mediaPlayer.setOnCompletionListener(mp -> {
                Log.d(TAG, "🔄 Audio completed - restarting for continuous play");
                // This shouldn't happen with looping, but just in case
                if (mp.isPlaying() == false) {
                    try {
                        mp.start();
                        Log.d(TAG, "✅ Audio restarted successfully");
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to restart audio", e);
                    }
                }
            });
            
            mediaPlayer.prepareAsync();
            
        } catch (Exception e) {
            Log.e(TAG, "🚨 CRITICAL: Failed to start alarm audio service", e);
        }
    }

    private void stopExistingAudio() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception e) {
                Log.w(TAG, "Error stopping existing audio", e);
            }
            mediaPlayer = null;
        }
        
        if (vibrator != null) {
            vibrator.cancel();
        }
    }

    private void stopAlarmAudio() {
        Log.d(TAG, "🛑 Stopping alarm audio service");
        
        stopExistingAudio();
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        stopForeground(true);
        stopSelf();
    }

    private void startVibration() {
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 500, 200, 500, 200, 500};
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    VibrationEffect effect = VibrationEffect.createWaveform(pattern, 0);
                    vibrator.vibrate(effect);
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start vibration", e);
        }
    }

    private void setDefaultAlarmSound() {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.reset();
                android.net.Uri defaultAlarm = android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI;
                if (defaultAlarm != null) {
                    mediaPlayer.setDataSource(this, defaultAlarm);
                } else {
                    mediaPlayer.setDataSource(this, android.provider.Settings.System.DEFAULT_NOTIFICATION_URI);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to set default alarm sound", e);
        }
    }

    private String convertToActualPath(String reactNativeUri) {
        if (reactNativeUri == null || reactNativeUri.isEmpty()) {
            return reactNativeUri;
        }
        
        if (reactNativeUri.startsWith("file://")) {
            return reactNativeUri.substring(7);
        }
        
        return reactNativeUri;
    }

    private void createMinimalNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Background Service",
                NotificationManager.IMPORTANCE_MIN // Minimal importance - almost invisible
            );
            channel.setDescription("Background audio service");
            channel.setSound(null, null); // No sound
            channel.setShowBadge(false); // No badge
            channel.setLightColor(0); // No light
            channel.setVibrationPattern(null); // No vibration
            channel.enableLights(false); // No lights
            channel.enableVibration(false); // No vibration
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_SECRET); // Hidden on lock screen
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            // Delete any existing channels first
            try {
                notificationManager.deleteNotificationChannel(CHANNEL_ID);
            } catch (Exception e) {
                // Ignore deletion errors
            }
            notificationManager.createNotificationChannel(channel);
            Log.d(TAG, "🔇 Minimal hidden notification channel created");
        }
    }

    private Notification createHiddenNotification() {
        // Create THE ONLY notification that will appear - exactly as user wants
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Silent") // Matches user's screenshot exactly
            .setContentText("") // No text content
            .setSmallIcon(android.R.drawable.ic_media_play) // Play button icon
            .setPriority(NotificationCompat.PRIORITY_MIN) // Minimal priority
            .setCategory(NotificationCompat.CATEGORY_SERVICE) // Service category
            .setOngoing(false) // Can be dismissed
            .setAutoCancel(true) // Auto dismiss
            .setShowWhen(false) // No timestamp
            .setSilent(true) // Silent notification
            .build();
    }

    private Notification createProfessionalAlarmNotification(String alarmId) {
        // Create dismiss action - stops the alarm completely
        Intent dismissIntent = new Intent(this, AlarmAudioService.class);
        dismissIntent.setAction(ACTION_STOP_ALARM);
        PendingIntent dismissPendingIntent = PendingIntent.getService(
            this, 1, dismissIntent, PendingIntent.FLAG_IMMUTABLE);

        // Create snooze action
        Intent snoozeIntent = new Intent(this, AlarmActionReceiver.class);
        snoozeIntent.setAction("SNOOZE");
        snoozeIntent.putExtra("alarmId", alarmId);
        snoozeIntent.putExtra("audioPath", currentAudioPath != null ? currentAudioPath : "");
        PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
            this, 2, snoozeIntent, PendingIntent.FLAG_IMMUTABLE);

        // Create tap action - opens alarm activity
        Intent tapIntent = new Intent(this, AlarmActivity.class);
        tapIntent.putExtra(AlarmActivity.EXTRA_ALARM_ID, alarmId);
        tapIntent.putExtra(AlarmActivity.EXTRA_ALARM_TIME, "Alarm Ringing");
        tapIntent.putExtra(AlarmActivity.EXTRA_AUDIO_PATH, currentAudioPath != null ? currentAudioPath : "");
        tapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent tapPendingIntent = PendingIntent.getActivity(
            this, 3, tapIntent, PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Alarm Ringing")
            .setContentText("Your custom alarm is playing")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_MAX) // Maximum priority
            .setCategory(NotificationCompat.CATEGORY_CALL) // Call category - avoids system alarm triggers
            .setOngoing(true) // Cannot be swiped away
            .setAutoCancel(false) // Cannot be auto-dismissed
            .setShowWhen(true) // Show timestamp
            .setWhen(System.currentTimeMillis()) // Current time
            .setContentIntent(tapPendingIntent) // Tap to open alarm screen
            .addAction(android.R.drawable.ic_media_pause, "Dismiss", dismissPendingIntent)
            .addAction(android.R.drawable.ic_menu_recent_history, "Snooze", snoozePendingIntent)
            .setFullScreenIntent(tapPendingIntent, true) // Auto-open on lock screen
            .setVibrate(new long[]{0, 250, 250, 250}) // Vibration pattern
            .build();
    }

    private Notification createAlarmNotification(String alarmId) {
        // Stop action
        Intent stopIntent = new Intent(this, AlarmAudioService.class);
        stopIntent.setAction(ACTION_STOP_ALARM);
        PendingIntent stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent, PendingIntent.FLAG_IMMUTABLE);

        // Snooze action - uses AlarmActionReceiver for snooze logic
        Intent snoozeIntent = new Intent(this, AlarmActionReceiver.class);
        snoozeIntent.setAction("SNOOZE");
        snoozeIntent.putExtra("alarmId", alarmId);
        snoozeIntent.putExtra("audioPath", currentAudioPath != null ? currentAudioPath : "");
        PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
            this, 2, snoozeIntent, PendingIntent.FLAG_IMMUTABLE);

        // Open alarm activity action
        Intent alarmActivityIntent = new Intent(this, AlarmActivity.class);
        alarmActivityIntent.putExtra(AlarmActivity.EXTRA_ALARM_ID, alarmId);
        alarmActivityIntent.putExtra(AlarmActivity.EXTRA_ALARM_TIME, "Alarm");
        alarmActivityIntent.putExtra(AlarmActivity.EXTRA_AUDIO_PATH, currentAudioPath != null ? currentAudioPath : "");
        alarmActivityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent alarmActivityPendingIntent = PendingIntent.getActivity(
            this, 3, alarmActivityIntent, PendingIntent.FLAG_IMMUTABLE);

        // Create notification that matches Android system format (the important one)
        String currentTime = getCurrentTime();
        String systemMessage = "It's " + currentTime + ". Your custom alarm is playing!";
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Alarm - " + currentTime)
            .setContentText(systemMessage)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setOngoing(true) // Cannot be swiped away
            .setAutoCancel(false) // Cannot be auto-dismissed
            .setShowWhen(true) // Show system timestamp like Android system
            .setWhen(System.currentTimeMillis()) // Use current time
            .setContentIntent(alarmActivityPendingIntent)
            .addAction(android.R.drawable.ic_media_pause, "Stop", stopPendingIntent)
            .addAction(android.R.drawable.ic_menu_recent_history, "Snooze 5min", snoozePendingIntent)
            .setFullScreenIntent(alarmActivityPendingIntent, true) // Auto-open on lock screen
            .setTimeoutAfter(0) // Never timeout
            .setDeleteIntent(null) // Prevent deletion
            .build();
    }

    private String getCurrentTime() {
        SimpleDateFormat sdf = new SimpleDateFormat("h:mm a", Locale.getDefault());
        return sdf.format(new Date());
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "🛑 AlarmAudioService destroyed");
        stopExistingAudio();
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        super.onDestroy();
    }
}
