import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getLocalizedNumber } from '../../utils/numberLocalization';

const formatTime = (date, t) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const pad = (n) => n.toString().padStart(2, '0');
  const localizedHour = getLocalizedNumber(pad(hours), t);
  const localizedMinute = getLocalizedNumber(pad(minutes), t);
  const localizedAmPm = t(`time.${ampm.toLowerCase()}`);
  return `${localizedHour}:${localizedMinute} ${localizedAmPm}`;
};

const formatDay = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

const formatDate = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
};

const TimeDisplay = () => {
  const [now, setNow] = useState(new Date());
  const { t } = useTranslation();

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ alignItems: 'center', marginTop: 30 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>
        {formatTime(now, t)} 
      </Text>
      <Text style={{ fontSize: 16, color: 'white', marginTop: 4 }}>
    {formatDay(now)}  | {formatDate(now)}
      </Text>
    </View>
  );
};

export default TimeDisplay;
