import * as SecureStore from 'expo-secure-store';
import { GeneratedApp } from '../types';

export interface SavedApp extends GeneratedApp {
  id: string;
  createdAt: string;
  lastOpenedAt?: string;
  appEmoji?: string;
}

class AppStorageService {
  private static readonly APPS_KEY = 'savedApps';

  async saveApp(app: GeneratedApp): Promise<SavedApp> {
    const savedApp: SavedApp = {
      ...app,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const existingApps = await this.getAllApps();
    const updatedApps = [...existingApps, savedApp];
    
    await SecureStore.setItemAsync(AppStorageService.APPS_KEY, JSON.stringify(updatedApps));
    console.log('App saved successfully:', savedApp.name);
    
    return savedApp;
  }

  async getAllApps(): Promise<SavedApp[]> {
    try {
      const appsJson = await SecureStore.getItemAsync(AppStorageService.APPS_KEY);
      if (!appsJson) return [];
      
      const apps: SavedApp[] = JSON.parse(appsJson);
      return apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error loading saved apps:', error);
      return [];
    }
  }

  async deleteApp(appId: string): Promise<void> {
    const existingApps = await this.getAllApps();
    const filteredApps = existingApps.filter(app => app.id !== appId);
    
    await SecureStore.setItemAsync(AppStorageService.APPS_KEY, JSON.stringify(filteredApps));
    console.log('App deleted:', appId);
  }

  async updateLastOpened(appId: string): Promise<void> {
    const existingApps = await this.getAllApps();
    const updatedApps = existingApps.map(app => 
      app.id === appId 
        ? { ...app, lastOpenedAt: new Date().toISOString() }
        : app
    );
    
    await SecureStore.setItemAsync(AppStorageService.APPS_KEY, JSON.stringify(updatedApps));
  }

  async clearAllApps(): Promise<void> {
    await SecureStore.deleteItemAsync(AppStorageService.APPS_KEY);
    console.log('All apps cleared');
  }
}

export const appStorage = new AppStorageService(); 