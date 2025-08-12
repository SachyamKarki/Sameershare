import React, { useState } from 'react';
import { View, Text, Switch, Alert, Pressable } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Entypo } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useAlarm } from '../components/AlarmContext';
import { Audio } from 'expo-av';

const AlarmList = () => {
  const { alarms, deleteAlarm } = useAlarm();
  const [sound, setSound] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  const handleDelete = (rowMap, alarmId) => {
    Alert.alert('Delete Alarm', 'Are you sure you want to delete this alarm?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (rowMap[alarmId]) rowMap[alarmId].closeRow();
          deleteAlarm(alarmId);
        },
      },
    ]);
  };

  const startPlaying = async (alarm) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: alarm.audioUri,
      });
      setSound(newSound);
      setPlayingId(alarm.id);
      await newSound.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const stopPlaying = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingId(null);
    }
  };

  return (
    <View className="flex-1 bg-black px-4 pt-5">
      <Text className="text-white text-2xl font-bold mb-6">Alarm List</Text>

      {alarms.length === 0 ? (
        <Text className="text-gray-400 text-lg text-center mt-4">
          No alarms set
        </Text>
      ) : (
        <SwipeListView
          data={alarms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPressIn={() => startPlaying(item)}
              onPressOut={stopPlaying}
              android_ripple={{ color: '#333', borderless: false }}
              style={{
                backgroundColor: playingId === item.id ? '#111' : 'black',
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text className="text-white text-xl font-bold">
                  {`${item.hour.toString().padStart(2, '0')}:${item.minute
                    .toString()
                    .padStart(2, '0')} ${item.ampm}`}
                </Text>
                <Text className="text-gray-400 text-sm mt-1">
                  {item.days.join(', ')}
                </Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: '#555', true: '#22c55e' }}
                thumbColor="#fff"
              />
            </Pressable>
          )}
          renderHiddenItem={({ item }, rowMap) => (
            <View className="flex-1 flex-row justify-end pr-4 items-center">
              <TouchableOpacity
                onPress={() => handleDelete(rowMap, item.id)}
                className="bg-red-600 w-14 h-14 rounded-full justify-center items-center"
              >
                <Entypo name="trash" size={22} color="white" />
              </TouchableOpacity>
            </View>
          )}
          rightOpenValue={-80}
          disableLeftSwipe={false}
          disableRightSwipe={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
};

export default AlarmList;
