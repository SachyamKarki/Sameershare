import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native'

const HomeScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-purple-100">
      <Text className="text-2xl">HomeScreen</Text>

      <TouchableOpacity 
      className="bg-blue-500 p-4 rounded-lg mt-4"
      activeOpacity={0.7}

      onPress={()=> navigation.navigate("RecordingScreen")} 
     
      
      >
        <Text className=" text-white">Go to Recording Screen </Text>  
        
      </TouchableOpacity>



    </SafeAreaView>
  )
}

export default HomeScreen