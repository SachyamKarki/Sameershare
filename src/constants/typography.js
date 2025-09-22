/**
 * Typography Constants - Industry Standard
 * 
 * Standardized font sizes and weights across the entire application
 * Following Material Design and iOS Human Interface Guidelines
 */

export const TYPOGRAPHY = {
  // Main Titles (Screen Headers)
  MAIN_TITLE: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },

  // Section Titles (Card Headers, Modal Titles)
  SECTION_TITLE: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 24,
  },

  // Subsection Titles (Smaller Headers)
  SUBSECTION_TITLE: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 22,
  },

  // Body Text (Primary Content)
  BODY_LARGE: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  },

  // Body Text (Secondary Content)
  BODY_MEDIUM: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 20,
  },

  // Small Text (Captions, Labels)
  BODY_SMALL: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 16,
  },

  // Button Text
  BUTTON_LARGE: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 20,
  },

  // Button Text (Small)
  BUTTON_SMALL: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 18,
  },

  // Time Display (Large)
  TIME_LARGE: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 28,
  },

  // Time Display (Medium)
  TIME_MEDIUM: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  },

  // Caption Text
  CAPTION: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
};

// Helper function to create consistent text styles
export const createTextStyle = (typography, color = 'white', additionalStyles = {}) => ({
  ...typography,
  color,
  ...additionalStyles,
});

// Common text styles for quick use
export const TEXT_STYLES = {
  mainTitle: (color = 'white') => createTextStyle(TYPOGRAPHY.MAIN_TITLE, color),
  sectionTitle: (color = 'white') => createTextStyle(TYPOGRAPHY.SECTION_TITLE, color),
  subsectionTitle: (color = 'white') => createTextStyle(TYPOGRAPHY.SUBSECTION_TITLE, color),
  bodyLarge: (color = 'white') => createTextStyle(TYPOGRAPHY.BODY_LARGE, color),
  bodyMedium: (color = 'white') => createTextStyle(TYPOGRAPHY.BODY_MEDIUM, color),
  bodySmall: (color = 'white') => createTextStyle(TYPOGRAPHY.BODY_SMALL, color),
  buttonLarge: (color = 'white') => createTextStyle(TYPOGRAPHY.BUTTON_LARGE, color),
  buttonSmall: (color = 'white') => createTextStyle(TYPOGRAPHY.BUTTON_SMALL, color),
  timeLarge: (color = 'white') => createTextStyle(TYPOGRAPHY.TIME_LARGE, color),
  timeMedium: (color = 'white') => createTextStyle(TYPOGRAPHY.TIME_MEDIUM, color),
  caption: (color = 'white') => createTextStyle(TYPOGRAPHY.CAPTION, color),
};