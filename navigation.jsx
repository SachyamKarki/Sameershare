// navigation.js
import React from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import SetAlarmScreen from './screens/SetAlarmScreen';
import RecordingsScreen from './screens/RecordingScreen';
import AlarmRingingScreen from './screens/AlarmRingingScreen';

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
    <Stack.Screen name="AlarmRinging" component={AlarmRingingScreen} />
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
      name="AlarmRingingTab"
      component={AlarmRingingScreen}
      initialParams={{ alarmId: 'test', audioUri: '' }} // safe defaults
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={focused ? 'alarm-sharp' : 'alarm-outline'}
            color={color}
            size={24}
          />
        ),
      }}
    />
  </Tab.Navigator>
);

export default TabNavigator;
