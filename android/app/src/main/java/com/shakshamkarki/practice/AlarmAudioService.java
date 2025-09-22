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
import android.media.AudioDeviceInfo;
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
    private static final String CHANNEL_ID = "alarm_audio_service_v4"; // Versioned for settings updates
    private static final int NOTIFICATION_ID = 12345; // Single consistent notification ID
    
    public static final String ACTION_START_ALARM = "START_ALARM";
    public static final String ACTION_STOP_ALARM = "STOP_ALARM";
    public static final String ACTION_RENOTIFY = "RENOTIFY";
    public static final String EXTRA_AUDIO_PATH = "audio_path";
    public static final String EXTRA_ALARM_ID = "alarm_id";
    
    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private String currentAlarmId;
    private String currentAudioPath;
    private static volatile boolean sIsAlarmActive = false;

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
        Log.d(TAG, "🚨🚨🚨 SINGLE NOTIFICATION ALARM SERVICE 🚨🚨🚨");
        Log.d(TAG, "Intent: " + (intent != null ? intent.getAction() : "null"));
        
        try {
            if (intent == null) {
                Log.w(TAG, "Intent is null - keeping service alive");
                return START_STICKY;
            }

            String action = intent.getAction();
            Log.d(TAG, "🎯 Processing action: " + action);

            if (ACTION_START_ALARM.equals(action)) {
                String audioPath = intent.getStringExtra(EXTRA_AUDIO_PATH);
                String alarmId = intent.getStringExtra(EXTRA_ALARM_ID);
                Log.d(TAG, "🔊 STARTING SINGLE NOTIFICATION ALARM");
                startAlarmAudio(audioPath, alarmId);
            } else if (ACTION_STOP_ALARM.equals(action)) {
                Log.d(TAG, "🛑 STOP requested - User action");
                stopAlarmAudio();
            } else if (ACTION_RENOTIFY.equals(action)) {
                Log.d(TAG, "🔄 Rebuilding foreground notification after dismiss attempt");
                try {
                    Notification fancyNotification = createFancyAlarmNotification();
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        startForeground(NOTIFICATION_ID, fancyNotification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                    } else {
                        startForeground(NOTIFICATION_ID, fancyNotification);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Failed to re-notify", e);
                }
            } else {
                Log.d(TAG, "⚠️ Unknown action: " + action);
            }

        } catch (Exception e) {
            Log.e(TAG, "❌ Error in onStartCommand", e);
            // Continue anyway - service should stay alive
        }

        // Always return START_STICKY for reliability
        return START_STICKY;
    }

    private void startAlarmAudio(String audioPath, String alarmId) {
        try {
            Log.d(TAG, "🔊🔊🔊 FOREGROUND SERVICE: Starting PERSISTENT alarm audio 🔊🔊🔊");
            Log.d(TAG, "🎯 Alarm ID: " + alarmId);
            Log.d(TAG, "🎵 Audio Path: " + audioPath);
            
            // PROFESSIONAL FIX: Cancel any system alarm notifications first
            cancelSystemAlarmNotifications();
            
            // CRITICAL: Stop any existing alarm first to prevent duplicates
            if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                Log.d(TAG, "🛑 Stopping existing alarm to prevent duplicate notifications");
                stopExistingAudio();
            }
            
            currentAlarmId = alarmId;
            currentAudioPath = audioPath;
            sIsAlarmActive = true;
            
            Log.d(TAG, "✅ Current alarm state set - ID: " + currentAlarmId + ", Audio: " + currentAudioPath);
            
            // Create FANCY alarm notification with controls
            createFancyNotificationChannel();
            Notification fancyNotification = createFancyAlarmNotification();
            
            // Start foreground service with fancy notification
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, fancyNotification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, fancyNotification);
            }
            
            Log.d(TAG, "🎨 FANCY NOTIFICATION: Professional alarm notification with Stop/Snooze controls");
            
            // FORCE MAXIMUM VOLUME and route to built-in speaker (not Bluetooth)
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, AudioManager.FLAG_SHOW_UI);
                try {
                    audioManager.stopBluetoothSco();
                } catch (Exception ignored) {}
                try {
                    audioManager.setBluetoothScoOn(false);
                } catch (Exception ignored) {}
                try {
                    audioManager.setSpeakerphoneOn(true);
                    audioManager.setMode(AudioManager.MODE_NORMAL);
                } catch (Exception ignored) {}
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

            // Prefer built-in speaker output when possible (API 23+)
            try {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                    if (am != null) {
                        AudioDeviceInfo[] devices = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
                        AudioDeviceInfo speaker = null;
                        for (AudioDeviceInfo d : devices) {
                            if (d.getType() == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) {
                                speaker = d;
                                break;
                            }
                        }
                        if (speaker != null) {
                            boolean ok = mediaPlayer.setPreferredDevice(speaker);
                            Log.d(TAG, "📢 Preferred device set to built-in speaker: " + ok);
                        }
                    }
                }
            } catch (Throwable t) {
                Log.w(TAG, "Could not set preferred device", t);
            }
            
            // STREAMLINED FIX: Handle audio with proper URI resolution
            try {
                if (audioPath != null && !audioPath.isEmpty() && !"default_alarm_sound".equals(audioPath)) {
                    Log.d(TAG, "🎵 Loading custom audio: " + audioPath);
                    loadCustomAudio(audioPath);
                } else {
                    Log.d(TAG, "🎵 Loading LFG default audio from assets");
                    loadFallbackAudio();
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to load custom audio, using fallback", e);
                try {
                    loadFallbackAudio();
                } catch (Exception fallbackError) {
                    Log.e(TAG, "❌ Fallback audio also failed", fallbackError);
                    return; // Exit without setting any audio source
                }
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
                Log.e(TAG, "MediaPlayer error: " + what + ", " + extra + " - NO SYSTEM DEFAULT RECOVERY");
                try {
                    Log.d(TAG, "🔄 Auto-recovery: Trying LFG default audio (NO SYSTEM DEFAULT)");
                    mp.reset();
                    boolean lfgLoaded = loadLFGAudioFromAssets();
                    if (lfgLoaded) {
                        mp.prepareAsync();
                        Log.d(TAG, "✅ Recovery successful with LFG audio - no system default");
                    } else {
                        Log.w(TAG, "⚠️ LFG recovery failed - alarm will be silent to prevent system default");
                        // Do not call setDefaultAlarmSound() - this prevents system audio overlap
                    }
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
        sIsAlarmActive = false;
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

    /**
     * STREAMLINED FIX: Load fallback audio from assets
     */
    private void loadFallbackAudio() throws Exception {
        Log.d(TAG, "🎵 Loading LFG fallback audio from assets");
        android.content.res.AssetFileDescriptor afd = getAssets().openFd("audio/lfg_default.mp3");
        if (afd != null) {
            mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            Log.d(TAG, "✅ Loaded fallback audio from assets");
        } else {
            throw new Exception("Could not open LFG audio asset");
        }
    }

    private boolean loadLFGAudioFromAssets() {
        try {
            Log.d(TAG, "🎵 Loading LFG audio from assets...");
            android.content.res.AssetFileDescriptor afd = getAssets().openFd("audio/lfg_default.mp3");
            if (afd != null) {
                mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                afd.close();
                Log.d(TAG, "✅ LFG default audio loaded from assets");
                return true;
            }
        } catch (Exception assetError) {
            Log.w(TAG, "⚠️ LFG audio from assets failed", assetError);
        }
        return false;
    }
    
    /**
     * STREAMLINED FIX: Load custom audio with proper URI handling
     */
    private void loadCustomAudio(String audioPath) throws Exception {
        Log.d(TAG, "🎵 Loading custom audio: " + audioPath);
        
        if (audioPath.startsWith("content://")) {
            // Handle content URIs (from MediaStore, SAF, React Native)
            Log.d(TAG, "📱 Handling content:// URI");
            android.net.Uri uri = android.net.Uri.parse(audioPath);
            android.content.ContentResolver resolver = getContentResolver();
            android.content.res.AssetFileDescriptor afd = resolver.openAssetFileDescriptor(uri, "r");
            
            if (afd != null) {
                mediaPlayer.setDataSource(
                    afd.getFileDescriptor(),
                    afd.getStartOffset(),
                    afd.getLength()
                );
                afd.close();
                Log.d(TAG, "✅ Loaded custom audio from content URI: " + audioPath);
            } else {
                throw new Exception("Content URI could not be opened: " + audioPath);
            }
        } else if (audioPath.startsWith("file://")) {
            // Handle file URIs
            Log.d(TAG, "📁 Handling file:// URI");
            String actualPath = audioPath.replace("file://", "");
            mediaPlayer.setDataSource(actualPath);
            Log.d(TAG, "✅ Loaded custom audio from file URI: " + actualPath);
        } else {
            // Handle raw file paths
            Log.d(TAG, "📂 Handling raw file path");
            mediaPlayer.setDataSource(audioPath);
            Log.d(TAG, "✅ Loaded custom audio from raw path: " + audioPath);
        }
    }

    
    private boolean tryComprehensiveAudioPaths(String audioPath) {
        try {
            Log.d(TAG, "🔄 Trying comprehensive audio paths for independent playback...");
            
            // Extract filename from path
            String filename = "";
            if (audioPath.contains("/")) {
                filename = audioPath.substring(audioPath.lastIndexOf("/") + 1);
            } else {
                filename = audioPath;
            }
            
            // Comprehensive list of possible paths for recorded audio
            String[] alternativePaths = {
                // Original path variations
                audioPath,
                audioPath.replace("file://", ""),
                audioPath.replace("content://", ""),
                
                // App-specific directories
                "/data/data/com.shakshamkarki.practice/cache/" + filename,
                "/data/data/com.shakshamkarki.practice/files/" + filename,
                "/data/data/com.shakshamkarki.practice/cache/recordings/" + filename,
                "/data/data/com.shakshamkarki.practice/files/recordings/" + filename,
                
                // External storage directories
                "/storage/emulated/0/Android/data/com.shakshamkarki.practice/files/" + filename,
                "/storage/emulated/0/Android/data/com.shakshamkarki.practice/cache/" + filename,
                "/storage/emulated/0/Android/data/com.shakshamkarki.practice/files/recordings/" + filename,
                "/storage/emulated/0/Android/data/com.shakshamkarki.practice/cache/recordings/" + filename,
                
                // Common recording directories
                "/storage/emulated/0/Recordings/" + filename,
                "/storage/emulated/0/Music/" + filename,
                "/storage/emulated/0/Download/" + filename,
                
                // Legacy paths
                "/sdcard/Android/data/com.shakshamkarki.practice/files/" + filename,
                "/sdcard/Android/data/com.shakshamkarki.practice/cache/" + filename,
            };
            
            Log.d(TAG, "🔍 Searching for audio file: " + filename);
            
            for (String altPath : alternativePaths) {
                if (altPath != null && !altPath.isEmpty()) {
                    Log.d(TAG, "🔍 Checking path: " + altPath);
                    File altFile = new File(altPath);
                    if (altFile.exists() && altFile.length() > 0 && altFile.canRead()) {
                        Log.d(TAG, "✅ Found audio at independent path: " + altPath);
                        Log.d(TAG, "📏 File size: " + altFile.length() + " bytes");
                        try {
                            mediaPlayer.setDataSource(altPath);
                            Log.d(TAG, "✅ Successfully set audio source from: " + altPath);
                            return true;
                        } catch (Exception setSourceError) {
                            Log.w(TAG, "⚠️ Failed to set source from " + altPath + ", trying next path", setSourceError);
                            // Continue to next path
                        }
                    }
                }
            }
            
            Log.w(TAG, "❌ No independent audio paths found for: " + filename);
            return false;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error trying comprehensive paths", e);
            return false;
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
        
        Log.d(TAG, "🔍 Converting audio path for independent access: " + reactNativeUri);
        
        // Handle file:// URIs
        if (reactNativeUri.startsWith("file://")) {
            String path = reactNativeUri.substring(7);
            Log.d(TAG, "📁 Converted file URI: " + path);
            return path;
        }
        
        // Handle content:// URIs (from document picker)
        if (reactNativeUri.startsWith("content://")) {
            Log.w(TAG, "⚠️ Content URI detected, will try comprehensive path search: " + reactNativeUri);
            return reactNativeUri; // Return as-is, comprehensive search will handle it
        }
        
        // Handle app cache/data directory paths
        if (reactNativeUri.contains("/cache/") || reactNativeUri.contains("/data/")) {
            Log.d(TAG, "📱 App directory path: " + reactNativeUri);
            return reactNativeUri; // Already a proper file path
        }
        
        // Handle external storage paths
        if (reactNativeUri.startsWith("/storage/") || reactNativeUri.startsWith("/sdcard/")) {
            Log.d(TAG, "💾 External storage path: " + reactNativeUri);
            return reactNativeUri;
        }
        
        // Handle relative paths - convert to absolute
        if (!reactNativeUri.startsWith("/")) {
            // Try to make it absolute by adding common prefixes
            String[] prefixes = {
                "/data/data/com.shakshamkarki.practice/cache/",
                "/data/data/com.shakshamkarki.practice/files/",
                "/storage/emulated/0/Android/data/com.shakshamkarki.practice/files/",
                "/storage/emulated/0/Android/data/com.shakshamkarki.practice/cache/"
            };
            
            for (String prefix : prefixes) {
                String fullPath = prefix + reactNativeUri;
                Log.d(TAG, "🔍 Trying absolute path: " + fullPath);
                File testFile = new File(fullPath);
                if (testFile.exists()) {
                    Log.d(TAG, "✅ Found absolute path: " + fullPath);
                    return fullPath;
                }
            }
        }
        
        Log.d(TAG, "🔍 Final converted path: " + reactNativeUri);
        return reactNativeUri;
    }

    private void createFancyNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Create notification channel with sound completely disabled
            // This prevents system default sound from playing alongside custom audio
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "LFG Alarm",
                NotificationManager.IMPORTANCE_MAX // MAXIMUM importance to show when app terminated
            );
            channel.setDescription("LFG Alarm notifications with controls");
            
            // PROFESSIONAL FIX: Completely disable channel sound to prevent system default tone overlapping with custom audio
            channel.setSound(null, null);
            
            // Notification visibility and behavior
            channel.setShowBadge(false); // Disable badge
            channel.setLightColor(android.graphics.Color.RED); // Red notification light
            channel.setVibrationPattern(new long[]{0, 250, 250, 250}); // Vibration pattern
            channel.enableLights(true); // Enable lights
            channel.enableVibration(true); // Enable vibration
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC); // Show on lock screen
            channel.setBypassDnd(true); // Bypass Do Not Disturb for terminated app alarms
            channel.setImportance(NotificationManager.IMPORTANCE_MAX); // Ensure maximum importance
            
            // Ensure notification shows even when app is terminated
            channel.setShowBadge(false);
            channel.enableLights(true);
            channel.enableVibration(true);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            // Clean up any old notifications and channels
            try {
                // Cancel any existing notifications to prevent duplication
                notificationManager.cancel(NOTIFICATION_ID);
                notificationManager.cancel(77777); // Emergency notification ID
                notificationManager.cancel(88888); // Fallback notification ID
                notificationManager.cancel(99999); // Old notification ID
                
                // Delete old channels
                notificationManager.deleteNotificationChannel("alarm_audio_service");
                notificationManager.deleteNotificationChannel("alarm_audio_service_v2");
                notificationManager.deleteNotificationChannel("alarm_audio_service_v3");
                notificationManager.deleteNotificationChannel("alarm_fallback_channel");
                notificationManager.deleteNotificationChannel("alarm_emergency_channel");
                notificationManager.deleteNotificationChannel(CHANNEL_ID);
            } catch (Exception e) {
                // Ignore cleanup errors
            }
            
            // Create the single notification channel
            notificationManager.createNotificationChannel(channel);
            Log.d(TAG, "🎨 Fancy alarm notification channel created");
        }
    }

    private Notification createFancyAlarmNotification() {
        // Create TAP action - opens Java AlarmActivity (independent from React Native)
        Intent tapIntent = new Intent(this, AlarmActivity.class);
        tapIntent.setAction("OPEN_ALARM_SCREEN");
        tapIntent.putExtra("alarmId", currentAlarmId != null ? currentAlarmId : "default");
        tapIntent.putExtra("alarmTime", "Alarm Ringing");
        tapIntent.putExtra("audioPath", currentAudioPath != null ? currentAudioPath : "");
        // Enhanced flags to ensure AlarmActivity opens properly
        tapIntent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK | 
            Intent.FLAG_ACTIVITY_CLEAR_TOP | 
            Intent.FLAG_ACTIVITY_SINGLE_TOP |
            Intent.FLAG_ACTIVITY_CLEAR_TASK |
            Intent.FLAG_ACTIVITY_NO_ANIMATION
        );
        PendingIntent tapPendingIntent = PendingIntent.getActivity(
            this, 3, tapIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        // Create STOP action button
        Intent stopIntent = new Intent(this, AlarmActionReceiver.class);
        stopIntent.setAction("STOP_ALARM");
        stopIntent.putExtra("alarmId", currentAlarmId != null ? currentAlarmId : "default");
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
            this, 4, stopIntent, PendingIntent.FLAG_IMMUTABLE);

        // Create SNOOZE action button
        Intent snoozeIntent = new Intent(this, AlarmActionReceiver.class);
        snoozeIntent.setAction("SNOOZE_ALARM");
        // Create DISMISS ATTEMPT handler (swipe) -> open screen + re-notify
        Intent dismissIntent = new Intent(this, AlarmActionReceiver.class);
        dismissIntent.setAction("ALARM_NOTIFICATION_DISMISSED");
        dismissIntent.putExtra("alarmId", currentAlarmId != null ? currentAlarmId : "default");
        dismissIntent.putExtra("audioPath", currentAudioPath != null ? currentAudioPath : "");
        PendingIntent deletePendingIntent = PendingIntent.getBroadcast(
            this, 6, dismissIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        snoozeIntent.putExtra("alarmId", currentAlarmId != null ? currentAlarmId : "default");
        snoozeIntent.putExtra("audioPath", currentAudioPath != null ? currentAudioPath : "");
        PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
            this, 5, snoozeIntent, PendingIntent.FLAG_IMMUTABLE);

        // Create FANCY notification with app branding and action buttons
        String notificationTitle = "🚨 LFG Alarm Ringing";
        String notificationBody = "Engine's warmed up! Time to hit the road, champ.";
        
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(notificationTitle)
            .setContentText(notificationBody)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm) // Alarm icon
            .setLargeIcon(android.graphics.BitmapFactory.decodeResource(getResources(), android.R.drawable.ic_dialog_info)) // App logo placeholder
            .setPriority(NotificationCompat.PRIORITY_MAX) // MAXIMUM priority for terminated app visibility
            .setCategory(NotificationCompat.CATEGORY_ALARM) // Alarm category
            .setOngoing(true) // Cannot be dismissed by swipe
            .setAutoCancel(false) // Cannot be auto-dismissed - CRITICAL for alarm service
            .setDeleteIntent(deletePendingIntent) // Handle dismissal properly
            .setShowWhen(true) // Show timestamp
            .setWhen(System.currentTimeMillis()) // Current time
            // CRITICAL: Completely disable notification sound; media player handles audio (custom or default)
            .setSound(null)
            .setDefaults(0) // Disable all default notification sounds
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setLocalOnly(false) // Allow system to show notification
            .setBadgeIconType(NotificationCompat.BADGE_ICON_NONE) // Disable badge
            .setNumber(0) // No badge number
            .setContentIntent(tapPendingIntent) // Main notification tap opens alarm screen
            // Heads-up full-screen intent to ensure user has controls and can't miss it
            .setFullScreenIntent(tapPendingIntent, true)
            .setVibrate(new long[]{0, 250, 250, 250}) // Vibration pattern
            .setLights(android.graphics.Color.RED, 1000, 1000) // Red flashing light
            .setStyle(new NotificationCompat.BigTextStyle()
                .bigText(notificationBody))
            // Add action buttons - Stop and Snooze
            .addAction(android.R.drawable.ic_media_pause, "STOP", stopPendingIntent)
            .addAction(android.R.drawable.ic_media_next, "SNOOZE", snoozePendingIntent)
            .build();

        // Ensure the user cannot swipe this notification away
        notification.flags |= Notification.FLAG_NO_CLEAR | Notification.FLAG_ONGOING_EVENT | Notification.FLAG_INSISTENT;
        return notification;
    }

    // REMOVED: createProfessionalAlarmNotification - was creating duplicate notifications

    // REMOVED: createAlarmNotification - was creating the "Alarm - 6:51 PM" duplicate notification
    // REMOVED: getCurrentTime - no longer needed


    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }

    /**
     * PROFESSIONAL FIX: Cancel any system alarm notifications that might be playing default sound
     */
    private void cancelSystemAlarmNotifications() {
        try {
            Log.d(TAG, "🔇 PROFESSIONAL: Canceling any system alarm notifications...");
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            
            if (notificationManager != null) {
                // Cancel common system alarm notification IDs
                int[] systemAlarmIds = {
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, // Common system notification IDs
                    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, // Extended range
                    1000, 1001, 1002, 1003, 1004, 1005, // Higher range
                    -1, -2, -3, -4, -5 // Negative IDs sometimes used by system
                };
                
                for (int id : systemAlarmIds) {
                    try {
                        notificationManager.cancel(id);
                    } catch (Exception e) {
                        // Ignore individual cancellation errors
                    }
                }
                
                // Also try to cancel by tag (some systems use tags)
                String[] systemTags = {
                    "alarm", "Alarm", "ALARM", "system_alarm", "SystemAlarm",
                    "android_alarm", "AndroidAlarm", "default_alarm"
                };
                
                for (String tag : systemTags) {
                    try {
                        notificationManager.cancel(tag, 1);
                        notificationManager.cancel(tag, 2);
                        notificationManager.cancel(tag, 3);
                    } catch (Exception e) {
                        // Ignore individual cancellation errors
                    }
                }
                
                Log.d(TAG, "✅ PROFESSIONAL: System alarm notifications canceled");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error canceling system alarm notifications", e);
        }
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
