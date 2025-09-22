import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from 'react-native-wheel-pick';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { getLocalizedNumber } from '../../utils/numberLocalization';

const TimePickerComponent = ({
  selectedHour,
  selectedMinute,
  selectedAmPm,
  onHourChange,
  onMinuteChange,
  onAmPmChange,
}) => {
  const { t } = useTranslation();

  const baseHours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const baseMinutes = Array.from({ length: 60 }, (_, i) =>
    i < 10 ? `0${i}` : `${i}`
  );
  const baseAmPm = ['AM', 'PM'];
  
  // Create localized arrays for display
  const localizedHours = baseHours.map(hour => getLocalizedNumber(hour, t));
  const localizedMinutes = baseMinutes.map(minute => getLocalizedNumber(minute, t));

  const playWheelSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/click.wav' },
        { shouldPlay: true, volume: 0.1 }
      );
      setTimeout(() => {
        sound.unloadAsync();
      }, 100);
    } catch (error) {}
  };

  const handleHourChange = (localizedValue) => {
    playWheelSound();
    // Convert localized number back to original number
    const originalValue = baseHours.find(hour => getLocalizedNumber(hour, t) === localizedValue);
    onHourChange(originalValue || '1');
  };

  const handleMinuteChange = (localizedValue) => {
    playWheelSound();
    // Convert localized number back to original number
    const originalValue = baseMinutes.find(minute => getLocalizedNumber(minute, t) === localizedValue);
    onMinuteChange(originalValue || '00');
  };

  const handleAmPmChange = (value) => {
    playWheelSound();
    onAmPmChange(value.toString());
  };

  return (
    <View style={styles.timePickerSection}>
      {/* Headers */}
      <View style={styles.headersRow}>
        <View style={styles.headerColumn}>
          <Text style={styles.headerText}>{t('time.hr')}</Text>
        </View>
        <View style={styles.headerColumn}>
          <Text style={styles.headerText}>{t('time.min')}</Text>
        </View>
        <View style={styles.headerColumn}>
          <Text style={styles.headerText}></Text>
        </View>
      </View>

      {/* Pickers */}
      <View style={styles.wheelsRow}>
        <View style={styles.wheelColumn}>
          <Picker
            style={[styles.picker, styles.pickerFont]}
            pickerData={localizedHours}
            selectedValue={getLocalizedNumber(selectedHour, t)}
            onValueChange={handleHourChange}
            isCyclic={false}
            itemSpace={10}
            textColor="#FFFFFF"
            selectedItemTextColor="#FFD700"
            selectedItemTextSize={48}
            itemTextColor="#FFFFFF"
            itemTextSize={28}
          />
        </View>

        <View style={styles.wheelColumn}>
          <Picker
            style={[styles.picker, styles.pickerFont]}
            pickerData={localizedMinutes}
            selectedValue={getLocalizedNumber(selectedMinute, t)}
            onValueChange={handleMinuteChange}
            isCyclic={false}
            itemSpace={10}
            textColor="#FFFFFF"
            selectedItemTextColor="#FFD700"
            selectedItemTextSize={48}
            itemTextColor="#FFFFFF"
            itemTextSize={28}
          />
        </View>

        <View style={styles.wheelColumn}>
          <Picker
            style={[styles.picker, styles.pickerFont]}
            pickerData={baseAmPm.map((item) => t(`time.${item.toLowerCase()}`))}
            selectedValue={t(`time.${selectedAmPm?.toLowerCase?.() || 'am'}`)}
            onValueChange={handleAmPmChange}
            isCyclic={false}
            itemSpace={10}
            textColor="#FFFFFF"
            selectedItemTextColor="#FFD700"
            selectedItemTextSize={48}
            itemTextColor="#FFFFFF"
            itemTextSize={28}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timePickerSection: {
    marginVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headersRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 15,
    width: '100%',
  },
  headerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Times New Roman',
  },
  wheelsRow: {
    flexDirection: 'row',
    height: 150,
    width: '100%',
    marginTop: 10,
  },
  wheelColumn: {
    flex: 1,
    alignItems: 'center',
  },
  picker: {
    width: '100%',
    height: 160,
    backgroundColor: 'transparent',
  },
  pickerFont: {
    fontFamily: 'Times New Roman',
  },
});

export default TimePickerComponent;
