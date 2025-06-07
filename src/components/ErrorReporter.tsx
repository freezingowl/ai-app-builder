import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

interface ErrorReporterProps {
  error: Error | string;
  appCode?: string;
  appName?: string;
  onFixRequest: (errorDetails: string) => void;
  onDismiss: () => void;
}

export const ErrorReporter: React.FC<ErrorReporterProps> = ({
  error,
  appCode,
  appName,
  onFixRequest,
  onDismiss,
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  const handleFixRequest = () => {
    const errorDetails = `There's an error in the ${appName || 'generated app'}:

ERROR: ${errorMessage}

ORIGINAL CODE:
\`\`\`tsx
${appCode || 'Code not available'}
\`\`\`

Please fix this error and provide the corrected code.`;

    onFixRequest(errorDetails);
  };

  const getErrorSuggestion = () => {
    if (errorMessage.includes('JSX')) {
      return 'This looks like a JSX syntax error. The AI can fix the React Native component syntax.';
    }
    if (errorMessage.includes('undefined')) {
      return 'This appears to be a variable or function that\'s not defined. The AI can fix missing imports or declarations.';
    }
    if (errorMessage.includes('Cannot read property')) {
      return 'This looks like an object property error. The AI can add proper null checks and fix the logic.';
    }
    return 'The AI can analyze and fix this error for you.';
  };

  return (
    <View style={styles.container}>
      <View style={styles.errorCard}>
        <Text style={styles.title}>🐛 Oops! Something went wrong</Text>
        
        <Text style={styles.suggestion}>{getErrorSuggestion()}</Text>
        
        <ScrollView style={styles.errorContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.errorLabel}>Error Details:</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.fixButton} 
            onPress={handleFixRequest}
          >
            <Text style={styles.fixButtonText}>🤖 Ask AI to Fix This</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dismissButton} 
            onPress={onDismiss}
          >
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4757',
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    maxHeight: 200,
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
  },
  fixButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  fixButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
}); 