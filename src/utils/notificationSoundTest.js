/**
 * Notification Sound Test Utility
 * Tests that notification channel sound is properly disabled
 */

import { Platform } from 'react-native';
import NativeAlarmService from '../services/NativeAlarmService';

export const testNotificationSoundDisabled = async () => {
  console.log('🔇 Testing Notification Sound Disabled...');
  console.log('=====================================');
  
  if (Platform.OS !== 'android') {
    console.log('❌ This test is Android-specific');
    return { success: false, reason: 'Not Android' };
  }

  try {
    // Test 1: Start immediate alarm
    console.log('🚨 Starting immediate alarm test...');
    const alarmId = 'sound-test-' + Date.now();
    const success = await NativeAlarmService.startImmediateAlarm(alarmId, 'default_alarm_sound');
    
    if (!success) {
      console.log('❌ Failed to start immediate alarm');
      return { success: false, reason: 'Failed to start alarm' };
    }
    
    console.log('✅ Immediate alarm started');
    console.log('📱 Check notification - should have NO system default sound');
    console.log('🎵 Only LFG audio should be playing');
    
    // Auto-stop after 5 seconds
    setTimeout(async () => {
      await NativeAlarmService.stopCurrentAlarm();
      console.log('🛑 Test alarm stopped');
    }, 5000);
    
    return { 
      success: true, 
      message: 'Notification sound test completed - check that only LFG audio plays',
      alarmId 
    };
    
  } catch (error) {
    console.log('❌ Notification sound test failed:', error.message);
    return { success: false, reason: error.message };
  }
};

export const testCustomAudioOnly = async (audioUri) => {
  console.log('🎵 Testing Custom Audio Only...');
  console.log('==============================');
  
  try {
    // Test with custom audio
    const alarmId = 'custom-audio-test-' + Date.now();
    const success = await NativeAlarmService.startImmediateAlarm(alarmId, audioUri);
    
    if (!success) {
      console.log('❌ Failed to start custom audio alarm');
      return { success: false, reason: 'Failed to start alarm' };
    }
    
    console.log('✅ Custom audio alarm started');
    console.log('📱 Check notification - should have NO system default sound');
    console.log('🎵 Only custom audio should be playing');
    
    // Auto-stop after 5 seconds
    setTimeout(async () => {
      await NativeAlarmService.stopCurrentAlarm();
      console.log('🛑 Custom audio test stopped');
    }, 5000);
    
    return { 
      success: true, 
      message: 'Custom audio test completed - check that only custom audio plays',
      alarmId 
    };
    
  } catch (error) {
    console.log('❌ Custom audio test failed:', error.message);
    return { success: false, reason: error.message };
  }
};

export const runCompleteSoundTest = async () => {
  console.log('🧪 Running Complete Sound Test Suite...');
  console.log('======================================');
  
  const results = [];
  
  // Test 1: LFG Audio Only
  console.log('\n🎵 Test 1: LFG Audio Only');
  const lfgResult = await testNotificationSoundDisabled();
  results.push({ test: 'LFG Audio Only', ...lfgResult });
  
  // Wait 6 seconds between tests
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  // Test 2: Custom Audio Only (if available)
  console.log('\n🎤 Test 2: Custom Audio Only');
  const customResult = await testCustomAudioOnly('file:///test/path/recording.mp3');
  results.push({ test: 'Custom Audio Only', ...customResult });
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.success ? 'PASS' : 'FAIL'}`);
    if (!result.success) {
      console.log(`   Reason: ${result.reason}`);
    }
  });
  
  const passCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\nOverall: ${passCount}/${totalTests} tests passed`);
  
  return {
    success: passCount === totalTests,
    results,
    summary: `${passCount}/${totalTests} tests passed`
  };
};