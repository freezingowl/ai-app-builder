import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { SavedApp, appStorage } from '../services/appStorage';

interface AppGalleryProps {
  onRunApp: (app: SavedApp) => void;
  onCreateNew: () => void;
}

export const AppGallery: React.FC<AppGalleryProps> = ({ onRunApp, onCreateNew }) => {
  const [savedApps, setSavedApps] = useState<SavedApp[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadApps = async () => {
    try {
      const apps = await appStorage.getAllApps();
      setSavedApps(apps);
    } catch (error) {
      console.error('Error loading apps:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApps();
    setRefreshing(false);
  };

  const handleDeleteApp = (app: SavedApp) => {
          Alert.alert(
        'Delete App',
        `Are you sure you want to delete "${app.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await appStorage.deleteApp(app.id);
            await loadApps();
          },
        },
      ]
    );
  };

  const handleRunApp = async (app: SavedApp) => {
    await appStorage.updateLastOpened(app.id);
    onRunApp(app);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const generateAppColor = (appId: string) => {
    // Generate consistent colors based on app ID
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F4D03F'
    ];
    
    // Use app ID to consistently pick the same color
    const hash = appId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    loadApps();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Apps</Text>
        <TouchableOpacity style={styles.createButton} onPress={onCreateNew}>
          <Text style={styles.createButtonText}>+ Create New</Text>
        </TouchableOpacity>
      </View>

      {/* Apps List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {savedApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Apps Yet</Text>
            <Text style={styles.emptySubtitle}>Create your first AI-generated app!</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={onCreateNew}>
              <Text style={styles.emptyButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.appsGrid}>
            {savedApps.map((app) => {
              const appColor = generateAppColor(app.id);
              console.log('Rendering app:', {
                id: app.id,
                name: app.name,
                emoji: app.appEmoji,
                description: app.description
              });
              
              return (
                <View key={app.id} style={styles.appContainer}>
                  <TouchableOpacity
                    style={[styles.appIcon, { backgroundColor: appColor }]}
                    onPress={() => handleRunApp(app)}
                  >
                    <Text style={styles.appEmoji}>
                      {app.appEmoji || '📱'}
                    </Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.appName} numberOfLines={2}>
                    {app.name || 'Unnamed App'}
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteApp(app)}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  appsGrid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  appContainer: {
    width: '22%', // 4 apps per row like iPhone
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  appIcon: {
    width: 85,
    height: 85,
    borderRadius: 22, // Bigger iPhone-style squircle
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 8,
  },
  appEmoji: {
    fontSize: 45,
    textAlign: 'center',
    lineHeight: 50,
  },
  appName: {
    fontSize: 13,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
    paddingHorizontal: 3,
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 14,
  },
}); 