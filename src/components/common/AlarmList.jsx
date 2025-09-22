import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Pressable } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlarm, useTheme } from '../../context';
import { useTranslation } from 'react-i18next';
import { formatLocalizedTime } from '../../utils/time';
import { TEXT_STYLES } from '../../constants/typography';
import audioService from '../../services/AudioService';

function formatDisplayTime(item, t) {
  const hasHMA = item?.hour !== undefined && item?.minute !== undefined && item?.ampm;
  if (hasHMA) {
    const hh = String(item.hour).padStart(2, '0');
    const mm = String(item.minute).padStart(2, '0');
    return formatLocalizedTime(hh, mm, item.ampm, t);
  }
  return '—';
}

function formatDays(days, t) {
  if (!Array.isArray(days)) return t('alarmlist.everyday');
  const normalized = days.length === 0 ? ['sun','mon','tue','wed','thu','fri','sat'] : days;
  if (normalized.length === 7) return t('alarmlist.everyday');
  return normalized.map((d) => t(`days.${d}`)).join(', ');
}

export default function AlarmList() {
  const { t } = useTranslation();
  const { alarms = [], deleteAlarm, updateAlarm, recordings = [] } = useAlarm();
  const { colors } = useTheme();
  const soundRef = useRef(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [openedRowId, setOpenedRowId] = useState(null);

  const startAudio = async (uri, alarm) => {
    console.log('🎵 Attempting to play alarm audio:', { uri, alarmId: alarm?.id, alarmAudioUri: alarm?.audioUri });
    
    try {
      // FIXED: Enhanced audio URI resolution with validation
      let audioItem;
      
      // FIXED: Consistent audio URI resolution
      const audioUri = alarm?.audioUri || uri;
      
      if (!audioUri || audioUri === 'default_alarm_sound') {
        console.log('🔔 Using default LFG audio preview');
        audioItem = {
          id: 'lfg_default_audio',
          audioUri: 'default_alarm_sound',
          name: 'LFG Audio'
        };
      } else {
        // FIXED: Check if it's a linked recording first with validation
        const linkedRecording = recordings.find(r => r.linkedAlarmId === alarm?.id);
        if (linkedRecording && linkedRecording.audioUri) {
          console.log('🎵 Found linked recording:', linkedRecording.audioUri);
          audioItem = {
            id: linkedRecording.id,
            audioUri: linkedRecording.audioUri,
            name: linkedRecording.name
          };
        } else {
          // FIXED: Use the alarm's audioUri directly with validation
          console.log('🎵 Using alarm audio URI directly:', audioUri);
          
          // FIXED: Validate audio file exists before playing
          const { validateAudioFile } = require('../../utils/audioProcessor');
          const validation = await validateAudioFile(audioUri);
          
          if (!validation.valid) {
            console.error('❌ Audio file validation failed for preview:', validation);
            // Fallback to LFG default for preview
            audioItem = {
              id: 'lfg_default_audio',
              audioUri: 'default_alarm_sound',
              name: 'LFG Audio (Fallback)'
            };
          } else {
            audioItem = {
              id: alarm?.recordingId || alarm?.id,
              audioUri: audioUri,
              name: alarm?.name || 'Custom Recording'
            };
          }
        }
      }

      // Use the professional audio service
      const playResult = await audioService.playAudio(audioItem, {
        volume: 1.0,
        isLooping: false,
        playbackOptions: {
          shouldPlay: true,
          playsInSilentMode: true,
          staysActiveInBackground: true,
        }
      });

      if (!playResult.success) {
        console.error('❌ Audio playback failed:', playResult.error);
        audioService.showErrorAlert(playResult, 'Preview Error');
        setIsLongPressing(false);
        return;
      }

      soundRef.current = playResult.sound;
      console.log('✅ Audio preview started successfully');

    } catch (error) {
      console.error('❌ Audio playback error:', error);
      Alert.alert(
        t('alarmlist.playback_error'),
        t('alarmlist.playback_error_body'),
        [{ text: t('alarmlist.ok') }]
      );
      setIsLongPressing(false);
    }
  };

  const stopAudio = async () => {
    try {
      console.log('🛑 Stopping audio preview');
      const stopResult = await audioService.stopAudio();
      if (stopResult.success) {
        soundRef.current = null;
        setIsLongPressing(false);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
      setIsLongPressing(false);
    }
  };

  const renderItem = ({ item }) => {
    const displayTime = formatDisplayTime(item, t);
    const daysText = formatDays(item.days, t);
    const isEnabled = item.enabled !== false;
    const showDisabledOverlay = !isEnabled && openedRowId !== item.id;

    return (
      <View style={styles.alarmCard}>
        <View
          style={[styles.solidCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.cardContent,
              pressed && { opacity: 0.7 }
            ]}
            delayLongPress={200}
            onPressIn={() => {
              setIsLongPressing(true);
              startAudio(item.audioUri, item);
            }}
            onPressOut={() => {
              setIsLongPressing(false);
              stopAudio();
            }}
            onLongPress={() => {
              console.log('Long press detected - continuing audio playback');
            }}
          >
            <View style={styles.alarmInfo}>
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: colors.text }, !isEnabled && styles.disabledText]} >
                  {displayTime}
                </Text>
              </View>
              <Text style={[styles.daysText, { color: colors.subText }, !isEnabled && styles.disabledSubText]}>
                {typeof daysText === 'string' ? daysText.toUpperCase() : ''}
              </Text>
            </View>
            
            <View style={styles.alarmActions}>
              <Switch
                value={isEnabled}
                onValueChange={(val) => {
                  updateAlarm(item.id, { enabled: val });
                  if (val) {
                    const time = formatDisplayTime(item, t);
                    const days = formatDays(item.days, t);
                    console.log(`Alarm turned on for ${time} on ${days}`);
                  }
                }}
                trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                thumbColor={isEnabled ? colors.switchThumb : '#FFFFFF'}
                style={styles.switch}
              />
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderHiddenItem = (rowData, rowMap) => {
    const item = rowData?.item;
    const id = item?.id;
    const isEnabled = item?.enabled !== false;

    // Only show delete button when the row is actively opened/swiped
    if (id !== openedRowId) {
      return (
        <View style={styles.hiddenItemContainer} />
      );
    }

    return (
      <View style={styles.hiddenItemContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={async () => {
            try {
              if (id) {
                await deleteAlarm(id);
                if (rowMap[id]) {
                  rowMap[id].closeRow();
                }
              }
            } catch (error) {
              console.error('Error deleting alarm:', error);
            }
          }}
          activeOpacity={0.7}
        >
            <Ionicons name="trash" size={30} color={colors.deleteButtonText} />
            
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('alarmlist.title')}</Text>
      </View>

      {alarms.length > 0 ? (
        <SwipeListView
          data={alarms}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : String(index))}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-80}
          leftOpenValue={0}
          disableRightSwipe={true}
          disableLeftSwipe={false}
          closeOnRowBeginSwipe={false}
          closeOnRowOpen={false}
          closeOnRowPress={false}
          closeOnScroll={true}
          swipeRowStyle={{ backgroundColor: 'transparent' }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRowOpen={(rowKey, rowMap) => {
            setOpenedRowId(rowKey);
          }}
          onRowClose={() => {
            setOpenedRowId(null);
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="alarm-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>{t('alarmlist.no_alarms')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('alarmlist.create_first_alarm')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginTop: 13,
    marginBottom: 8,
  },
  title: {
    ...TEXT_STYLES.mainTitle('white'),
    marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    ...TEXT_STYLES.bodyMedium('rgba(255,255,255,0.6)'),
  },
  listContent: {
    paddingBottom: 20,
  },
  alarmCard: {
    marginBottom: 10,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  solidCard: {
    borderRadius: 16,
    borderWidth: 1,
  },
  disabledCard: {
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  alarmInfo: {
    flex: 1,
  },
  timeContainer: {
    marginBottom: 6,
  },
  timeText: {
    ...TEXT_STYLES.timeLarge('white'),
  },
  disabledText: {
    opacity: 0.4,
  },
  daysText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    fontFamily: 'Times New Roman',
  },
  disabledSubText: {
    opacity: 0.3,
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switch: {
    transform: [{ scaleX: 1.7 }, { scaleY: 1.4 }],
    marginLeft: 6,
    marginRight: 2,
  },
  hiddenItemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    backgroundColor: 'transparent',
    marginTop: 4,
    marginBottom: 12,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
  },
  deleteButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 11,
    marginBottom: 5,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
});