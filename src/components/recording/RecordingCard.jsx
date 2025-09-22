import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getLocalizedNumber, parseDefaultRecordingName, getTranslatedDefaultName } from '../../utils/numberLocalization';
import { formatTime } from '../../utils/time';
import { TEXT_STYLES } from '../../constants/typography';

const RecordingCard = ({ 
  item, 
  index, 
  onPlay = () => {}, 
  onEdit = () => {}, 
  onDelete = () => {}, 
  onSetAlarm = () => {}, 
  isPlaying = false, 
  customName = '', 
  position = 0, 
  duration = 0, 
  isExpanded = false, 
  onToggleExpanded = () => {},
  onSeek = () => {}
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  
  // Get the display name - translate if it's a default name, otherwise use as-is
  const getDisplayName = () => {
    if (!item?.name) {
      return t('recordings.defaultName', { number: getLocalizedNumber(index + 1, t) });
    }
    
    const parsed = parseDefaultRecordingName(item.name);
    if (parsed.isDefault) {
      return getTranslatedDefaultName(parsed.number, t);
    }
    
    return item.name; // Custom name, don't translate
  };
  
  const displayName = getDisplayName();
  const [newName, setNewName] = useState(displayName);
  const [currentPosition, setCurrentPosition] = useState(0);
  
  // Update display name when language changes
  useEffect(() => {
    const updatedDisplayName = getDisplayName();
    setNewName(updatedDisplayName);
  }, [t, item?.name]);
  
  const [isLocalPlaying, setIsLocalPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [audioDuration, setAudioDuration] = useState(item?.duration || duration || 0);
  const [isAlarmSet, setIsAlarmSet] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.9)).current;
  const playScaleAnim = useRef(new Animated.Value(1)).current;
  const alarmScaleAnim = useRef(new Animated.Value(1)).current;
  const longPressTimer = useRef(null);

  // Update duration when item changes
  useEffect(() => {
    if (item?.duration) {
      setAudioDuration(item.duration);
    }
  }, [item?.duration]);

  // Update position when prop changes
  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  const animatePress = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const animateButtonScale = (animValue) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Audio playback functions
  const togglePlayback = async () => {
    try {
      if (isLocalPlaying && sound) {
        await sound.pauseAsync();
        setIsLocalPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsLocalPlaying(true);
      } else {
        // Create and load sound
        const audioUri = item?.audioUri || item?.uri;
        if (!audioUri) {
          console.warn('No audio URI found for item:', item);
          return;
        }
        
        const { Audio, Asset } = require('expo-av');
        const { setLoudspeakerAudioMode } = require('../../utils/audio');
        
        await setLoudspeakerAudioMode();
        
        let soundSource;
        
        // Handle default audio differently
        if (item.id === 'lfg_default_audio') {
          console.log('🎵 Loading default LFG audio...');
          // For default audio, use the asset directly
          const LFG_AUDIO_ASSET = require('../../../assets/audio/lfg_default.mp3');
          soundSource = LFG_AUDIO_ASSET;
        } else {
          // For regular recordings, use the URI directly
          soundSource = { uri: audioUri };
        }
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          soundSource,
          { shouldPlay: true }
        );
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setCurrentPosition(status.positionMillis);
            setAudioDuration(status.durationMillis);
            setIsLocalPlaying(status.isPlaying);
            
            if (status.didJustFinish) {
              setIsLocalPlaying(false);
              setCurrentPosition(0);
            }
          }
        });
        
        setSound(newSound);
        setIsLocalPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      Alert.alert(t('common.error'), t('recordings.playError'));
    }
  };

  const seekToPosition = async (value) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
    onSeek(value);
  };

  const handleLongPress = () => {
    if (item.id === 'lfg_default_audio') return;
    
    setIsRenaming(true);
    setNewName(displayName);
  };

  const handleSaveRename = () => {
    if (newName.trim() && newName.trim() !== displayName) {
      onEdit(item.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setNewName(displayName);
    setIsRenaming(false);
  };

  const handlePlayPress = () => {
    animatePress();
    onPlay(item);
  };

  const handleEditPress = () => {
    if (item.id === 'lfg_default_audio') return;
    onEdit(item.id, displayName);
  };

  const handleDeletePress = () => {
    if (item.id === 'lfg_default_audio') return;
    onDelete(item.id);
  };

  const handleSetAlarmPress = () => {
    onSetAlarm(item);
  };

  const handleCardPress = () => {
    onToggleExpanded(item.id);
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity
        onPress={handleCardPress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.8}
        style={{
          marginHorizontal: 16,
          marginVertical: 6,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
          style={{ padding: 18 }}
        >
          {/* Top Row: Title and Set Alarm */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            {/* Recording Title */}
            <View style={{ flex: 1, marginRight: 16 }}>
              {isRenaming && item.id !== 'lfg_default_audio' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    style={{
                      color: colors.text,
                      fontSize: 20,
                      fontWeight: '700',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      padding: 12,
                      borderRadius: 12,
                      flex: 1,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.2)',
                    }}
                    onSubmitEditing={handleSaveRename}
                    onBlur={handleSaveRename}
                    onKeyPress={(e) => {
                      if (e.nativeEvent?.key === 'Enter') {
                        handleSaveRename();
                      } else if (e.nativeEvent?.key === 'Escape') {
                        setIsRenaming(false);
                      }
                    }}
                    returnKeyType="done"
                    autoFocus
                  />
                </View>
              ) : (
                <Text style={TEXT_STYLES.sectionTitle(colors.text)}>
                  {customName || displayName}
                </Text>
              )}
            </View>
            
            {/* Right-side controls: expand toggle + set alarm */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Set alarm icon: orange with gray background */}
              <Animated.View style={{ transform: [{ scale: isExpanded ? 1.2 : 1 }] }}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  if (isRenaming) return;
                  handleSetAlarmPress();
                  setIsAlarmSet((prev) => !prev);
                }}
                onLongPress={(e) => {
                  e.stopPropagation();
                  if (item?.id) {
                    setIsRenaming(true);
                    setNewName(item?.name || `Recording ${getLocalizedNumber(index + 1)}`);
                  }
                }}
                delayLongPress={800}
                disabled={isRenaming}
                style={{
                  padding: isExpanded ? 16 : 12,
                  borderRadius: 16,
                  backgroundColor: 'rgba(120,120,120,0.12)',
                  opacity: isRenaming ? 0.5 : 1,
                  shadowColor: 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0,
                  shadowRadius: 0,
                  elevation: 0,
                }}
              >
                <Ionicons 
                  name="alarm"
                  size={20}
                  color="#F59E0B"
                />
              </TouchableOpacity>
              </Animated.View>

              {/* Expand/collapse icon */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  if (isRenaming) return;
                  handleCardPress();
                }}
                disabled={isRenaming}
                style={{
                  padding: 8,
                  opacity: isRenaming ? 0.5 : 1,
                }}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Audio Info - Hidden when expanded */}
          {!isExpanded && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              marginTop: 6,
            }}>
              {/* For LFG default audio - only show duration */}
              {item.id === 'lfg_default_audio' ? (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}>
                  <Ionicons name="time" size={10} color="rgba(255,255,255,0.6)" />
                  <Text style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 11,
                    fontWeight: '500',
                    marginLeft: 3,
                  }}>
                    {formatTime(audioDuration)}
                  </Text>
                </View>
              ) : (
                <>
                  {/* Duration for other recordings - shown first */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    marginRight: 8,
                  }}>
                    <Ionicons name="time" size={10} color="rgba(255,255,255,0.6)" />
                    <Text style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 11,
                      fontWeight: '500',
                      marginLeft: 3,
                    }}>
                      {formatTime(audioDuration)}
                    </Text>
                  </View>
                  
                  {/* Date for other recordings - shown second */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}>
                    <Ionicons name="calendar" size={10} color="rgba(255,255,255,0.6)" />
                    <Text style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 11,
                      fontWeight: '500',
                      marginLeft: 3,
                    }}>
                      {new Date(item?.uploadedAt || item?.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Expanded Audio Player */}
          {isExpanded && (
            <Animated.View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                marginTop: 8,
              }}>
                {/* Audio Slider Control */}
                <View style={{ marginBottom: 16 }}>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={audioDuration}
                    value={currentPosition}
                    onValueChange={seekToPosition}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor="rgba(255,255,255,0.2)"
                    thumbStyle={{
                      backgroundColor: '#3B82F6',
                      width: 20,
                      height: 20,
                      shadowColor: 'rgba(59,130,246,0.3)',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  />
                  
                  {/* Time Display */}
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    marginTop: 6,
                    paddingHorizontal: 2,
                  }}>
                    <Text style={{ 
                      color: 'rgba(255,255,255,0.7)', 
                      fontSize: 12,
                      fontWeight: '500',
                    }}>
                      {formatTime(currentPosition)}
                    </Text>
                    <Text style={{ 
                      color: 'rgba(255,255,255,0.7)', 
                      fontSize: 12,
                      fontWeight: '500',
                    }}>
                      {formatTime(audioDuration)}
                    </Text>
                  </View>
                </View>
                
                {/* Control Buttons Row */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 8,
                }}>
                  {/* Edit Audio Button (Left) */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setIsRenaming(true);
                    }}
                    disabled={isRenaming}
                    style={{
                      flex: 1,
                      height: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(59,130,246,0.12)',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(59,130,246,0.25)',
                      opacity: isRenaming ? 0.5 : 1,
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>

                  {/* Play/Pause Button (Center) */}
                  <Animated.View style={{ transform: [{ scale: playScaleAnim }], flex: 1.3 }}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      animateButtonScale(playScaleAnim);
                      togglePlayback();
                    }}
                    disabled={isRenaming}
                    style={{
                      flex: 1,
                      height: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isLocalPlaying ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isLocalPlaying ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.2)',
                      opacity: isRenaming ? 0.5 : 1,
                    }}
                  >
                    <Ionicons 
                      name={isLocalPlaying ? "pause" : "play"} 
                      size={24} 
                      color={isLocalPlaying ? "#22C55E" : colors.text}
                      style={{ marginLeft: isLocalPlaying ? 0 : 2 }}
                    />
                  </TouchableOpacity>
                  </Animated.View>

                  {/* Delete Button (Right) */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeletePress();
                    }}
                    disabled={isRenaming}
                    style={{
                      flex: 1,
                      height: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(239,68,68,0.12)',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(239,68,68,0.25)',
                      opacity: isRenaming ? 0.5 : 1,
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default RecordingCard;