import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SettingItem = ({
  title,
  description,
  icon,
  iconColor,
  iconBackgroundColor,
  rightComponent,
  onPress,
  textColor = '#FFFFFF',
  subTextColor = '#CCCCCC',
  cardBackground = '#0A0A0A', // Default to very dark background
  isButton = false,
  showChevron = false,
}) => {
  const content = (
    <View style={[styles.glassCard, { backgroundColor: cardBackground }]}>
      <View style={styles.cardContent}>
        <View style={[styles.settingIcon, { backgroundColor: iconBackgroundColor }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: textColor }]}>
            {title}
          </Text>
          <Text style={[styles.settingDesc, { color: subTextColor }]}>
            {description}
          </Text>
        </View>
        {rightComponent}
        {showChevron && (
          <Ionicons name="chevron-forward" size={24} color={subTextColor} />
        )}
      </View>
    </View>
  );

  if (isButton && onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.cardWrapper}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.cardWrapper}>{content}</View>;
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
  },
  glassCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)', // Even more subtle border
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 14,
    opacity: 0.7,
  },
});

export default SettingItem;
