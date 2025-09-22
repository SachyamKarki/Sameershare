import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context';

export default function AmPmSelector({ ampm, setAmpm }) {
  const { colors, darkMode } = useTheme();
  return (
    <View
      style={{
        marginLeft: 1,
        marginTop: 30,
        flexDirection: 'row',   // row instead of column
        justifyContent: 'center',
        width: 120,
        height: 50,             // height enough for one row
        borderRadius: 8,
        backgroundColor: '#1A1A1A', // Always dark background
        overflow: 'hidden',
      }}
    >
      {['AM', 'PM'].map((meridian) => {
        const isSelected = ampm === meridian;
        return (
          <TouchableOpacity
            key={meridian}
            onPress={() => setAmpm(meridian)}
            style={{
              flex: 1,               // equal width for each button
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isSelected ? '#FFA500' : '#1A1A1A', // Always dark unselected
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: isSelected ? '#000' : '#FFFFFF', // Always white text when not selected
                fontWeight: '400',
                fontSize: 18,
              }}
            >
              {meridian}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
