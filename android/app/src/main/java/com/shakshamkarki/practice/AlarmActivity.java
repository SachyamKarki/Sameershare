package com.shakshamkarki.practice;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.LinearInterpolator;

public class AlarmActivity extends Activity {
    private static final String TAG = "AlarmActivity";

    public static final String EXTRA_ALARM_ID = "alarm_id";
    public static final String EXTRA_ALARM_TIME = "alarm_time";
    public static final String EXTRA_AUDIO_PATH = "audio_path";

    private static final int SNOOZE_MINUTES = 5;
    private static final float LABEL_TEXT_SIZE = 24f;

    private String alarmId;
    private String alarmTime;
    private String audioPath;

    private ImageView alarmIcon;
    private ImageView alarmGlow;
    private TextView alarmLabel;
    private Button stopButton;
    private Button snoozeButton;

    private ObjectAnimator iconShakeAnimator;
    private ObjectAnimator iconScaleAnimator;
    private ObjectAnimator glowPulseScaleXAnimator;
    private ObjectAnimator glowPulseScaleYAnimator;
    private ObjectAnimator glowAlphaAnimator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "AlarmActivity created");

        extractIntentData();
        setupWindowFlags();
        setContentView(R.layout.activity_alarm);
        initializeUI();

        Log.d(TAG, "AlarmActivity initialized");
    }

    private void extractIntentData() {
        Intent intent = getIntent();
        alarmId = intent.getStringExtra(EXTRA_ALARM_ID);
        alarmTime = intent.getStringExtra(EXTRA_ALARM_TIME);
        // Prefer our constant, but also accept the generic key from Receiver/Service
        audioPath = intent.getStringExtra(EXTRA_AUDIO_PATH);
        if (audioPath == null || audioPath.isEmpty()) {
            audioPath = intent.getStringExtra("audioPath");
        }

        Log.d(TAG, "🎯 AlarmActivity opened with:");
        Log.d(TAG, "   Alarm ID: " + alarmId);
        Log.d(TAG, "   Alarm Time: " + alarmTime);
        Log.d(TAG, "   Audio Path: " + audioPath);
        
        // Ensure audio continues playing when AlarmActivity opens
        ensureAudioContinues();
    }
    
    private void ensureAudioContinues() {
        try {
            Log.d(TAG, "🎵 Ensuring audio continues playing in AlarmActivity...");
            
            // The AlarmAudioService should already be playing audio
            // We just need to make sure it continues and is properly configured
            if (audioPath != null && !audioPath.isEmpty()) {
                Log.d(TAG, "✅ Audio path available: " + audioPath);
                Log.d(TAG, "🎵 Audio should be playing from AlarmAudioService");
            } else {
                Log.w(TAG, "⚠️ No audio path provided to AlarmActivity");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error ensuring audio continues", e);
        }
    }

    private void setupWindowFlags() {
        Window window = getWindow();
        
        // Enhanced flags for maximum lock screen visibility
        window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_FULLSCREEN |
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        );

        // Hide system UI for true full-screen experience
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.getInsetsController().hide(
                android.view.WindowInsets.Type.statusBars() | 
                android.view.WindowInsets.Type.navigationBars()
            );
            window.getInsetsController().setSystemBarsBehavior(
                android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        } else {
            // For older Android versions
            window.getDecorView().setSystemUiVisibility(
                android.view.View.SYSTEM_UI_FLAG_FULLSCREEN |
                android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);

            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) {
                km.requestDismissKeyguard(this, null);
            }
        }
        
        // Set brightness to maximum for alarm visibility
        WindowManager.LayoutParams layoutParams = window.getAttributes();
        layoutParams.screenBrightness = 1.0f; // Maximum brightness
        window.setAttributes(layoutParams);
    }

    private void initializeUI() {
        alarmGlow = findViewById(R.id.alarm_glow);
        alarmIcon = findViewById(R.id.alarm_icon);
        alarmLabel = findViewById(R.id.alarm_label);
        stopButton = findViewById(R.id.stop_button);
        snoozeButton = findViewById(R.id.snooze_button);

        alarmLabel.setText(R.string.alarm_active_text);
        alarmLabel.setTextSize(LABEL_TEXT_SIZE);

        setupButton(stopButton, R.string.stop_alarm, "#FF4444");
        setupButton(snoozeButton, R.string.snooze_alarm, "#FFA500");

        stopButton.setOnClickListener(v -> stopAlarm());
        snoozeButton.setOnClickListener(v -> snoozeAlarm());

        startIconAnimation();
        startGlowPulseAnimation();
    }

    private void setupButton(Button button, int textResId, String colorHex) {
        button.setText(textResId);
        button.setTextSize(18f);
        button.setTextColor(android.graphics.Color.WHITE);
        button.setShadowLayer(5f, 0f, 0f, android.graphics.Color.BLACK);

        int color = android.graphics.Color.parseColor(colorHex);
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(25f);
        drawable.setStroke(3, android.graphics.Color.WHITE);
        button.setBackground(drawable);
    }

    private void stopAlarm() {
        Log.d(TAG, "Stopping alarm");
        Intent serviceIntent = new Intent(this, AlarmAudioService.class);
        serviceIntent.setAction(AlarmAudioService.ACTION_STOP_ALARM);
        startService(serviceIntent);
        finish();
    }

    private void snoozeAlarm() {
        Log.d(TAG, "Snoozing alarm for " + SNOOZE_MINUTES + " minutes");

        // Stop current alarm
        Intent stopIntent = new Intent(this, AlarmAudioService.class);
        stopIntent.setAction(AlarmAudioService.ACTION_STOP_ALARM);
        startService(stopIntent);

        // Schedule snooze via helper
        String snoozeAlarmId = alarmId + "_snooze_" + System.currentTimeMillis();
        AlarmScheduler.scheduleSnooze(
                this,
                snoozeAlarmId,
                audioPath,
                SNOOZE_MINUTES * 60 * 1000L
        );

        finish();
    }

    @Override
    protected void onDestroy() {
        Log.d(TAG, "AlarmActivity destroyed");
        stopAnimations();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        Log.d(TAG, "Back button ignored");
    }

    private void startIconAnimation() {
        if (alarmIcon == null) return;

        // Shake left-right (stronger, more natural)
        iconShakeAnimator = ObjectAnimator.ofFloat(alarmIcon, "translationX", -10f, 10f);
        iconShakeAnimator.setDuration(80);
        iconShakeAnimator.setRepeatMode(ValueAnimator.REVERSE);
        iconShakeAnimator.setRepeatCount(ValueAnimator.INFINITE);
        iconShakeAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        iconShakeAnimator.start();

        // Subtle breathing scale
        iconScaleAnimator = ObjectAnimator.ofFloat(alarmIcon, "scaleX", 0.96f, 1.03f);
        iconScaleAnimator.setDuration(900);
        iconScaleAnimator.setRepeatMode(ValueAnimator.REVERSE);
        iconScaleAnimator.setRepeatCount(ValueAnimator.INFINITE);
        iconScaleAnimator.setInterpolator(new LinearInterpolator());
        iconScaleAnimator.start();

        // Couple Y scale with X to keep ratio
        ObjectAnimator iconScaleY = ObjectAnimator.ofFloat(alarmIcon, "scaleY", 0.96f, 1.03f);
        iconScaleY.setDuration(900);
        iconScaleY.setRepeatMode(ValueAnimator.REVERSE);
        iconScaleY.setRepeatCount(ValueAnimator.INFINITE);
        iconScaleY.setInterpolator(new LinearInterpolator());
        iconScaleY.start();
    }

    private void startGlowPulseAnimation() {
        if (alarmGlow == null) return;

        glowPulseScaleXAnimator = ObjectAnimator.ofFloat(alarmGlow, "scaleX", 0.9f, 1.1f);
        glowPulseScaleXAnimator.setDuration(1400);
        glowPulseScaleXAnimator.setRepeatMode(ValueAnimator.REVERSE);
        glowPulseScaleXAnimator.setRepeatCount(ValueAnimator.INFINITE);
        glowPulseScaleXAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        glowPulseScaleXAnimator.start();

        glowPulseScaleYAnimator = ObjectAnimator.ofFloat(alarmGlow, "scaleY", 0.9f, 1.1f);
        glowPulseScaleYAnimator.setDuration(1400);
        glowPulseScaleYAnimator.setRepeatMode(ValueAnimator.REVERSE);
        glowPulseScaleYAnimator.setRepeatCount(ValueAnimator.INFINITE);
        glowPulseScaleYAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        glowPulseScaleYAnimator.start();

        glowAlphaAnimator = ObjectAnimator.ofFloat(alarmGlow, "alpha", 0.2f, 0.55f);
        glowAlphaAnimator.setDuration(1400);
        glowAlphaAnimator.setRepeatMode(ValueAnimator.REVERSE);
        glowAlphaAnimator.setRepeatCount(ValueAnimator.INFINITE);
        glowAlphaAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        glowAlphaAnimator.start();
    }

    private void stopAnimations() {
        try {
            if (iconShakeAnimator != null) {
                iconShakeAnimator.cancel();
                iconShakeAnimator = null;
            }
            if (iconScaleAnimator != null) {
                iconScaleAnimator.cancel();
                iconScaleAnimator = null;
            }
            if (glowPulseScaleXAnimator != null) {
                glowPulseScaleXAnimator.cancel();
                glowPulseScaleXAnimator = null;
            }
            if (glowPulseScaleYAnimator != null) {
                glowPulseScaleYAnimator.cancel();
                glowPulseScaleYAnimator = null;
            }
            if (glowAlphaAnimator != null) {
                glowAlphaAnimator.cancel();
                glowAlphaAnimator = null;
            }
        } catch (Exception ignored) {}
    }
}
