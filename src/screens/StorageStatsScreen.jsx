import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { performStorageMaintenance, cleanupCacheFiles, cleanupInvalidRecordings } from '../utils/storageManager';

export default function StorageStatsScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const loadStats = async () => {
    try {
      const result = await performStorageMaintenance({ dryRun: true });
      if (result.success) {
        setStats(result.stats);
      } else {
        console.error('Failed to load storage statistics');
      }
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const runMaintenance = async () => {
    if (maintenanceLoading) return;
    
    try {
      setMaintenanceLoading(true);
      const result = await performStorageMaintenance();
      
      if (result.success) {
        console.log('Storage maintenance completed successfully');
        loadStats();
      } else {
        console.error('Maintenance failed:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to run maintenance:', error);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Clean Cache',
      subtitle: 'Remove temporary files',
      icon: 'trash-outline',
      color: '#3B82F6',
      action: async () => {
        const result = await cleanupCacheFiles();
        if (result.success) {
          console.log(`Cache cleaned: ${result.deletedFiles} files (${result.deletedSizeMB}MB)`);
          loadStats();
        }
      }
    },
    {
      title: 'Remove Invalid',
      subtitle: 'Clean broken recordings',
      icon: 'checkmark-circle-outline',
      color: '#4ECDC4',
      action: async () => {
        const result = await cleanupInvalidRecordings();
        if (result.success) {
          console.log(`Invalid entries cleaned: ${result.invalidRecordings}`);
          loadStats();
        }
      }
    },
    {
      title: 'Full Maintenance',
      subtitle: 'Complete cleanup',
      icon: 'build-outline',
      color: '#FFA500',
      action: runMaintenance
    }
  ];

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Storage Statistics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading storage statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} hidden={false} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Storage Statistics</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Storage Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Overview</Text>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Recordings</Text>
              <Text style={styles.statValue}>{stats?.totalRecordings || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Size</Text>
              <Text style={styles.statValue}>{formatBytes(stats?.totalSizeBytes || 0)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Valid Files</Text>
              <Text style={styles.statValue}>{stats?.validFiles || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Invalid Files</Text>
              <Text style={[styles.statValue, { color: stats?.invalidFiles > 0 ? '#EF4444' : '#10B981' }]}>
                {stats?.invalidFiles || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
              onPress={action.action}
              disabled={maintenanceLoading}
            >
              <View style={styles.actionContent}>
                <Ionicons name={action.icon} size={24} color={action.color} />
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
              </View>
              {maintenanceLoading && action.title === 'Full Maintenance' && (
                <ActivityIndicator size="small" color={action.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Storage Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Details</Text>
          <View style={styles.detailCard}>
            <Text style={styles.detailText}>
              Storage quota is managed automatically to keep your app running smoothly.
              Old cache files are cleaned up regularly, and invalid recordings are removed
              to free up space.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    marginLeft: 12,
    flex: 1,
  },
  actionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  detailCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  detailText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
});
