import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function AmPmSelector({ ampm, setAmpm }) {
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
        backgroundColor: '#4B5563',
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
              backgroundColor: isSelected ? '#FFA500' : '#4B5563',
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: isSelected ? '#000' : '#D1D5DB',
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
