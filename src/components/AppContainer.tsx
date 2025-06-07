import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { GeneratedApp } from '../types';
import { dynamicComponentLoader } from '../services/dynamicComponentLoader';
import { ErrorReporter } from './ErrorReporter';
import { ErrorBoundary } from './ErrorBoundary';

interface AppContainerProps {
  app: GeneratedApp;
  onClose: () => void;
  onEdit: () => void;
  onFixError: (errorDetails: string) => void;
  showHomeButton?: boolean;
  onHome?: () => void;
}

export const AppContainer: React.FC<AppContainerProps> = ({
  app,
  onClose,
  onEdit,
  onFixError,
  showHomeButton = false,
  onHome,
}) => {
  const [DynamicComponent, setDynamicComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorReporter, setShowErrorReporter] = useState(false);

  useEffect(() => {
    loadComponent();
  }, [app.code]);

  const loadComponent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setShowErrorReporter(false);
      
      const component = await dynamicComponentLoader.loadComponent(app.code, app.id);
      setDynamicComponent(() => component);
    } catch (err) {
      console.error('Failed to load component:', err);
      setError(err as Error);
      setShowErrorReporter(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = () => {
    loadComponent();
  };

  const handleFixError = (errorDetails: string) => {
    setShowErrorReporter(false);
    onClose(); // Go back to chat
    onFixError(errorDetails); // Send error to AI
  };

  const handleDismissError = () => {
    setShowErrorReporter(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{app.name}</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your app...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{app.name}</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>Edit App</Text>
          </TouchableOpacity>
        </View>

        {showErrorReporter && (
          <ErrorReporter
            error={error}
            appCode={app.code}
            appName={app.name}
            onFixRequest={handleFixError}
            onDismiss={handleDismissError}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={showHomeButton ? styles.homeButton : styles.closeButton} 
          onPress={showHomeButton ? onHome : onClose}
        >
          <Text style={styles.closeButtonText}>
            {showHomeButton ? '🏠' : '✕'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.title}>{app.name}</Text>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.appContent}>
        {DynamicComponent && (
          <ErrorBoundary
            onError={(error, errorInfo) => {
              setError(error);
              setShowErrorReporter(true);
            }}
          >
            <DynamicComponent />
          </ErrorBoundary>
        )}
      </View>

      {showErrorReporter && (
        <ErrorReporter
          error={error!}
          appCode={app.code}
          appName={app.name}
          onFixRequest={handleFixError}
          onDismiss={handleDismissError}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  homeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4757',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 