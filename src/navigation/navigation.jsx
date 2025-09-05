// navigation.js
import React from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { 
  HomeScreen, 
  SetAlarmScreen, 
  RecordingScreen as RecordingsScreen, 
  AlarmRingingScreen,
  NativeAlarmTestScreen 
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

const HomeStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { paddingTop: 0, backgroundColor: 'black' },
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="SetAlarmScreen" component={SetAlarmScreen} />
  </Stack.Navigator>
);

const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="HomeTab"
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: 'white',
      tabBarInactiveTintColor: 'white',
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: 'black',
        borderTopWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
      },
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStackNavigator}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? 'home-sharp' : 'home-outline'}
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
      name="TestTab"
      component={NativeAlarmTestScreen}
      options={{
        title: 'Native Test',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? 'bug-sharp' : 'bug-outline'}
            color={color}
            size={24}
          />
        ),
      }}
    />
  </Tab.Navigator>
);

export default TabNavigator;
