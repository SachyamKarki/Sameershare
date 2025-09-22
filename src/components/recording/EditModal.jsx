import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { TEXT_STYLES } from '../../constants/typography';

const EditModal = ({ 
  visible, 
  editingItem, 
  newName, 
  setNewName, 
  onSave, 
  onCancel 
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleSave = () => {
    if (!newName.trim()) {
      Alert.alert(t('recordings.invalidName'), t('recordings.nameRequired'));
      return;
    }
    onSave(editingItem.id, newName.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
      }}>
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={{
            width: '100%',
            borderRadius: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <Text style={TEXT_STYLES.sectionTitle('white')}>
              {t('recordings.editTitle')}
            </Text>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.1)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder={t('recordings.namePlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: 'white',
              fontSize: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
            autoFocus
            selectTextOnFocus
            maxLength={50}
          />

          {/* Buttons */}
          <View style={{
            flexDirection: 'row',
            gap: 12,
          }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <Text style={TEXT_STYLES.buttonLarge('white')}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: 'rgba(59,130,246,0.2)',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(59,130,246,0.3)',
              }}
            >
              <Text style={TEXT_STYLES.buttonLarge('#3B82F6')}>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default EditModal;