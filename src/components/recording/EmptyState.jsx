import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { TEXT_STYLES } from '../../constants/typography';

const EmptyState = ({ onImport }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    }}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        style={{
          padding: 40,
          borderRadius: 24,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          width: '100%',
        }}
      >
        {/* Icon */}
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(59,130,246,0.2)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <Ionicons name="musical-notes" size={40} color="#3B82F6" />
        </View>

        {/* Title */}
        <Text style={TEXT_STYLES.sectionTitle('white')}>
          {t('recordings.emptyTitle')}
        </Text>

        {/* Description */}
        <Text style={TEXT_STYLES.bodyLarge('rgba(255,255,255,0.7)')}>
          {t('recordings.emptyDescription')}
        </Text>

        {/* Import Button */}
        <TouchableOpacity
          onPress={onImport}
          style={{
            backgroundColor: 'rgba(59,130,246,0.2)',
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(59,130,246,0.3)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Ionicons name="cloud-upload" size={20} color="#3B82F6" />
          <Text style={TEXT_STYLES.buttonLarge('#3B82F6')}>
            {t('recordings.importButton')}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

export default EmptyState;