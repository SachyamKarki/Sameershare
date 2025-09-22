import React from "react";
import {
  View,
  Text,
  FlatList,
  StatusBar,
  TouchableWithoutFeedback,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { BackgroundComponent, StatusBarComponent } from "../components";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useRecordingManager } from "../hooks/useRecordingManager";
import RecordingCard from "../components/recording/RecordingCard";
import RecordingHeader from "../components/recording/RecordingHeader";
import EmptyState from "../components/recording/EmptyState";
import EditModal from "../components/recording/EditModal";

const RecordingScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  // Custom hooks
  const audioPlayer = useAudioPlayer();
  const recordingManager = useRecordingManager();

  // Handle expanded state changes to pause audio when container is closed
  const handleExpandedChange = (recordingId) => {
    const wasExpanded = recordingManager.expandedRecordingId !== null;
    const isNowExpanded = recordingId !== null;
    
    // If container was expanded and is now closed, pause and reset audio
    if (wasExpanded && !isNowExpanded) {
      console.log('🎵 Container closed, pausing and resetting audio');
      audioPlayer.stopAudio();
    }
    
    // Toggle expanded state
    recordingManager.handleToggleExpanded(recordingId);
  };

  // Error boundary handling
  if (!colors) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <BackgroundComponent>
      <StatusBarComponent barStyle="light-content" backgroundColor={colors.background} translucent={false} hidden={false} />
      
      {/* Professional Header */}
      <RecordingHeader 
        recordingsCount={recordingManager.recordings.length}
        onImport={recordingManager.handleImport}
      />

      {/* Content */}
      <TouchableWithoutFeedback onPress={() => {
        // Pause audio when touching outside
        if (recordingManager.expandedRecordingId) {
          console.log('🎵 Touched outside, pausing audio');
          audioPlayer.stopAudio();
        }
        recordingManager.handleOutsideTouch();
      }}>
        <View style={{ flex: 1 }}>
          {recordingManager.recordings.length === 0 ? (
            <EmptyState onImport={recordingManager.handleImport} />
          ) : (
            <FlatList
              data={recordingManager.recordings}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ 
                paddingVertical: 12,
                paddingBottom: 24,
                paddingTop: 8,
                paddingHorizontal: 4,
              }}
              renderItem={({ item, index }) => (
                <RecordingCard
                  item={item}
                  index={index}
                  onPlay={audioPlayer.playAudio}
                  onEdit={recordingManager.handleEdit}
                  onDelete={recordingManager.handleDelete}
                  onSetAlarm={recordingManager.handleSetAlarm}
                  isPlaying={audioPlayer.playingUri === (item.audioUri || item.uri) && audioPlayer.isPlayingAudio}
                  customName={recordingManager.customNames[item.id]}
                  position={audioPlayer.position}
                  duration={audioPlayer.duration}
                  isExpanded={recordingManager.expandedRecordingId === item.id}
                  onToggleExpanded={handleExpandedChange}
                  onSeek={audioPlayer.seekToPosition}
                />
              )}
            />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Edit Modal */}
      <EditModal
        visible={recordingManager.showEditModal}
        editingItem={recordingManager.editingItem}
        newName={recordingManager.newName}
        setNewName={recordingManager.setNewName}
        onSave={recordingManager.handleEdit}
        onCancel={() => {
          recordingManager.setShowEditModal(false);
          recordingManager.setEditingItem(null);
          recordingManager.setNewName('');
        }}
      />
    </BackgroundComponent>
  );
};

export default RecordingScreen;