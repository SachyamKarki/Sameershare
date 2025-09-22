import React from 'react';
import { View, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Recorder, AlarmList, BackgroundComponent, StatusBarComponent } from '../components';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useTheme } from '../context';
import BatteryOptimizationPrompt from '../components/common/BatteryOptimizationPrompt';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { colors, darkMode } = useTheme();

  return (
    <BackgroundComponent>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 0, paddingBottom: 64 }}>
        <StatusBarComponent barStyle="light-content" backgroundColor={colors.background} translucent={false} hidden={false} />
        
        <View style={{ flex: 1, justifyContent: 'flex-start' }}>
          <ErrorBoundary onError={(e) => console.error('Recorder error:', e)} onRetry={() => {}}>
            <Recorder navigation={navigation} /> 
          </ErrorBoundary>
          <AlarmList />
        </View>
        
        {/* Battery Optimization Modal - renders as modal overlay */}
        <BatteryOptimizationPrompt />
      </SafeAreaView>
    </BackgroundComponent>
  );
};

export default HomeScreen;
