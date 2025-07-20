import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native'
import { useNavigation } from '@react-navigation/native'

const RecordingScreen = () => {
  const navigation = useNavigation();
  return (
   <SafeAreaView className="flex-1 items-center justify-center bg-purple-100">
         <Text className="text-2xl">Recording Screen</Text>
   
         <TouchableOpacity
         className="bg-blue-500 p-4 rounded-lg mt-4"
         activeOpacity={0.7}
   
         onPress={()=> navigation.navigate("SetAlarmScreen")} 
        
         
         >
           <Text className=" text-white">Go to SetAlarm Screen </Text>  
           
         </TouchableOpacity>
   
   
   
       </SafeAreaView>
  )
}

export default RecordingScreen