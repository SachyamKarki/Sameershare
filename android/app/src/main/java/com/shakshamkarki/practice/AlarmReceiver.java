package com.shakshamkarki.practice;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.os.Build;
import android.util.Log;
// Removed all notification imports - AlarmAudioService handles all notifications

import java.io.File;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";
    // Removed notification constants - AlarmAudioService handles all notifications
    private static MediaPlayer mediaPlayer;
    private static Vibrator vibrator;

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "🚨🚨🚨 NATIVE ALARM FIRED - INDEPENDENT OF APP STATE 🚨🚨🚨");
        
        String audioPath = intent.getStringExtra("audioPath");
        String alarmId = intent.getStringExtra("alarmId");
        String alarmTime = intent.getStringExtra("alarmTime");
        
        Log.d(TAG, "📱 App State: IRRELEVANT - This is native Android alarm");
        Log.d(TAG, "🎵 Audio path received: " + audioPath);
        Log.d(TAG, "🆔 Alarm ID: " + alarmId);
        Log.d(TAG, "⏰ Alarm Time: " + alarmTime);
        
        // PROFESSIONAL FIX: Immediately cancel any system alarm notifications
        cancelSystemAlarmNotifications(context);
        
        // CRITICAL: Stop any existing alarm first
        stopAlarmAudio();
        
        // START FOREGROUND SERVICE FOR PERSISTENT AUDIO
        Log.d(TAG, "🚀 Starting FOREGROUND SERVICE for persistent alarm audio");
        Intent serviceIntent = new Intent(context, AlarmAudioService.class);
        serviceIntent.setAction(AlarmAudioService.ACTION_START_ALARM);
        serviceIntent.putExtra(AlarmAudioService.EXTRA_AUDIO_PATH, audioPath);
        serviceIntent.putExtra(AlarmAudioService.EXTRA_ALARM_ID, alarmId);
        
        // Start as foreground service - this will persist even if app is killed
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
                Log.d(TAG, "✅ Foreground service start requested");
            } else {
                context.startService(serviceIntent);
                Log.d(TAG, "✅ Background service started");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "❌ SECURITY: Cannot start foreground service - app may be background restricted", e);
            // Just log the error - let the simple notification approach handle this
        } catch (IllegalStateException e) {
            Log.e(TAG, "❌ STATE: Cannot start foreground service - system restrictions", e);
            // Just log the error - let the simple notification approach handle this
        } catch (Exception e) {
            Log.e(TAG, "❌ CRITICAL: Service startup failed", e);
            // Just log the error - let the simple notification approach handle this
        }
        
        // Let AlarmAudioService handle notification without system sound to avoid overlap
        Log.d(TAG, "✅ Single notification system - AlarmAudioService will handle UI");
        
        // Launch full-screen alarm UI over lock screen (no tap needed)
        try {
            Intent activityIntent = new Intent(context, AlarmActivity.class);
            activityIntent.setAction("OPEN_ALARM_SCREEN");
            activityIntent.putExtra("alarmId", alarmId != null ? alarmId : "default");
            activityIntent.putExtra("alarmTime", alarmTime != null ? alarmTime : "Alarm Ringing");
            activityIntent.putExtra("audioPath", audioPath != null ? audioPath : "");
            activityIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
            );
            context.startActivity(activityIntent);
            Log.d(TAG, "✅ Full-screen AlarmActivity started over lock screen");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start AlarmActivity", e);
        }

        Log.d(TAG, "✅✅✅ ALARM RECEIVER: Service started + UI launched ✅✅✅");
    }

    // NOTIFICATION CHANNEL REMOVED - AlarmAudioService handles all notifications

    private void startAlarmAudio(Context context, String audioPath) {
        try {
            Log.d(TAG, "🔊🔊🔊 STARTING NATIVE ALARM AUDIO - INDEPENDENT SYSTEM 🔊🔊🔊");
            
            // Stop any existing alarm
            stopAlarmAudio();
            
            // FORCE MAXIMUM ALARM VOLUME - CRITICAL
            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, AudioManager.FLAG_SHOW_UI);
                audioManager.setSpeakerphoneOn(true);
                Log.d(TAG, "🔊 MAXIMUM alarm volume set: " + maxVolume);
            }

            mediaPlayer = new MediaPlayer();
            
            // Configure audio attributes for ALARM - HIGHEST PRIORITY
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                .build();
            
            mediaPlayer.setAudioAttributes(audioAttributes);
            
            // STREAMLINED FIX: Handle audio with proper URI resolution
            try {
                if (audioPath != null && !audioPath.isEmpty() && !"default_alarm_sound".equals(audioPath)) {
                    Log.d(TAG, "🎵 Loading custom audio: " + audioPath);
                    loadCustomAudio(context, audioPath);
                } else {
                    Log.d(TAG, "🎵 Loading LFG default audio from assets");
                    loadFallbackAudio(context);
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to load custom audio, using fallback", e);
                try {
                    loadFallbackAudio(context);
                } catch (Exception fallbackError) {
                    Log.e(TAG, "❌ Fallback audio also failed", fallbackError);
                    return; // Exit without setting any audio source
                }
            }
            
            // Configure playback - LOOP UNTIL STOPPED
            mediaPlayer.setLooping(true);
            mediaPlayer.setVolume(1.0f, 1.0f);
            
            mediaPlayer.setOnPreparedListener(mp -> {
                Log.d(TAG, "🎵 ALARM AUDIO PREPARED - STARTING PLAYBACK NOW");
                mp.start();
                Log.d(TAG, "✅✅✅ NATIVE ALARM AUDIO IS PLAYING INDEPENDENTLY ✅✅✅");
            });
            
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "🚨 MediaPlayer error: " + what + ", " + extra + " - NO SYSTEM DEFAULT RECOVERY");
                try {
                    Log.d(TAG, "🔄 Auto-recovery: Trying LFG default audio (NO SYSTEM DEFAULT)");
                    mp.reset();
                    boolean lfgLoaded = loadLFGAudioFromAssets(context);
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
                return true;
            });
            
            Log.d(TAG, "🎯 Preparing native alarm audio for playback...");
            mediaPlayer.prepareAsync();
            
        } catch (Exception e) {
            Log.e(TAG, "🚨 CRITICAL: Failed to start native alarm audio", e);
            // Emergency fallback - try LFG audio only (NO SYSTEM DEFAULT)
            try {
                Log.d(TAG, "🔄 Emergency recovery: Trying LFG audio only");
                if (mediaPlayer != null) {
                    mediaPlayer.reset();
                    boolean lfgLoaded = loadLFGAudioFromAssets(context);
                    if (lfgLoaded) {
                        mediaPlayer.prepareAsync();
                        Log.d(TAG, "✅ Emergency recovery successful with LFG audio");
                    } else {
                        Log.w(TAG, "⚠️ Emergency LFG recovery failed - alarm will be silent to prevent system default");
                        // Do not call setDefaultAlarmSound() - this prevents system audio overlap
                    }
                }
            } catch (Exception fallbackError) {
                Log.e(TAG, "🚨 EMERGENCY: LFG recovery failed - alarm will be silent", fallbackError);
            }
        }
    }

    private boolean loadLFGAudioFromAssets(Context context) {
        try {
            Log.d(TAG, "🎵 Loading LFG audio from assets...");
            android.content.res.AssetFileDescriptor afd = context.getAssets().openFd("audio/lfg_default.mp3");
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
    private void loadCustomAudio(Context context, String audioPath) throws Exception {
        Log.d(TAG, "🎵 Loading custom audio: " + audioPath);
        
        if (audioPath.startsWith("content://")) {
            // Handle content URIs (from MediaStore, SAF, React Native)
            Log.d(TAG, "📱 Handling content:// URI");
            android.net.Uri uri = android.net.Uri.parse(audioPath);
            android.content.ContentResolver resolver = context.getContentResolver();
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

    /**
     * STREAMLINED FIX: Load fallback audio from assets
     */
    private void loadFallbackAudio(Context context) throws Exception {
        Log.d(TAG, "🎵 Loading LFG fallback audio from assets");
        android.content.res.AssetFileDescriptor afd = context.getAssets().openFd("audio/lfg_default.mp3");
        if (afd != null) {
            mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            Log.d(TAG, "✅ Loaded fallback audio from assets");
        } else {
            throw new Exception("Could not open LFG audio asset");
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

    private void setDefaultAlarmSound(Context context) {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.reset();
                Uri defaultAlarm = android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI;
                if (defaultAlarm != null) {
                    mediaPlayer.setDataSource(context, defaultAlarm);
                } else {
                    mediaPlayer.setDataSource(context, android.provider.Settings.System.DEFAULT_NOTIFICATION_URI);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to set default alarm sound", e);
        }
    }

    private void startVibration(Context context) {
        try {
            vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 500, 200, 500, 200, 500};
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    VibrationEffect effect = VibrationEffect.createWaveform(pattern, 0);
                    vibrator.vibrate(effect);
                } else {
                    vibrator.vibrate(pattern, 0);
                }
                
                Log.d(TAG, "✅ Vibration started");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start vibration", e);
        }
    }

    // Emergency notification methods removed - single notification strategy

    /**
     * Convert React Native URI to actual file path for independent access
     */
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

    /**
     * PROFESSIONAL FIX: Cancel any system alarm notifications that might be playing default sound
     */
    private void cancelSystemAlarmNotifications(Context context) {
        try {
            Log.d(TAG, "🔇 PROFESSIONAL: Canceling any system alarm notifications...");
            
            android.app.NotificationManager notificationManager = 
                (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            
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

    public static void stopAlarmAudio() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
                Log.d(TAG, "✅ Alarm audio stopped");
            }
            
            if (vibrator != null) {
                vibrator.cancel();
                vibrator = null;
                Log.d(TAG, "✅ Vibration stopped");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping alarm", e);
        }
    }
}

