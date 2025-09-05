package com.shakshamkarki.practice;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import androidx.annotation.RequiresApi;

/**
 * Helper class to manage battery optimization settings for unlimited alarm access
 */
public class BatteryOptimizationHelper {
    private static final String TAG = "BatteryOptimizationHelper";

    /**
     * Check if the app is whitelisted from battery optimization
     */
    @RequiresApi(api = Build.VERSION_CODES.M)
    public static boolean isIgnoringBatteryOptimizations(Context context) {
        try {
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            String packageName = context.getPackageName();
            boolean isIgnoring = powerManager.isIgnoringBatteryOptimizations(packageName);
            Log.d(TAG, "Battery optimization ignored: " + isIgnoring + " for package: " + packageName);
            return isIgnoring;
        } catch (Exception e) {
            Log.e(TAG, "Error checking battery optimization status", e);
            return false;
        }
    }

    /**
     * Request to ignore battery optimizations for unlimited alarm access
     */
    @RequiresApi(api = Build.VERSION_CODES.M)
    public static Intent createBatteryOptimizationIntent(Context context) {
        try {
            String packageName = context.getPackageName();
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(android.net.Uri.parse("package:" + packageName));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            Log.d(TAG, "🔋 Creating battery optimization exemption intent for unlimited alarm access");
            return intent;
        } catch (Exception e) {
            Log.e(TAG, "Error creating battery optimization intent", e);
            return null;
        }
    }

    /**
     * Log current battery optimization status and provide guidance
     */
    public static void logBatteryOptimizationStatus(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean isIgnoring = isIgnoringBatteryOptimizations(context);
            Log.d(TAG, "🔋🔋🔋 BATTERY OPTIMIZATION STATUS 🔋🔋🔋");
            Log.d(TAG, "App ignoring battery optimization: " + isIgnoring);
            
            if (isIgnoring) {
                Log.d(TAG, "✅ UNLIMITED ALARM ACCESS GRANTED - Battery optimization disabled");
                Log.d(TAG, "🚨 Alarms will play INDEFINITELY until manually stopped");
            } else {
                Log.w(TAG, "⚠️ Battery optimization ENABLED - May limit alarm persistence");
                Log.w(TAG, "📱 User should disable battery optimization for unlimited alarm access");
            }
        } else {
            Log.d(TAG, "🔋 Battery optimization not applicable (Android < 6.0)");
            Log.d(TAG, "✅ UNLIMITED ALARM ACCESS available by default");
        }
    }

    /**
     * Request all necessary permissions for unlimited alarm access
     */
    public static void ensureUnlimitedAlarmAccess(Context context) {
        Log.d(TAG, "🔓🔓🔓 ENSURING UNLIMITED ALARM ACCESS 🔓🔓🔓");
        
        // Log current status
        logBatteryOptimizationStatus(context);
        
        // Check if we need to request battery optimization exemption
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!isIgnoringBatteryOptimizations(context)) {
                Log.w(TAG, "🔋 Battery optimization detected - alarm may be limited");
                Log.w(TAG, "💡 To enable unlimited alarm access:");
                Log.w(TAG, "   1. Go to Settings > Battery > Battery Optimization");
                Log.w(TAG, "   2. Find this app and set to 'Don't optimize'");
                Log.w(TAG, "   3. This ensures alarms play indefinitely");
            }
        }
        
        Log.d(TAG, "✅ Unlimited alarm access configuration complete");
    }
}
