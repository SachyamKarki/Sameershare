import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Device from 'expo-device';
import NativeAlarmService from '../services/NativeAlarmService';
import { Toast, CustomAlert } from '../components';

const BatteryOptimizationScreen = () => {
  const navigation = useNavigation();
  const [deviceInfo, setDeviceInfo] = useState({});
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeviceInfo();
    checkPermissions();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const info = {
        brand: Device.brand || 'Unknown',
        manufacturer: Device.manufacturer || 'Unknown',
        modelName: Device.modelName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
        platformApiLevel: Device.platformApiLevel || 'Unknown',
      };
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error loading device info:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      const perms = await NativeAlarmService.checkAlarmPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const getOEMInstructions = () => {
    const brand = deviceInfo.brand?.toLowerCase() || '';
    const manufacturer = deviceInfo.manufacturer?.toLowerCase() || '';
    
    // Comprehensive OEM-specific instructions
    const instructions = {
      xiaomi: {
        name: 'Xiaomi/MIUI',
        color: '#FF6900',
        icon: 'flash',
        steps: [
          'Open Settings → Apps → Manage Apps',
          'Find your alarm app → App Info',
          'Tap "Battery Saver" → Choose "No restrictions"',
          'Go to "Autostart" → Enable autostart',
          'Settings → Battery & Performance → Turn off battery optimization',
          'Lock screen: Pull down from top → Lock icon on app notification'
        ],
        additionalTips: [
          'Disable "Memory cleanup" in Security app',
          'Add app to "Protected apps" list',
          'Enable "Show on lock screen" for notifications'
        ]
      },
      oppo: {
        name: 'Oppo/ColorOS',
        color: '#1BA345',
        icon: 'battery-charging',
        steps: [
          'Settings → Battery → Battery Optimization',
          'Find your app → "Don\'t optimize"',
          'Settings → Apps → App Manager → [Your App]',
          'Battery Usage → Allow background activity',
          'Startup Manager → Enable app startup',
          'Recent Apps: Lock the app (drag down on app card)'
        ],
        additionalTips: [
          'Disable "Smart resolution" for better performance',
          'Enable "High performance mode" temporarily for setup'
        ]
      },
      vivo: {
        name: 'Vivo/Funtouch OS',
        color: '#4285F4',
        icon: 'speedometer',
        steps: [
          'i Manager → App Manager → [Your App]',
          'Battery → Background App Refresh → Enable',
          'Settings → Battery → Battery Optimization → [Your App] → Don\'t optimize',
          'Settings → More Settings → Applications → Autostart → Enable',
          'Recent apps: Lock app with lock icon',
          'Whitelist app in "Pure background" if available'
        ]
      },
      oneplus: {
        name: 'OnePlus/OxygenOS',
        color: '#EB0028',
        icon: 'flash-outline',
        steps: [
          'Settings → Battery → Battery Optimization',
          'All Apps → [Your App] → Don\'t Optimize',
          'Settings → Apps → Special App Access → Device Admin Apps → Enable',
          'Recent Apps → Lock app (long press → lock icon)',
          'Turn off "Adaptive Battery" temporarily during setup'
        ]
      },
      huawei: {
        name: 'Huawei/EMUI',
        color: '#FF0000',
        icon: 'shield-checkmark',
        steps: [
          'Settings → Apps → Apps → [Your App] → Battery',
          'App Launch → Manage Manually → Enable all toggles',
          'Settings → Battery → Close apps after screen lock → [Your App] → Don\'t close',
          'Phone Manager → Protected Apps → Enable',
          'Recent apps: Pull down on app to lock'
        ]
      },
      realme: {
        name: 'Realme/Realme UI',
        color: '#FFD700',
        icon: 'flame',
        steps: [
          'Settings → Battery → Battery Optimization → [Your App] → Don\'t optimize',
          'Settings → App Management → [Your App] → Battery Usage → Allow background activity',
          'Auto-start Management → Enable for your app',
          'Recent apps: Pull down to lock app'
        ]
      },
      samsung: {
        name: 'Samsung/One UI',
        color: '#1428A0',
        icon: 'phone-portrait',
        steps: [
          'Settings → Apps → [Your App] → Battery → Allow background activity',
          'Settings → Device Care → Battery → App Power Management → Apps that won\'t be put to sleep → Add your app',
          'Settings → Apps → [Your App] → Notifications → Allow notifications',
          'Disable "Adaptive Battery" in Settings → Device Care → Battery → More battery settings'
        ]
      },
      default: {
        name: 'Generic Android',
        color: '#34A853',
        icon: 'settings',
        steps: [
          'Settings → Apps & notifications → [Your App] → Advanced → Battery → Battery optimization → Don\'t optimize',
          'Settings → Apps → [Your App] → Permissions → Allow all necessary permissions',
          'Keep app in recent apps and avoid clearing all recent apps',
          'Enable "Show on lock screen" for notifications'
        ]
      }
    };

    // Match device to instructions
    for (const [key, value] of Object.entries(instructions)) {
      if (brand.includes(key) || manufacturer.includes(key)) {
        return value;
      }
    }
    
    return instructions.default;
  };

  const openSettings = async (settingType) => {
    try {
      switch (settingType) {
        case 'battery':
          await NativeAlarmService.requestBatteryOptimizationExemption();
          break;
        case 'exactAlarm':
          await NativeAlarmService.requestExactAlarmPermission();
          break;
        case 'appSettings':
          await NativeAlarmService.openAppSettings();
          break;
        default:
          await NativeAlarmService.openAppSettings();
      }
      
      // Refresh permissions after user returns
      setTimeout(checkPermissions, 1000);
    } catch (error) {
      Toast.error('Settings Error', 'Could not open settings. Please navigate manually.');
    }
  };

  const testAlarm = async () => {
    try {
      CustomAlert.confirm(
        t('testAlarm.title'),
        t('testAlarm.message'),
        async () => {
          try {
            const testTime = new Date(Date.now() + 10000); // 10 seconds from now
            await NativeAlarmService.scheduleNativeAlarm({
              alarmId: 'test-alarm-' + Date.now(),
              fireDate: testTime.getTime(),
              audioPath: '', // Default alarm sound
              alarmTime: 'Test Alarm'
            });
            Toast.success('Test Scheduled', 'Test alarm will ring in 10 seconds!');
          } catch (error) {
            Toast.error('Test Failed', 'Could not schedule test alarm.');
          }
        }
      );
    } catch (error) {
      Toast.error('Test Failed', 'Could not schedule test alarm.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="hourglass" size={48} color="white" />
        <Text style={{ color: 'white', marginTop: 16, fontSize: 18 }}>Loading device info...</Text>
      </SafeAreaView>
    );
  }

  const oemInstructions = getOEMInstructions();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar barStyle="light-content" backgroundColor="black" translucent={false} hidden={false} />
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(255,255,255,0.1)' 
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold', marginLeft: 16 }}>
          Battery Optimization Setup
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Device Info Card */}
        <View style={{ 
          backgroundColor: 'rgba(255,255,255,0.05)', 
          borderRadius: 15, 
          padding: 20, 
          marginBottom: 20 
        }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            📱 Device Information
          </Text>
          
          <InfoRow label="Brand" value={deviceInfo.brand} />
          <InfoRow label="Manufacturer" value={deviceInfo.manufacturer} />
          <InfoRow label="Model" value={deviceInfo.modelName} />
          <InfoRow label="Android Version" value={deviceInfo.osVersion} />
          <InfoRow label="API Level" value={deviceInfo.platformApiLevel} />
        </View>

        {/* Permission Status */}
        <View style={{ 
          backgroundColor: 'rgba(255,255,255,0.05)', 
          borderRadius: 15, 
          padding: 20, 
          marginBottom: 20 
        }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            🔐 Permission Status
          </Text>
          
          <PermissionRow 
            label="Exact Alarm Permission" 
            granted={permissions.canScheduleExactAlarms}
            onFix={() => openSettings('exactAlarm')}
          />
          <PermissionRow 
            label="Battery Optimization Disabled" 
            granted={permissions.isIgnoringBatteryOptimizations}
            onFix={() => openSettings('battery')}
          />
          <PermissionRow 
            label="Notifications Enabled" 
            granted={permissions.notificationsEnabled}
            onFix={() => openSettings('appSettings')}
          />
          
          <View style={{ 
            backgroundColor: permissions.allPermissionsGranted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 107, 107, 0.1)', 
            borderRadius: 8, 
            padding: 12, 
            marginTop: 16,
            borderWidth: 1,
            borderColor: permissions.allPermissionsGranted ? '#4CAF50' : '#FF6B6B'
          }}>
            <Text style={{ 
              color: permissions.allPermissionsGranted ? '#4CAF50' : '#FF6B6B', 
              fontWeight: 'bold', 
              marginBottom: 4 
            }}>
              {permissions.allPermissionsGranted ? '✅ All Permissions Granted' : '⚠️ Setup Required'}
            </Text>
            <Text style={{ 
              color: permissions.allPermissionsGranted ? '#4CAF50' : '#FF6B6B', 
              fontSize: 12 
            }}>
              {permissions.allPermissionsGranted 
                ? 'Your alarms should work reliably!' 
                : 'Please complete the setup steps below.'}
            </Text>
          </View>
        </View>

        {/* OEM-Specific Instructions */}
        <View style={{ 
          backgroundColor: 'rgba(255,255,255,0.05)', 
          borderRadius: 15, 
          padding: 20, 
          marginBottom: 20 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name={oemInstructions.icon} size={24} color={oemInstructions.color} />
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 12 }}>
              {oemInstructions.name} Setup
            </Text>
          </View>
          
          <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 16, lineHeight: 22 }}>
            Follow these specific steps for your device to ensure alarms work reliably:
          </Text>
          
          {oemInstructions.steps.map((step, index) => (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: oemInstructions.color,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
                marginTop: 2
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                  {index + 1}
                </Text>
              </View>
              <Text style={{ color: 'white', flex: 1, lineHeight: 20 }}>
                {step}
              </Text>
            </View>
          ))}
          
          {oemInstructions.additionalTips && (
            <View style={{ 
              backgroundColor: 'rgba(255, 193, 7, 0.1)', 
              borderRadius: 8, 
              padding: 12, 
              marginTop: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#FFC107'
            }}>
              <Text style={{ color: '#FFC107', fontWeight: 'bold', marginBottom: 8 }}>
                💡 Additional Tips:
              </Text>
              {oemInstructions.additionalTips.map((tip, index) => (
                <Text key={index} style={{ color: '#FFC107', fontSize: 12, marginBottom: 4 }}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={{ 
          backgroundColor: 'rgba(255,255,255,0.05)', 
          borderRadius: 15, 
          padding: 20, 
          marginBottom: 20 
        }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            🛠️ Quick Actions
          </Text>
          
          <QuickActionButton 
            title="Open App Settings"
            subtitle="Access all app permissions"
            icon="settings-outline"
            onPress={() => openSettings('appSettings')}
          />
          
          <QuickActionButton 
            title="Battery Settings"
            subtitle="Disable battery optimization"
            icon="battery-charging-outline"
            onPress={() => openSettings('battery')}
          />
          
          <QuickActionButton 
            title="Test Alarm"
            subtitle="Verify your setup works"
            icon="alarm-outline"
            onPress={testAlarm}
          />
          
          <QuickActionButton 
            title="Refresh Status"
            subtitle="Check permissions again"
            icon="refresh-outline"
            onPress={checkPermissions}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={{ 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  }}>
    <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</Text>
    <Text style={{ color: 'white', fontWeight: '600' }}>{value}</Text>
  </View>
);

const PermissionRow = ({ label, granted, onFix }) => (
  <View style={{ 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <Ionicons 
        name={granted ? "checkmark-circle" : "close-circle"} 
        size={20} 
        color={granted ? "#4CAF50" : "#FF6B6B"} 
      />
      <Text style={{ color: 'white', marginLeft: 12, flex: 1 }}>{label}</Text>
    </View>
    {!granted && (
      <TouchableOpacity 
        onPress={onFix}
        style={{
          backgroundColor: '#2196F3',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6
        }}
      >
        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Fix</Text>
      </TouchableOpacity>
    )}
  </View>
);

const QuickActionButton = ({ title, subtitle, icon, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    }}
  >
    <Ionicons name={icon} size={24} color="#2196F3" />
    <View style={{ flex: 1, marginLeft: 16 }}>
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
        {title}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
        {subtitle}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
  </TouchableOpacity>
);

export default BatteryOptimizationScreen;
