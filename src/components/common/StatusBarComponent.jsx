/**
 * Status Bar Component
 * 
 * Consistent status bar implementation across all screens
 * Handles theme changes and provides consistent styling
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const StatusBarComponent = ({ 
  barStyle = 'light-content', 
  backgroundColor = null,
  translucent = false,
  hidden = false 
}) => {
  const { colors, darkMode } = useTheme();
  
  // Use provided backgroundColor or theme-based background
  const statusBarBackgroundColor = backgroundColor || colors.background;
  
  // Use provided barStyle or theme-based style
  const statusBarStyle = barStyle === 'auto' 
    ? (darkMode ? 'light-content' : 'dark-content')
    : barStyle;

  return (
    <StatusBar
      barStyle={statusBarStyle}
      backgroundColor={statusBarBackgroundColor}
      translucent={translucent}
      hidden={hidden}
    />
  );
};

export default StatusBarComponent;