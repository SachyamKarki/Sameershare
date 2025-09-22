import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // App is now permanently in dark mode
  const darkMode = true;
  const [isLoading, setIsLoading] = useState(false); // No need to load theme preference

  // Removed theme loading and toggle functionality - app is always dark

  // Theme colors - App is permanently in dark mode
  const theme = {
    darkMode,
    toggleTheme: null, // No theme toggle functionality
    colors: {
      // Fixed dark theme colors - Black background
      background: '#000000',
      text: '#FFFFFF',
      subText: '#CCCCCC',
      cardBackground: 'rgba(255, 255, 255, 0.05)', // Transparent with slight white tint
      border: 'rgba(255,255,255,0.1)', // More subtle border
      
      // Navigation colors for dark theme
      tabBarBackground: '#000000',
      tabBarActiveTint: '#FFFFFF',
      tabBarInactiveTint: '#999999',
      headerBackground: '#000000',
      headerTint: '#FFFFFF',
      statusBarStyle: 'light',
      statusBarBackground: '#000000',
      
      // All other colors remain consistent regardless of theme
      switchTrackFalse: '#888888', // Consistent gray
      switchTrackTrue: '#22C55E', // Always green
      switchThumb: '#FFFFFF', // Always white
      deleteButtonBg: '#FF4444', // Always red
      deleteButtonText: '#FFFFFF', // Always white
      
      // Additional consistent colors for buttons, icons, etc.
      primaryButton: '#22C55E', // Always green
      secondaryButton: '#6B7280', // Always gray
      accentColor: '#3B82F6', // Always blue
      warningColor: '#F59E0B', // Always amber
      errorColor: '#EF4444', // Always red
      successColor: '#10B981', // Always emerald
    }
  };

  if (isLoading) {
    return null; // or a loading component
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
