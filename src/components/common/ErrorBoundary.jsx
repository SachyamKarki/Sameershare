import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to show fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch {}
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof this.props.onRetry === 'function') {
      try {
        this.props.onRetry();
      } catch {}
    }
  };

  translate = (key, fallbackText) => {
    try {
      const t = this.props.translation && this.props.translation.t;
      if (typeof t === 'function') {
        const translated = t(key);
        return translated === key ? fallbackText : translated;
      }
    } catch {}
    return fallbackText;
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <MaterialIcons name="error-outline" size={64} color="#FF6B6B" />
            
            <Text style={styles.title}>{this.translate('errorBoundary.somethingWentWrong', 'Something went wrong')}</Text>
            
            <Text style={styles.subtitle}>{this.translate('errorBoundary.description', 'The app ran into an unexpected error. You can try again.')}</Text>
            
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
            >
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text style={styles.retryText}>{this.translate('errorBoundary.tryAgain', 'Try again')}</Text>
            </TouchableOpacity>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>{this.translate('errorBoundary.debugInfo', 'Debug info')}</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  debugInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default function TranslatedErrorBoundary(props) {
  const { t } = useTranslation();
  return <ErrorBoundary {...props} translation={{ t }} />;
}
