import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DaysSelector({ selectedDays, setSelectedDays }) {
  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
      }}
    >
      {daysOfWeek.map((day) => {
        const isSelected = selectedDays.includes(day);
        return (
          <TouchableOpacity
            key={day}
            onPress={() => toggleDay(day)}
            activeOpacity={0.8}
            style={{
              width: '31%',
              marginBottom: 16,
              borderRadius: 12, // smoother edges
              backgroundColor: isSelected ? '#6C7A89' : '#374151',
              paddingVertical: 14,
              alignItems: 'center',
              // subtle shadow on selected
              shadowColor: isSelected ? '#000' : 'transparent',
              shadowOpacity: isSelected ? 0.3 : 0,
              shadowRadius: isSelected ? 6 : 0,
              shadowOffset: { width: 0, height: 3 },
              elevation: isSelected ? 4 : 0, // Android shadow
            }}
          >
            <Text
              style={{
                color: isSelected ? '#F9FAFB' : '#D1D5DB',
                fontWeight: '600',
                fontSize: 18,
              }}
            >
              {day}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
