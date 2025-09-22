import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAlarm } from '../context/AlarmContext';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import * as DocumentPicker from 'expo-document-picker';
import { validateRecording, moveToDocumentDirectory } from '../utils/storageManager';

export const useRecordingManager = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { recordings: contextRecordings = [], deleteRecording, addRecording, updateRecording, isRecordingActive } = useAlarm();
  const [localRecordings, setLocalRecordings] = useState([]);
  const [customNames, setCustomNames] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRecordingId, setExpandedRecordingId] = useState(null);

  // Combine recordings with default LFG audio
  const recordings = (() => {
    const defaultLfgItem = {
      id: 'lfg_default_audio',
      name: t('recordings.lfgAudioDefaultName'), // Use the correct translation key
      audioUri: 'default_alarm_sound', // Use consistent identifier for default sound
      duration: 30000, // 30 seconds default duration
      uploadedAt: 0, // Keep at top with 0 timestamp
      createdAt: 0,
      isImmutable: true,
      isDefault: true,
      // Add metadata for proper handling
      isDefaultAudio: true,
      canBeUsedForAlarm: true,
    };

    const combined = [defaultLfgItem, ...contextRecordings, ...localRecordings];
    
    // Remove duplicates based on ID
    const unique = combined.reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    return unique.sort((a, b) => {
      // LFG audio always stays at top
      if (a.id === 'lfg_default_audio') return -1;
      if (b.id === 'lfg_default_audio') return 1;
      // Sort others by upload time
      return (a.uploadedAt || 0) - (b.uploadedAt || 0);
    });
  })();

  const handleDelete = async (recordingId) => {
    if (recordingId === 'lfg_default_audio') {
      Alert.alert(t('recordings.cannotDelete'), t('recordings.cannotDeleteDefault'));
      return;
    }

    Alert.alert(
      t('recordings.deleteTitle'),
      t('recordings.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecording(recordingId);
              // Also remove from local state if it exists there
              setLocalRecordings(prev => prev.filter(rec => rec.id !== recordingId));
              setCustomNames(prev => {
                const updated = { ...prev };
                delete updated[recordingId];
                return updated;
              });
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert(t('common.error'), t('recordings.deleteError'));
            }
          },
        },
      ]
    );
  };

  const handleEdit = async (recordingId, newName) => {
    if (!newName?.trim() || !recordingId) {
      console.warn('Invalid edit parameters:', { recordingId, newName });
      return;
    }

    if (recordingId === 'lfg_default_audio') {
      Alert.alert(t('recordings.cannotEdit'), t('recordings.cannotEditDefault'));
      return;
    }

    try {
      await updateRecording(recordingId, { name: newName.trim() });
      setCustomNames(prev => ({
        ...prev,
        [recordingId]: newName.trim(),
      }));
      setShowEditModal(false);
      setEditingItem(null);
      setNewName('');
    } catch (error) {
      console.error('Edit error:', error);
      Alert.alert(t('common.error'), t('recordings.editError'));
    }
  };

  const handleSetAlarm = async (item) => {
    try {
      if (!item) {
        console.warn('No item provided to handleSetAlarm');
        return;
      }

      // FIXED: Consistent audio URI resolution with validation
      const audioUri = item.audioUri || item.uri;
      if (!audioUri) {
        Alert.alert(t('recordings.noAudio'), t('recordings.noAudioMessage'));
        return;
      }

      // FIXED: Validate audio file exists before navigation
      const { validateAudioFile } = require('../utils/audioProcessor');
      const validation = await validateAudioFile(audioUri);
      
      if (!validation.valid) {
        console.error('❌ Audio file validation failed:', validation);
        Alert.alert(
          t('recordings.invalidAudio'),
          t('recordings.invalidAudioMessage'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      console.log('🎯 Navigating to SetAlarmScreen with VALIDATED audio:', {
        audioUri,
        recordingId: item.id,
        recordingName: item.name,
        isDefaultAudio: item.isDefaultAudio || false,
        validation: validation,
      });

      // FIXED: Navigate to alarm setup with validated audio
      navigation.navigate('HomeTab', {
        screen: 'SetAlarmScreen',
        params: {
          selectedAudio: audioUri, // FIXED: Consistent property name
          recordingId: item.id,
          recordingName: item.name,
          isDefaultAudio: item.isDefaultAudio || false,
          // FIXED: Add validation info for debugging
          audioValidation: validation,
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(t('common.error'), t('recordings.navigationError'));
    }
  };

  const handleImport = async () => {
    try {
      // Check if recording is currently active in home screen
      if (isRecordingActive) {
        Alert.alert(
          t('recordings.importBlocked'),
          t('recordings.importBlockedMessage'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        
        // Validate file
        const validation = await validateRecording(file.uri, file.size);
        if (!validation.valid) {
          Alert.alert(t('recordings.invalidAudioTitle'), validation.reason);
          return;
        }

        // Move to permanent storage
        const recordingId = uuidv4();
        const fileName = `upload-${Date.now()}-${recordingId}.m4a`;
        const moveResult = await moveToDocumentDirectory(file.uri, fileName);
        
        if (moveResult.success) {
          const newRecording = {
            id: recordingId,
            audioUri: moveResult.newUri,
            name: file.name.replace(/\.[^/.]+$/, ""),
            duration: validation.durationMs || 0,
            uploadedAt: Date.now(),
            isUploaded: true
          };

          addRecording(newRecording);
          Alert.alert(t('common.success'), t('recordings.importSuccess'));
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(t('common.error'), t('recordings.importError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpanded = (recordingId) => {
    setExpandedRecordingId(prev => prev === recordingId ? null : recordingId);
  };

  const handleOutsideTouch = () => {
    if (expandedRecordingId) {
      setExpandedRecordingId(null);
    }
  };

  return {
    recordings,
    customNames,
    showEditModal,
    editingItem,
    newName,
    isLoading,
    expandedRecordingId,
    setShowEditModal,
    setEditingItem,
    setNewName,
    handleDelete,
    handleEdit,
    handleSetAlarm,
    handleImport,
    handleToggleExpanded,
    handleOutsideTouch,
  };
};