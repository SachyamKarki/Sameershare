/**
 * Professional Navigation Service
 * Handles all navigation transitions and state management
 * Following React Navigation best practices
 */

import { CommonActions } from '@react-navigation/native';

class NavigationService {
  constructor() {
    this.navigationRef = null;
  }

  // Set the navigation reference from the main navigator
  setNavigationRef(ref) {
    this.navigationRef = ref;
  }

  // Professional navigation to recordings list with proper state management
  navigateToRecordingsList(params = {}) {
    if (!this.navigationRef?.current) {
      // Navigation ref not available
      return;
    }

    // Use CommonActions for professional navigation with slide animation
    this.navigationRef.current.dispatch(
      CommonActions.navigate({
        name: 'RecordingsTab',
        params: {
          ...params,
          // Add timestamp to ensure fresh navigation
          navigationTimestamp: Date.now(),
        },
        // Add slide from left animation options
        options: {
          animation: 'slide_from_right',
          animationDuration: 400,
        },
      })
    );
  }

  // Navigate to recordings with highlighting for new recording
  navigateToRecordingsWithHighlight(recordingId, additionalParams = {}) {
    this.navigateToRecordingsList({
      newRecordingId: recordingId,
      shouldScrollToTop: true,
      ...additionalParams,
    });
  }

  // Professional back navigation with cleanup
  goBack(fallbackRoute = null) {
    if (!this.navigationRef?.current) {
      // Navigation ref not available
      return;
    }

    const canGoBack = this.navigationRef.current.canGoBack();
    
    if (canGoBack) {
      this.navigationRef.current.goBack();
    } else if (fallbackRoute) {
      this.navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: fallbackRoute }],
        })
      );
    }
  }

  // Reset navigation stack professionally
  resetToScreen(screenName, params = {}) {
    if (!this.navigationRef?.current) {
      // Navigation ref not available
      return;
    }

    this.navigationRef.current.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: screenName, params }],
      })
    );
  }

  // Professional navigation with replacement
  replace(screenName, params = {}) {
    if (!this.navigationRef?.current) {
      // Navigation ref not available
      return;
    }

    this.navigationRef.current.dispatch(
      CommonActions.replace(screenName, params)
    );
  }

  // Get current route name professionally
  getCurrentRoute() {
    if (!this.navigationRef?.current) {
      return null;
    }

    const state = this.navigationRef.current.getRootState();
    return this.getActiveRouteName(state);
  }

  // Helper to get active route name from state
  getActiveRouteName(state) {
    const route = state.routes[state.index];
    
    if (route.state) {
      return this.getActiveRouteName(route.state);
    }
    
    return route.name;
  }
}

// Export singleton instance
export default new NavigationService();
