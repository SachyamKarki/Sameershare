/**
 * Test utility for native alarms
 */

import NativeAlarmService from '../services/NativeAlarmService';

export const testNativeAlarmFunctionality = async () => {
  console.log('🧪 Testing Native Alarm Functionality...');

  try {
    // 1. Check if native module is available
    const isAvailable = NativeAlarmService.isAvailable();
    console.log('📱 Native alarm module available:', isAvailable);

    if (!isAvailable) {
      console.warn('⚠️ Native alarm module not available on this platform');
      return false;
    }

    // 2. Check permissions
    const hasPermissions = await NativeAlarmService.checkAlarmPermissions();
    console.log('🔐 Alarm permissions granted:', hasPermissions);

    if (!hasPermissions) {
      console.warn('⚠️ Alarm permissions not granted - user needs to enable in system settings');
      return false;
    }

    // 3. Test scheduling a simple alarm (1 minute from now)
    const testDate = new Date();
    testDate.setMinutes(testDate.getMinutes() + 1);

    const testAlarmId = 'test-alarm-' + Date.now();
    const success = await NativeAlarmService.scheduleNativeAlarm({
      alarmId: testAlarmId,
      fireDate: testDate.getTime(),
      audioPath: '', // Use default system alarm sound
      alarmTime: 'Test Alarm',
    });

    console.log('⏰ Test alarm scheduled:', success);

    if (success) {
      console.log('🎉 Native alarm functionality is working!');
      console.log('📅 Test alarm will ring at:', testDate.toLocaleTimeString());
      
      // Clean up test alarm after 30 seconds
      setTimeout(async () => {
        await NativeAlarmService.cancelNativeAlarm(testAlarmId);
        console.log('🧹 Test alarm cleaned up');
      }, 30000);

      return true;
    }

    return false;

  } catch (error) {
    console.error('❌ Native alarm test failed:', error);
    return false;
  }
};

export const logNativeAlarmStatus = async () => {
  console.log('\n📊 NATIVE ALARM STATUS:');
  console.log('========================');
  console.log('Available:', NativeAlarmService.isAvailable());
  
  if (NativeAlarmService.isAvailable()) {
    const hasPermissions = await NativeAlarmService.checkAlarmPermissions();
    console.log('Permissions:', hasPermissions ? '✅ Granted' : '❌ Not granted');
    
    if (!hasPermissions) {
      console.log('\n🔧 TO FIX:');
      console.log('1. Go to Android Settings');
      console.log('2. Apps > Practice (your app)');
      console.log('3. Battery > Unrestricted');
      console.log('4. Special app access > Schedule exact alarms > Allow');
    }
  }
  console.log('========================\n');
};

