# 🚀 Professional Android Setup Guide

This guide will help you set up and run the LFG Alarm App on Android with all the necessary configurations.

## 📋 Prerequisites

- **Android Studio** (latest version)
- **Android SDK** (API level 21+)
- **Java Development Kit (JDK)** 11 or higher
- **Node.js** 16+ and npm
- **Expo CLI** (`npm install -g @expo/cli`)

## 🔧 Project Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── assets/audio/
│   │   │   └── lfg_default.mp3          # LFG audio asset
│   │   ├── java/com/shakshamkarki/practice/
│   │   │   ├── MainApplication.kt        # Main app class
│   │   │   ├── MainActivity.kt           # Main activity
│   │   │   ├── NativeAlarmModule.java    # React Native bridge
│   │   │   ├── NativeAlarmPackage.java   # Package registration
│   │   │   ├── AlarmReceiver.java        # Alarm broadcast receiver
│   │   │   ├── AlarmAudioService.java    # Foreground service
│   │   │   ├── AlarmActivity.java        # Alarm UI activity
│   │   │   ├── AlarmActionReceiver.java  # Action receiver
│   │   │   ├── AlarmScheduler.java       # Alarm scheduling
│   │   │   └── BatteryOptimizationHelper.java # Battery optimization
│   │   └── AndroidManifest.xml            # App manifest
│   └── build.gradle                       # App build config
└── build.gradle                          # Project build config
```

## 🛠️ Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Verify Android Setup

Run the automated build script:

```bash
./scripts/build-android.sh
```

This script will:
- ✅ Clean previous builds
- ✅ Verify LFG audio asset placement
- ✅ Check AndroidManifest.xml configuration
- ✅ Verify native module registration
- ✅ Build the debug APK

### 3. Manual Verification (if needed)

#### Check AndroidManifest.xml
Ensure these permissions are present:
```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.USE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
```

#### Check Service Declarations
Ensure these services are declared:
```xml
<service
    android:name=".AlarmAudioService"
    android:enabled="true"
    android:exported="true"
    android:foregroundServiceType="mediaPlayback"/>

<receiver
    android:name=".AlarmReceiver"
    android:enabled="true"
    android:exported="false"/>

<receiver
    android:name=".AlarmActionReceiver"
    android:enabled="true"
    android:exported="false"/>
```

#### Check MainApplication.kt
Ensure NativeAlarmPackage is registered:
```kotlin
override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages
    packages.add(NativeAlarmPackage()) // Add our native alarm module
    return packages
}
```

## 🚀 Building and Running

### Option 1: Using Expo CLI (Recommended)
```bash
npx expo run:android
```

### Option 2: Using Android Studio
1. Open `android/` folder in Android Studio
2. Wait for Gradle sync to complete
3. Click "Run" button or press Shift+F10

### Option 3: Using Command Line
```bash
cd android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 🧪 Testing

### Run the Test Suite
```javascript
import { runAndroidTestSuite, showTestResults } from './src/utils/androidTestSuite';

// In your app component
const testResults = await runAndroidTestSuite();
showTestResults(testResults);
```

### Manual Testing Steps
1. **Grant Permissions**: Go to Settings → Apps → Practice → Permissions
   - Grant all requested permissions
   - Enable "Alarms & reminders" special access
   - Disable battery optimization

2. **Test LFG Audio**: 
   - Create an alarm with "LFG Audio" selected
   - Verify it plays the correct audio

3. **Test Recorded Audio**:
   - Record a custom audio
   - Create an alarm with the recorded audio
   - Verify it plays the custom audio

4. **Test Alarm Functionality**:
   - Set an alarm for 30 seconds from now
   - Lock the device
   - Wait for the alarm to trigger
   - Verify audio plays and UI appears

## 🔍 Debugging

### View Logs
```bash
# Filter for alarm-related logs
adb logcat | grep -E "(AlarmReceiver|AlarmAudioService|NativeAlarmModule)"

# View all app logs
adb logcat | grep "com.shakshamkarki.practice"
```

### Common Issues and Solutions

#### Issue: "fromModule" undefined error
**Solution**: Already fixed in AudioService.js with robust fallback methods

#### Issue: Alarm doesn't play audio
**Solution**: 
1. Check if LFG audio asset exists in `android/app/src/main/assets/audio/`
2. Verify permissions are granted
3. Check battery optimization settings

#### Issue: Alarm doesn't trigger when app is closed
**Solution**:
1. Grant "Alarms & reminders" special access
2. Disable battery optimization
3. Enable "Allow background activity"

#### Issue: Native module not found
**Solution**:
1. Verify MainApplication.kt includes NativeAlarmPackage
2. Clean and rebuild: `cd android && ./gradlew clean && ./gradlew assembleDebug`

## 📱 Permissions Required

| Permission | Purpose |
|------------|---------|
| `SCHEDULE_EXACT_ALARM` | Schedule precise alarms |
| `USE_EXACT_ALARM` | Use exact alarm functionality |
| `FOREGROUND_SERVICE` | Run foreground service for alarms |
| `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Play audio in foreground service |
| `POST_NOTIFICATIONS` | Show alarm notifications |
| `WAKE_LOCK` | Keep device awake during alarms |
| `VIBRATE` | Vibrate during alarms |
| `RECORD_AUDIO` | Record custom alarm sounds |
| `MODIFY_AUDIO_SETTINGS` | Control audio settings |
| `SYSTEM_ALERT_WINDOW` | Show alarm UI over lock screen |

## 🎯 Key Features

- ✅ **LFG Default Audio**: Plays custom LFG audio from assets
- ✅ **Custom Recorded Audio**: Supports user-recorded alarm sounds
- ✅ **Foreground Service**: Continues playing even when app is closed
- ✅ **Lock Screen UI**: Shows alarm interface over lock screen
- ✅ **Battery Optimization**: Handles battery optimization exemptions
- ✅ **Exact Alarms**: Uses precise alarm scheduling
- ✅ **Background Persistence**: Works when app is terminated

## 🚨 Troubleshooting

### Build Errors
```bash
# Clean everything
rm -rf node_modules
rm -rf android/app/build
rm -rf android/build
npm install
cd android && ./gradlew clean && cd ..
```

### Runtime Errors
1. Check device logs: `adb logcat`
2. Verify permissions in Settings
3. Test with immediate alarm: Use the test suite
4. Check if audio files exist in assets

### Performance Issues
1. Disable battery optimization
2. Grant "Allow background activity"
3. Enable "Alarms & reminders" special access
4. Check if device has enough storage

## 📞 Support

If you encounter issues:
1. Run the test suite first
2. Check the logs using `adb logcat`
3. Verify all permissions are granted
4. Ensure battery optimization is disabled

The app is designed to be professional and reliable. All major issues have been addressed and the codebase is production-ready.