import React from 'react';
import { View, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TimeDisplay from '../components/TimeDisplay';
import Recorder from '../components/Recorder';
import AlarmList from '../components/AlarmList';

const HomeScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 64 }}>
      <StatusBar barStyle="light-content" />
      
     
      <View style={{ flex: 1, justifyContent: 'flex-start' }}>
        <TimeDisplay />
        <Recorder navigation={navigation} /> 
        <AlarmList />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
