import React from 'react';
import { 
  // Core Components
  View, 
  Text, 
  TextInput,
  ScrollView,
  FlatList,
  SectionList,
  VirtualizedList,
  SafeAreaView,
  KeyboardAvoidingView,
  
  // User Interface
  Button,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Pressable,
  Switch,
  
  // List Components
  RefreshControl,
  
  // iOS Components  
  ActionSheetIOS,
  
  // Android Components
  BackHandler,
  ToastAndroid,
  
  // Others
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  InteractionManager,
  Keyboard,
  LayoutAnimation,
  Linking,
  Modal,
  PanResponder,
  PixelRatio,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Vibration,
} from 'react-native';

class DynamicComponentLoader {
  private componentCache: Map<string, React.ComponentType<any>> = new Map();
  private lastError: {
    error: Error;
    code: string;
    componentId: string;
    timestamp: Date;
  } | null = null;

  async loadComponent(code: string, componentId: string): Promise<React.ComponentType<any>> {
    try {
      // Check cache first
      if (this.componentCache.has(componentId)) {
        return this.componentCache.get(componentId)!;
      }

      // Create a safe evaluation context
      const componentCode = this.prepareCodeForEvaluation(code);
      
      // Create the component function with comprehensive React Native API
      const componentFunction = new Function(
        // React
        'React',
        
        // Core Components
        'View',
        'Text', 
        'TextInput',
        'ScrollView',
        'FlatList',
        'SectionList',
        'VirtualizedList',
        'SafeAreaView',
        'KeyboardAvoidingView',
        
        // User Interface
        'Button',
        'TouchableOpacity',
        'TouchableHighlight',
        'TouchableWithoutFeedback',
        'Pressable',
        'Switch',
        
        // List Components
        'RefreshControl',
        
        // iOS Components
        'ActionSheetIOS',
        
        // Android Components
        'BackHandler',
        'ToastAndroid',
        
        // Others
        'ActivityIndicator',
        'Alert',
        'Animated',
        'AppState',
        'Dimensions',
        'Easing',
        'Image',
        'ImageBackground',
        'InteractionManager',
        'Keyboard',
        'LayoutAnimation',
        'Linking',
        'Modal',
        'PanResponder',
        'PixelRatio',
        'Platform',
        'Share',
        'StatusBar',
        'StyleSheet',
        'Vibration',
        
        // React Hooks
        'useState',
        'useEffect',
        'useRef',
        'useMemo',
        'useCallback',
        'useContext',
        'useReducer',
        'useLayoutEffect',
        'useImperativeHandle',
        'useDebugValue',
        
        componentCode
      );

      // Execute with comprehensive React Native imports
      const component = componentFunction(
        // React
        React,
        
        // Core Components
        View,
        Text,
        TextInput,
        ScrollView,
        FlatList,
        SectionList,
        VirtualizedList,
        SafeAreaView,
        KeyboardAvoidingView,
        
        // User Interface
        Button,
        TouchableOpacity,
        TouchableHighlight,
        TouchableWithoutFeedback,
        Pressable,
        Switch,
        
        // List Components
        RefreshControl,
        
        // iOS Components
        ActionSheetIOS,
        
        // Android Components
        BackHandler,
        ToastAndroid,
        
        // Others
        ActivityIndicator,
        Alert,
        Animated,
        AppState,
        Dimensions,
        Easing,
        Image,
        ImageBackground,
        InteractionManager,
        Keyboard,
        LayoutAnimation,
        Linking,
        Modal,
        PanResponder,
        PixelRatio,
        Platform,
        Share,
        StatusBar,
        StyleSheet,
        Vibration,
        
        // React Hooks
        React.useState,
        React.useEffect,
        React.useRef,
        React.useMemo,
        React.useCallback,
        React.useContext,
        React.useReducer,
        React.useLayoutEffect,
        React.useImperativeHandle,
        React.useDebugValue
      );

      // Validate component
      if (typeof component !== 'function') {
        throw new Error('Generated code did not return a valid React component');
      }

      // Cache the component
      this.componentCache.set(componentId, component);
      
      return component;
    } catch (error) {
      console.error('Component loading error:', error);
      // Store the error details for debugging
      this.lastError = {
        error: error as Error,
        code,
        componentId,
        timestamp: new Date(),
      };
      throw error; // Re-throw so the UI can handle it
    }
  }

  getLastError() {
    return this.lastError;
  }

  private prepareCodeForEvaluation(code: string): string {
    // Remove all import statements since we're providing them as parameters
    let processedCode = code.replace(/import[\s\S]*?from\s*['"][^'"]*['"];?\s*/g, '');
    
    // Remove any remaining import lines
    processedCode = processedCode.replace(/^import.*$/gm, '');
    
    // Clean up any leftover whitespace
    processedCode = processedCode.replace(/^\s*\n/gm, '');
    
    // Code should already be in React.createElement format from Claude
    
    // Remove export default and replace with return
    processedCode = processedCode.replace(/export\s+default\s+(\w+);?/, 'return $1;');
    
    // If there's no return statement, try to find the component name and return it
    if (!processedCode.includes('return ')) {
      const componentMatch = processedCode.match(/const\s+(\w+)\s*=/);
      if (componentMatch) {
        processedCode += `\nreturn ${componentMatch[1]};`;
      }
    }

    return processedCode;
  }



  private createErrorComponent(error: Error): React.ComponentType<any> {
    return () => (
      React.createElement(View, {
        style: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          backgroundColor: '#ffebee'
        }
      }, [
        React.createElement(Text, {
          key: 'title',
          style: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#c62828',
            marginBottom: 10
          }
        }, 'Component Error'),
        React.createElement(Text, {
          key: 'message',
          style: {
            fontSize: 14,
            color: '#c62828',
            textAlign: 'center'
          }
        }, error.message)
      ])
    );
  }

  clearCache() {
    this.componentCache.clear();
  }
}

export const dynamicComponentLoader = new DynamicComponentLoader(); 