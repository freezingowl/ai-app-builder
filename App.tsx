import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ChatInterface } from './src/components/ChatInterface';
import { AppContainer } from './src/components/AppContainer';
import { AppGallery } from './src/components/AppGallery';
import { ChatMessage, GeneratedApp } from './src/types';
import { claudeService } from './src/services/claudeApi';
import { SavedApp, appStorage } from './src/services/appStorage';
import 'react-native-get-random-values';

type Screen = 'gallery' | 'chat' | 'app';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('gallery');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [generatedApps, setGeneratedApps] = useState<GeneratedApp[]>([]);
  const [currentApp, setCurrentApp] = useState<GeneratedApp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const storedApiKey = await SecureStore.getItemAsync('claude_api_key');
      if (storedApiKey) {
        claudeService.initialize(storedApiKey);
      } else {
        setShowApiKeyModal(true);
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setShowApiKeyModal(true);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Error', 'Please enter your Claude API key');
      return;
    }

    try {
      await SecureStore.setItemAsync('claude_api_key', apiKeyInput.trim());
      claudeService.initialize(apiKeyInput.trim());
      setShowApiKeyModal(false);
      setApiKeyInput('');
      Alert.alert('Success', 'API key saved successfully!');
    } catch (error) {
      console.error('Failed to save API key:', error);
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Check if this is an error fixing request
      const isFixing = content.includes('ERROR:') || content.includes('There\'s an error');
      
      console.log('Sending to Claude:', content, 'isFixing:', isFixing);
      
      // Generate app with Claude
      const response = await claudeService.generateApp(content, [], isFixing);
      
      console.log('Claude response:', response);
      
      // Add Claude's response to chat
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // If code was generated, trigger app creation (only once)
      if (response.code && response.appName) {
        console.log('Generating app with code:', response.code.substring(0, 100) + '...');
        await handleGenerateApp(
          response.code, 
          response.appName, 
          response.appDescription || 'Generated App',
          response.appEmoji
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateApp = async (code: string, name: string, description: string, emoji?: string) => {
    try {
      const appId = generateMessageId();
      
      const newApp: GeneratedApp = {
        id: appId,
        name,
        description,
        code,
        component: () => null, // Will be loaded dynamically
        createdAt: new Date(),
        updatedAt: new Date(),
        appEmoji: emoji,
      };

      setGeneratedApps(prev => [...prev, newApp]);
      
      // Save the app to persistent storage
      await appStorage.saveApp(newApp);
      
      // Show app and offer preview
      setTimeout(() => {
        Alert.alert(
          'App Created & Saved!',
          `"${name}" is now in your app gallery. Would you like to preview it now?`,
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Preview', 
              onPress: () => {
                setCurrentApp(newApp);
                setCurrentScreen('app');
              }
            },
          ]
        );
      }, 500);

    } catch (error) {
      console.error('Failed to generate app:', error);
      Alert.alert('Error', 'Failed to create the app');
    }
  };

  const handleCloseApp = () => {
    setCurrentApp(null);
    setCurrentScreen('gallery');
  };

  const handleEditApp = () => {
    // Clear previous messages and add editing prompt for fresh editing session
    const editMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `I'm ready to help you modify "${currentApp?.name}". What changes would you like to make?`,
      timestamp: new Date(),
    };
    setMessages([editMessage]); // Start fresh with just the editing prompt
    
    setCurrentApp(null);
    setCurrentScreen('chat');
  };

  const handleRunSavedApp = (savedApp: SavedApp) => {
    // Convert SavedApp to GeneratedApp for compatibility
    const generatedApp: GeneratedApp = {
      id: savedApp.id,
      name: savedApp.name,
      description: savedApp.description,
      code: savedApp.code,
      component: () => null,
      createdAt: new Date(savedApp.createdAt),
      updatedAt: new Date(savedApp.createdAt),
      appEmoji: savedApp.appEmoji,
    };
    
    setCurrentApp(generatedApp);
    setCurrentScreen('app');
  };

  const handleCreateNew = () => {
    // Clear previous chat messages for a fresh start
    setMessages([]);
    setCurrentScreen('chat');
  };

  const handleHomeFromApp = () => {
    setCurrentApp(null);
    setCurrentScreen('gallery');
  };

  const handleFixError = async (errorDetails: string) => {
    // Switch to chat screen to show the fixing process
    setCurrentApp(null);
    setCurrentScreen('chat');
    
    // Add the error message to chat first
    const errorMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: errorDetails,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, errorMessage]);
    
    // Now actually send it to Claude and process the response
    setIsLoading(true);
    
    try {
      console.log('Sending error fix request to Claude:', errorDetails);
      
      // Generate app with Claude (in fixing mode)
      const response = await claudeService.generateApp(errorDetails, [], true);
      
      console.log('Claude fix response:', response);
      
      // Add Claude's response to chat
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // If code was generated, trigger app creation
      if (response.code && response.appName) {
        console.log('Generating fixed app with code:', response.code.substring(0, 100) + '...');
        await handleGenerateApp(response.code, response.appName, response.appDescription || 'Fixed App');
      }
    } catch (error) {
      console.error('Error fixing failed:', error);
      
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while trying to fix the code. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const ApiKeyModal = () => (
    <Modal visible={showApiKeyModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Setup Claude API</Text>
          <Text style={styles.modalDescription}>
            Enter your Claude API key to start building apps. You can get one from console.anthropic.com
          </Text>
          
          <TextInput
            style={styles.apiKeyInput}
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            placeholder="sk-ant-api03-..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveApiKey}>
            <Text style={styles.saveButtonText}>Save & Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Screen rendering logic
  const renderScreen = () => {
    switch (currentScreen) {
      case 'gallery':
        return (
          <AppGallery
            onRunApp={handleRunSavedApp}
            onCreateNew={handleCreateNew}
          />
        );
      
      case 'chat':
        return (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onGenerateApp={handleGenerateApp}
            isLoading={isLoading}
            onHome={() => {
              setMessages([]); // Clear chat when going home
              setCurrentScreen('gallery');
            }}
          />
        );
      
      case 'app':
        return currentApp ? (
          <AppContainer 
            app={currentApp}
            onClose={handleCloseApp}
            onEdit={handleEditApp}
            onFixError={handleFixError}
            showHomeButton={true}
            onHome={handleHomeFromApp}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {renderScreen()}
      
      <ApiKeyModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  apiKeyInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
