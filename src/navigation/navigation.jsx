// navigation.js
import React, { useEffect } from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import NavigationService from '../services/NavigationService';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

import { 
  SplashScreen,
  HomeScreen, 
  SetAlarmScreen, 
  RecordingScreen as RecordingsScreen, 
  AlarmRingingScreen,
  NativeAlarmTestScreen,
  StorageStatsScreen,
  BatteryOptimizationScreen,
  SettingsScreen
} from '../screens';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function navigateNested(parent, child, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(parent, { screen: child, params });
  }
}

const Stack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        statusBarStyle: 'light',
        statusBarBackgroundColor: colors.background,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SetAlarmScreen" component={SetAlarmScreen} />
    </Stack.Navigator>
  );
};

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActiveTint,
        tabBarInactiveTintColor: colors.tabBarInactiveTint,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        statusBarStyle: 'light',
        statusBarBackgroundColor: colors.background,
      }}
    >
    <Tab.Screen
      name="HomeTab"
      component={HomeStackNavigator}
      options={{
        title: t('settingsCommon.title'),
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? 'home' : 'home-outline'}
            color={color}
            size={24}
          />
        ),
      }}
    />
    <Tab.Screen
      name="RecordingsTab"
      component={RecordingsScreen}
      options={{
        title: t('recordings.title'),
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? 'albums-sharp' : 'albums-outline'}
            color={color}
            size={24}
          />
        ),
      }}
    />
    <Tab.Screen
      name="SettingsTab"
      component={SettingsScreen}
      options={{
        title: t('settingsCommon.title'),
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? 'settings' : 'settings-outline'}
            color={color}
            size={24}
          />
        ),
      }}
    />
  </Tab.Navigator>
  );
};

// Main Stack Navigator with Modal screens and Professional Navigation Integration
const MainStackNavigator = () => {
  const { colors } = useTheme();
  
  // Initialize navigation service when component mounts
  useEffect(() => {
    if (navigationRef.current) {
      NavigationService.setNavigationRef({ current: navigationRef.current });
    }
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // Professional animation config
        animation: 'slide_from_right',
        animationDuration: 300,
        statusBarStyle: 'dark',
        statusBarBackgroundColor: colors.background,
      }}
    >
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen 
        name="AlarmRinging" 
        component={AlarmRingingScreen}
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          animation: 'slide_from_bottom',
          headerShown: false,
          animationDuration: 500,
          // Block all other navigation when alarm is active
          stackAnimation: 'none',
        }}
      />
      <Stack.Screen 
        name="StorageStats" 
        component={StorageStatsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="BatteryOptimization" 
        component={BatteryOptimizationScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="TestTab" 
        component={NativeAlarmTestScreen}
        options={{
          title: 'Developer Testing',
          presentation: 'modal',
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainStackNavigator;
