
import { NavigationContainer } from "@react-navigation/native"

import { createNativeStackNavigator } from "@react-navigation/native-stack"
import HomeScreen from "../screens/HomeScreen";
import RecordingScreen from "../screens/RecordingScreen";
import SetAlarmScreen from "../screens/SetAlarmScreen";

const Stack = createNativeStackNavigator();


const StackNavigator = () => {
  return (
   
    <NavigationContainer>

        <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{headerShown: true, headerTitleAlign: 'center', headerStyle: { backgroundColor: '#ff67' }, headerTintColor: '#000', headerTitleStyle: { fontWeight: 'bold' }}}>

            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="RecordingScreen" component={RecordingScreen} />
            <Stack.Screen name="SetAlarmScreen" component={SetAlarmScreen} />

        </Stack.Navigator>

    </NavigationContainer>

  )
}

export default StackNavigator