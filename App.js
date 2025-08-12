import 'react-native-get-random-values';  
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TabNavigator, { navigationRef } from './navigation';
import { AlarmProvider } from './components/AlarmContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
  <NavigationContainer ref={navigationRef}>
    <AlarmProvider>
      <TabNavigator />
    </AlarmProvider>
  </NavigationContainer>
</GestureHandlerRootView>

  );
}
