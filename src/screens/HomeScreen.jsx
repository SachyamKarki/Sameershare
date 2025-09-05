import React from 'react';
import { View, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TimeDisplay, Recorder, AlarmList } from '../components';
import BatteryOptimizationPrompt from '../components/common/BatteryOptimizationPrompt';

const HomeScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 64 }}>
      <StatusBar barStyle="light-content" />
      
     
      <View style={{ flex: 1, justifyContent: 'flex-start' }}>
        <TimeDisplay />
        <BatteryOptimizationPrompt />
        <Recorder navigation={navigation} /> 
        <AlarmList />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
