import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context';
import { useTranslation } from 'react-i18next';

const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export default function DaysSelector({ selectedDays, onDaysChange }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const toggleDay = (day) => {
    onDaysChange((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 5,
        marginBottom: 10,
        paddingHorizontal: 16,
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
              marginBottom: 12,
              borderRadius: 10,
              backgroundColor: isSelected ? '#2A2A2A' : colors.cardBackground,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? colors.text : colors.border,
              shadowColor: isSelected ? '#000000' : 'transparent',
              shadowOpacity: isSelected ? 0.3 : 0,
              shadowRadius: isSelected ? 4 : 0,
              shadowOffset: { width: 0, height: 2 },
              elevation: isSelected ? 4 : 0,
            }}
          >
            <Text
              style={{
                color: isSelected ? '#FFFFFF' : colors.subText,
                fontWeight: '700',
                fontSize: 16,
                letterSpacing: 0.5,
                fontFamily: 'Times New Roman',
              }}
            >
              {t(`days.${day}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
