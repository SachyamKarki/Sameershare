/**
 * Comprehensive Android Test Suite
 * Tests the complete alarm flow from React Native to Java
 */

import { Platform, Alert } from 'react-native';
import NativeAlarmService from '../services/NativeAlarmService';
import AudioService from '../services/AudioService';

export const runAndroidTestSuite = async () => {
  console.log('🧪 Starting Comprehensive Android Test Suite...');
  console.log('================================================');
  
  const results = {
    platform: Platform.OS,
    tests: [],
    overall: 'PENDING'
  };

  // Test 1: Platform Check
  console.log('\n📱 Test 1: Platform Check');
  console.log('-------------------------');
  if (Platform.OS === 'android') {
    results.tests.push({ name: 'Platform Check', status: 'PASS', details: 'Running on Android' });
    console.log('✅ Platform: Android');
  } else {
    results.tests.push({ name: 'Platform Check', status: 'FAIL', details: 'Not running on Android' });
    console.log('❌ Platform: Not Android');
    return results;
  }

  // Test 2: Native Module Availability
  console.log('\n🔌 Test 2: Native Module Availability');
  console.log('-------------------------------------');
  try {
    const isAvailable = NativeAlarmService.isAvailable();
    if (isAvailable) {
      results.tests.push({ name: 'Native Module', status: 'PASS', details: 'NativeAlarmModule is available' });
      console.log('✅ NativeAlarmModule: Available');
    } else {
      results.tests.push({ name: 'Native Module', status: 'FAIL', details: 'NativeAlarmModule not available' });
      console.log('❌ NativeAlarmModule: Not available');
    }
  } catch (error) {
    results.tests.push({ name: 'Native Module', status: 'ERROR', details: error.message });
    console.log('❌ NativeAlarmModule: Error -', error.message);
  }

  // Test 3: Audio Service Initialization
  console.log('\n🎵 Test 3: Audio Service Initialization');
  console.log('--------------------------------------');
  try {
    const audioService = new AudioService();
    const initResult = await audioService.initialize();
    if (initResult.success) {
      results.tests.push({ name: 'Audio Service', status: 'PASS', details: 'AudioService initialized successfully' });
      console.log('✅ AudioService: Initialized');
    } else {
      results.tests.push({ name: 'Audio Service', status: 'FAIL', details: initResult.details });
      console.log('❌ AudioService: Failed -', initResult.details);
    }
  } catch (error) {
    results.tests.push({ name: 'Audio Service', status: 'ERROR', details: error.message });
    console.log('❌ AudioService: Error -', error.message);
  }

  // Test 4: LFG Audio Asset Test
  console.log('\n🔊 Test 4: LFG Audio Asset Test');
  console.log('------------------------------');
  try {
    const audioService = new AudioService();
    const lfgItem = {
      id: 'lfg_default_audio',
      audioUri: 'default_alarm_sound',
      name: 'LFG Audio'
    };
    
    const playResult = await audioService.playAudio(lfgItem, { volume: 0.1 });
    if (playResult.success) {
      results.tests.push({ name: 'LFG Audio', status: 'PASS', details: 'LFG audio plays successfully' });
      console.log('✅ LFG Audio: Plays successfully');
      
      // Stop after 2 seconds
      setTimeout(async () => {
        await audioService.stopAudio();
      }, 2000);
    } else {
      results.tests.push({ name: 'LFG Audio', status: 'FAIL', details: playResult.error });
      console.log('❌ LFG Audio: Failed -', playResult.error);
    }
  } catch (error) {
    results.tests.push({ name: 'LFG Audio', status: 'ERROR', details: error.message });
    console.log('❌ LFG Audio: Error -', error.message);
  }

  // Test 5: Alarm Permissions Check
  console.log('\n🔐 Test 5: Alarm Permissions Check');
  console.log('---------------------------------');
  try {
    const permissions = await NativeAlarmService.checkAlarmPermissions();
    if (permissions && typeof permissions === 'object') {
      results.tests.push({ 
        name: 'Alarm Permissions', 
        status: 'PASS', 
        details: `Exact alarms: ${permissions.canScheduleExactAlarms}, Battery: ${permissions.isIgnoringBatteryOptimizations}` 
      });
      console.log('✅ Alarm Permissions:');
      console.log('  - Exact alarms:', permissions.canScheduleExactAlarms);
      console.log('  - Battery optimization:', permissions.isIgnoringBatteryOptimizations);
      console.log('  - Notifications:', permissions.notificationsEnabled);
    } else {
      results.tests.push({ name: 'Alarm Permissions', status: 'FAIL', details: 'Invalid permissions response' });
      console.log('❌ Alarm Permissions: Invalid response');
    }
  } catch (error) {
    results.tests.push({ name: 'Alarm Permissions', status: 'ERROR', details: error.message });
    console.log('❌ Alarm Permissions: Error -', error.message);
  }

  // Test 6: Alarm Scheduling Test
  console.log('\n⏰ Test 6: Alarm Scheduling Test');
  console.log('--------------------------------');
  try {
    const testTime = new Date(Date.now() + 30000); // 30 seconds from now
    const testAlarmId = 'test-alarm-' + Date.now();
    
    const scheduleResult = await NativeAlarmService.scheduleNativeAlarm({
      alarmId: testAlarmId,
      fireDate: testTime.getTime(),
      audioPath: 'default_alarm_sound',
      alarmTime: 'Test Alarm'
    });
    
    if (scheduleResult) {
      results.tests.push({ name: 'Alarm Scheduling', status: 'PASS', details: 'Alarm scheduled successfully' });
      console.log('✅ Alarm Scheduling: Success');
      
      // Clean up test alarm
      setTimeout(async () => {
        await NativeAlarmService.cancelNativeAlarm(testAlarmId);
        console.log('🧹 Test alarm cleaned up');
      }, 35000);
    } else {
      results.tests.push({ name: 'Alarm Scheduling', status: 'FAIL', details: 'Failed to schedule alarm' });
      console.log('❌ Alarm Scheduling: Failed');
    }
  } catch (error) {
    results.tests.push({ name: 'Alarm Scheduling', status: 'ERROR', details: error.message });
    console.log('❌ Alarm Scheduling: Error -', error.message);
  }

  // Test 7: Immediate Alarm Test
  console.log('\n🚨 Test 7: Immediate Alarm Test');
  console.log('------------------------------');
  try {
    const immediateResult = await NativeAlarmService.startImmediateAlarm('immediate-test', 'default_alarm_sound');
    if (immediateResult) {
      results.tests.push({ name: 'Immediate Alarm', status: 'PASS', details: 'Immediate alarm started successfully' });
      console.log('✅ Immediate Alarm: Started successfully');
      
      // Stop after 3 seconds
      setTimeout(async () => {
        await NativeAlarmService.stopCurrentAlarm();
        console.log('🛑 Immediate alarm stopped');
      }, 3000);
    } else {
      results.tests.push({ name: 'Immediate Alarm', status: 'FAIL', details: 'Failed to start immediate alarm' });
      console.log('❌ Immediate Alarm: Failed');
    }
  } catch (error) {
    results.tests.push({ name: 'Immediate Alarm', status: 'ERROR', details: error.message });
    console.log('❌ Immediate Alarm: Error -', error.message);
  }

  // Calculate Overall Results
  const passCount = results.tests.filter(t => t.status === 'PASS').length;
  const totalTests = results.tests.length;
  
  if (passCount === totalTests) {
    results.overall = 'PASS';
  } else if (passCount > totalTests / 2) {
    results.overall = 'PARTIAL';
  } else {
    results.overall = 'FAIL';
  }

  // Display Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Overall: ${results.overall}`);
  console.log(`Passed: ${passCount}/${totalTests}`);
  
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${test.name}: ${test.status}`);
  });

  return results;
};

export const showTestResults = (results) => {
  const passCount = results.tests.filter(t => t.status === 'PASS').length;
  const totalTests = results.tests.length;
  
  Alert.alert(
    'Android Test Results',
    `Overall: ${results.overall}\nPassed: ${passCount}/${totalTests}\n\nCheck console for detailed results.`,
    [{ text: 'OK' }]
  );
};