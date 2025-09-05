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
        
        // CRITICAL: Stop any existing alarm first
        stopAlarmAudio();
        
        // START FOREGROUND SERVICE FOR PERSISTENT AUDIO
        Log.d(TAG, "🚀 Starting FOREGROUND SERVICE for persistent alarm audio");
        Intent serviceIntent = new Intent(context, AlarmAudioService.class);
        serviceIntent.setAction(AlarmAudioService.ACTION_START_ALARM);
        serviceIntent.putExtra(AlarmAudioService.EXTRA_AUDIO_PATH, audioPath);
        serviceIntent.putExtra(AlarmAudioService.EXTRA_ALARM_ID, alarmId);
        
        // Start as foreground service - this will persist even if app is killed
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
        
        // NO ACTIVITY LAUNCH - AlarmAudioService notification handles this with fullScreenIntent
        // NO NOTIFICATION - AlarmAudioService is the ONLY notification owner
        Log.d(TAG, "✅✅✅ ALARM RECEIVER: Only starts service - AlarmAudioService handles UI/notifications ✅✅✅");
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
            
            // ROBUST audio file handling with detailed logging
            boolean customAudioSet = false;
            if (audioPath != null && !audioPath.isEmpty()) {
                Log.d(TAG, "🎵 Attempting custom audio: '" + audioPath + "'");
                
                try {
                    // Convert React Native URI to proper file path
                    String actualPath = convertToActualPath(audioPath);
                    File audioFile = new File(actualPath);
                    
                    Log.d(TAG, "🔍 Converted path: '" + actualPath + "'");
                    Log.d(TAG, "📁 File exists: " + audioFile.exists());
                    if (audioFile.exists()) {
                        Log.d(TAG, "📏 File size: " + audioFile.length() + " bytes");
                        Log.d(TAG, "📝 File readable: " + audioFile.canRead());
                    }
                    
                    if (audioFile.exists() && audioFile.length() > 0 && audioFile.canRead()) {
                        Log.d(TAG, "✅ Setting custom audio source: " + actualPath);
                        mediaPlayer.setDataSource(actualPath);
                        customAudioSet = true;
                    } else {
                        Log.w(TAG, "❌ Custom audio file invalid or unreadable: " + actualPath);
                    }
                } catch (Exception audioError) {
                    Log.e(TAG, "❌ Error setting custom audio", audioError);
                }
            } else {
                Log.d(TAG, "🔔 No custom audio provided");
            }
            
            // Fallback to default if custom audio failed
            if (!customAudioSet) {
                Log.w(TAG, "🔔 Using default alarm sound as fallback");
                setDefaultAlarmSound(context);
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
                Log.e(TAG, "🚨 MediaPlayer error: " + what + ", " + extra + " - trying default sound");
                try {
                    setDefaultAlarmSound(context);
                    mp.prepareAsync();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to set default sound", e);
                }
                return true;
            });
            
            Log.d(TAG, "🎯 Preparing native alarm audio for playback...");
            mediaPlayer.prepareAsync();
            
        } catch (Exception e) {
            Log.e(TAG, "🚨 CRITICAL: Failed to start native alarm audio", e);
            // Emergency fallback - try default sound
            try {
                setDefaultAlarmSound(context);
                if (mediaPlayer != null) {
                    mediaPlayer.prepareAsync();
                }
            } catch (Exception fallbackError) {
                Log.e(TAG, "🚨 EMERGENCY: Even default sound failed", fallbackError);
            }
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

    private void showAlarmNotification(Context context, String alarmTime, String alarmId, String audioPath) {
        try {
            // Intent to open the app
            // Notification intents removed - AlarmAudioService handles all UI interactions

            // DUPLICATE NOTIFICATION REMOVED: Only AlarmAudioService shows notification
            // This prevents the duplicate notification issue
            Log.d(TAG, "📱 SINGLE NOTIFICATION: AlarmAudioService handles notification - no duplicate");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to show alarm notification", e);
        }
    }

    /**
     * Convert React Native URI to actual file path
     */
    private String convertToActualPath(String reactNativeUri) {
        if (reactNativeUri == null || reactNativeUri.isEmpty()) {
            return reactNativeUri;
        }
        
        // Handle file:// URIs
        if (reactNativeUri.startsWith("file://")) {
            return reactNativeUri.substring(7); // Remove "file://" prefix
        }
        
        // Handle content:// URIs by looking for alternative paths
        if (reactNativeUri.startsWith("content://")) {
            Log.w(TAG, "Content URI detected, may not work with MediaPlayer: " + reactNativeUri);
            return reactNativeUri; // Return as-is, might work in some cases
        }
        
        // Handle app cache/data directory paths
        if (reactNativeUri.contains("/cache/") || reactNativeUri.contains("/data/")) {
            return reactNativeUri; // Already a proper file path
        }
        
        // Log for debugging
        Log.d(TAG, "URI conversion: " + reactNativeUri + " -> " + reactNativeUri);
        return reactNativeUri;
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

