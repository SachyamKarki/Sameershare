package com.shakshamkarki.practice;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

/**
 * Helper class to handle battery optimization exemptions and OEM-specific restrictions
 */
public class BatteryOptimizationHelper {
    private static final String TAG = "BatteryOptimizationHelper";

    /**
     * Check if the app is whitelisted from battery optimizations
     */
    public static boolean isIgnoringBatteryOptimizations(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                return powerManager.isIgnoringBatteryOptimizations(context.getPackageName());
            }
        }
        return true; // Assume true for older versions
    }

    /**
     * Request battery optimization exemption
     */
    public static Intent createBatteryOptimizationIntent(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            return intent;
        }
        return null;
    }

    /**
     * Detect OEM and return specific instructions
     */
    public static String getOEMSpecificInstructions() {
        String manufacturer = Build.MANUFACTURER.toLowerCase();
        String model = Build.MODEL.toLowerCase();
        
        Log.d(TAG, "Detected device: " + manufacturer + " " + model);
        
        switch (manufacturer) {
            case "xiaomi":
                return "Xiaomi Device Detected:\n" +
                       "1. Go to Settings → Apps → Practice → Battery saver → No restrictions\n" +
                       "2. Settings → Apps → Practice → Other permissions → Display pop-up windows while running in background → Allow\n" +
                       "3. Settings → Apps → Practice → Autostart → Enable";
                       
            case "huawei":
            case "honor":
                return "Huawei/Honor Device Detected:\n" +
                       "1. Go to Settings → Apps → Practice → Battery → App launch → Manage manually\n" +
                       "2. Enable: Auto-launch, Secondary launch, Run in background\n" +
                       "3. Settings → Battery → More battery settings → Sleep mode → Don't close apps";
                       
            case "oppo":
            case "oneplus":
                return "Oppo/OnePlus Device Detected:\n" +
                       "1. Go to Settings → Apps → Practice → Battery → Battery optimization → Don't optimize\n" +
                       "2. Settings → Apps → Practice → App permissions → Allow all permissions\n" +
                       "3. Settings → Battery → Battery optimization → Practice → Don't optimize";
                       
            case "vivo":
                return "Vivo Device Detected:\n" +
                       "1. Go to Settings → Apps & permissions → Practice → Battery → High background app consumption → Allow\n" +
                       "2. Settings → Apps & permissions → Practice → Auto-start → Enable\n" +
                       "3. Settings → Battery → Background app refresh → Practice → Allow";
                       
            case "samsung":
                return "Samsung Device Detected:\n" +
                       "1. Go to Settings → Apps → Practice → Battery → Optimize battery usage → Turn off\n" +
                       "2. Settings → Device care → Battery → App power management → Apps that won't be put to sleep → Add Practice\n" +
                       "3. Settings → Apps → Practice → Permissions → Allow all permissions";
                       
            default:
                return "For reliable alarms:\n" +
                       "1. Go to Settings → Apps → Practice → Battery → Don't optimize\n" +
                       "2. Allow all permissions for the app\n" +
                       "3. Disable any battery saving features for this app";
        }
    }

    /**
     * Get intent to open app-specific battery settings
     */
    public static Intent getAppBatterySettingsIntent(Context context) {
        Intent intent = new Intent();
        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.fromParts("package", context.getPackageName(), null));
        return intent;
    }

    /**
     * Ensure unlimited alarm access for the app
     */
    public static void ensureUnlimitedAlarmAccess(Context context) {
        try {
            Log.d(TAG, "🔓 Checking alarm access permissions...");
            
            // Check battery optimization status
            boolean isOptimized = isIgnoringBatteryOptimizations(context);
            Log.d(TAG, "📱 Battery optimization status: " + (isOptimized ? "WHITELISTED" : "RESTRICTED"));
            
            if (!isOptimized) {
                Log.w(TAG, "⚠️ App is NOT whitelisted from battery optimizations");
                Log.w(TAG, "🔧 Recommend showing battery optimization prompt to user");
            }
            
            // Log OEM-specific instructions
            String oemInstructions = getOEMSpecificInstructions();
            Log.d(TAG, "📋 OEM Instructions: " + oemInstructions);
            
            Log.d(TAG, "✅ Alarm access check completed");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to check alarm access", e);
        }
    }

    /**
     * Check if exact alarm scheduling is allowed (Android 12+)
     */
    public static boolean canScheduleExactAlarms(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            android.app.AlarmManager alarmManager = (android.app.AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            return alarmManager != null && alarmManager.canScheduleExactAlarms();
        }
        return true; // Always true for older versions
    }

    /**
     * Get intent to request exact alarm permission (Android 12+)
     */
    public static Intent getExactAlarmPermissionIntent(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            return intent;
        }
        return null;
    }
}
