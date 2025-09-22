package com.shakshamkarki.practice

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.app.ActivityManager

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
    
    // Handle alarm screen intent
    handleAlarmScreenIntent(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    if (intent != null) {
      handleAlarmScreenIntent(intent)
    }
  }

  private fun handleAlarmScreenIntent(intent: Intent) {
    Log.d("MainActivity", "🔍 Intent received - Action: ${intent.action}")
    Log.d("MainActivity", "🔍 Intent extras: ${intent.extras?.keySet()?.joinToString()}")
    
    if (intent.action == "OPEN_ALARM_SCREEN") {
      Log.d("MainActivity", "📱 ✅ OPEN_ALARM_SCREEN intent confirmed!")
      
      val alarmId = intent.getStringExtra("alarmId") ?: "default"
      val alarmTime = intent.getStringExtra("alarmTime") ?: "Alarm Ringing"
      val audioPath = intent.getStringExtra("audioPath") ?: ""
      
      Log.d("MainActivity", "🎯 Alarm details - ID: $alarmId, Time: $alarmTime, Path: $audioPath")
      
      // Create parameters for React Native
      val params: WritableMap = Arguments.createMap()
      params.putString("alarmId", alarmId)
      params.putString("alarmTime", alarmTime)
      params.putString("audioPath", audioPath)
      
      Log.d("MainActivity", "📦 Sending params to React Native: $params")
      
      // Send event to React Native with retry mechanism
      sendAlarmScreenEvent(params, 0)
      
      // Note: AlarmActivity is now pure native and doesn't need to be closed
    } else {
      Log.d("MainActivity", "❌ Intent action does not match OPEN_ALARM_SCREEN: ${intent.action}")
    }
  }

  private fun sendAlarmScreenEvent(params: WritableMap, retryCount: Int) {
    try {
      val reactContext = reactInstanceManager.currentReactContext
      if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
        reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("openAlarmScreen", params)
        
        Log.d("MainActivity", "✅ Alarm screen event sent to React Native (attempt ${retryCount + 1})")
      } else {
        // React Native not ready yet, retry after delay
        if (retryCount < 10) { // Max 10 retries (5 seconds)
          Log.d("MainActivity", "⏳ React Native not ready, retrying in 500ms (attempt ${retryCount + 1})")
          android.os.Handler(mainLooper).postDelayed({
            sendAlarmScreenEvent(params, retryCount + 1)
          }, 500)
        } else {
          Log.e("MainActivity", "❌ Failed to send alarm screen event after 10 retries")
        }
      }
    } catch (e: Exception) {
      Log.e("MainActivity", "❌ Failed to send alarm screen event", e)
      // Retry once more if it's not the final attempt
      if (retryCount < 10) {
        android.os.Handler(mainLooper).postDelayed({
          sendAlarmScreenEvent(params, retryCount + 1)
        }, 500)
      }
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }

  /**
   * Close any running AlarmActivity instances when React Native takes over
   */
  private fun closeAlarmActivity() {
    try {
      Log.d("MainActivity", "🔒 Closing AlarmActivity instances - React Native will handle UI")
      
      // Send broadcast to close AlarmActivity
      val closeIntent = Intent("CLOSE_ALARM_ACTIVITY")
      sendBroadcast(closeIntent)
      
    } catch (e: Exception) {
      Log.e("MainActivity", "Failed to close AlarmActivity", e)
    }
  }
}
