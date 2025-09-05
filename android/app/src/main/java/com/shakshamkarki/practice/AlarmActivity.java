package com.shakshamkarki.practice;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * NATIVE JAVA ALARM ACTIVITY
 * Shows over lock screen and works independently of React Native
 */
public class AlarmActivity extends Activity {
    private static final String TAG = "AlarmActivity";
    
    public static final String EXTRA_ALARM_ID = "alarm_id";
    public static final String EXTRA_ALARM_TIME = "alarm_time";
    public static final String EXTRA_AUDIO_PATH = "audio_path";
    
    private String alarmId;
    private String alarmTime;
    private String audioPath;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "🚨🚨🚨 NATIVE ALARM ACTIVITY CREATED - JAVA UI 🚨🚨🚨");
        
        // Extract alarm data
        Intent intent = getIntent();
        alarmId = intent.getStringExtra(EXTRA_ALARM_ID);
        alarmTime = intent.getStringExtra(EXTRA_ALARM_TIME);
        audioPath = intent.getStringExtra(EXTRA_AUDIO_PATH);
        
        Log.d(TAG, "Alarm ID: " + alarmId);
        Log.d(TAG, "Alarm Time: " + alarmTime);
        
        // Configure window to show over lock screen
        setupWindowFlags();
        
        // Set the layout
        setContentView(R.layout.activity_alarm);
        
        // Initialize UI
        initializeUI();
        
        Log.d(TAG, "✅ Native alarm activity fully initialized");
    }

    private void setupWindowFlags() {
        // Show over lock screen and wake device
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            Window window = getWindow();
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
            );
        }
    }

    private void initializeUI() {
        // Get UI elements
        TextView timeDisplay = findViewById(R.id.time_display);
        TextView alarmLabel = findViewById(R.id.alarm_label);
        Button stopButton = findViewById(R.id.stop_button);
        Button snoozeButton = findViewById(R.id.snooze_button);
        
        // Set current time
        SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());
        String currentTime = timeFormat.format(new Date());
        timeDisplay.setText(currentTime);
        
        // Set alarm label
        if (alarmTime != null && !alarmTime.isEmpty()) {
            alarmLabel.setText("Alarm: " + alarmTime);
        } else {
            alarmLabel.setText("Alarm Ringing");
        }
        
        // Set button click listeners
        stopButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                stopAlarm();
            }
        });
        
        snoozeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                snoozeAlarm();
            }
        });
        
        Log.d(TAG, "✅ UI initialized with stop/snooze buttons");
    }

    private void stopAlarm() {
        Log.d(TAG, "🛑 STOP button pressed - stopping alarm");
        
        // Stop the foreground service
        Intent serviceIntent = new Intent(this, AlarmAudioService.class);
        serviceIntent.setAction(AlarmAudioService.ACTION_STOP_ALARM);
        startService(serviceIntent);
        
        // Close this activity
        finish();
    }

    private void snoozeAlarm() {
        Log.d(TAG, "😴 SNOOZE button pressed - snoozing for 5 minutes");
        
        // Stop current alarm
        Intent serviceIntent = new Intent(this, AlarmAudioService.class);
        serviceIntent.setAction(AlarmAudioService.ACTION_STOP_ALARM);
        startService(serviceIntent);
        
        // Schedule snooze (5 minutes from now)
        long snoozeTime = System.currentTimeMillis() + (5 * 60 * 1000); // 5 minutes
        String snoozeAlarmId = alarmId + "_snooze_" + System.currentTimeMillis();
        
        try {
            // Use AlarmReceiver to schedule snooze
            Intent snoozeIntent = new Intent(this, AlarmReceiver.class);
            snoozeIntent.putExtra("alarmId", snoozeAlarmId);
            snoozeIntent.putExtra("audioPath", audioPath);
            snoozeIntent.putExtra("alarmTime", "Snooze");
            
            android.app.PendingIntent snoozePendingIntent = android.app.PendingIntent.getBroadcast(
                this, 
                snoozeAlarmId.hashCode(), 
                snoozeIntent, 
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            );
            
            android.app.AlarmManager alarmManager = (android.app.AlarmManager) getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                alarmManager.setExactAndAllowWhileIdle(
                    android.app.AlarmManager.RTC_WAKEUP, 
                    snoozeTime, 
                    snoozePendingIntent
                );
                Log.d(TAG, "✅ Snooze scheduled for 5 minutes");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule snooze", e);
        }
        
        // Close this activity
        finish();
    }

    @Override
    protected void onDestroy() {
        Log.d(TAG, "🗑️ Native alarm activity destroyed");
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        // Prevent closing with back button - user must use stop/snooze
        Log.d(TAG, "Back button pressed - ignoring (use Stop or Snooze)");
    }
}
