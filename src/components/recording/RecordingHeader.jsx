import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { TEXT_STYLES } from '../../constants/typography';

const RecordingHeader = ({ recordingsCount, onImport }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ backgroundColor: 'transparent' }}>
      <View style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'transparent',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={TEXT_STYLES.mainTitle('white')}>
              {t('recordings.title')}
            </Text>
            <Text style={TEXT_STYLES.bodyLarge('rgba(255,255,255,0.7)')}>
              {recordingsCount} {recordingsCount === 1 ? t('recordings.recording') : t('recordings.recordings')}
            </Text>
          </View>
          
          {/* Import Button */}
          <TouchableOpacity
            onPress={onImport}
            style={{
              backgroundColor: 'rgba(59,130,246,0.15)',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(59,130,246,0.3)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="cloud-upload" size={18} color="#3B82F6" />
            <Text style={TEXT_STYLES.buttonSmall('#3B82F6')}>
              {t('recordings.importButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RecordingHeader;