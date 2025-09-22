// src/components/settings/DeleteRecordings.jsx
import React from 'react';
import SettingItem from './SettingItem';

const DeleteRecordings = ({ textColor, subTextColor, cardBackground }) => {
  const handleDelete = () => {
    // TODO: Add your real delete logic here
    console.log("All recordings deleted (except last one if you want to keep it)");
  };

  return (
    <SettingItem
      title="Delete All Recordings"
      description="Remove all stored recordings from the device"
      icon="trash-bin"
      iconColor="#FF4C4C"
      iconBackgroundColor="rgba(255, 76, 76, 0.1)"
      onPress={handleDelete}
      isButton
      textColor={textColor}
      subTextColor={subTextColor}
      cardBackground={cardBackground}
    />
  );
};

export default DeleteRecordings;
