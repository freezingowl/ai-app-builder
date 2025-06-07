export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  appId?: string;
}

export interface GeneratedApp {
  id: string;
  name: string;
  description: string;
  code: string;
  component: React.ComponentType<any>;
  createdAt: Date;
  updatedAt: Date;
  appEmoji?: string;
}

export interface ClaudeResponse {
  content: string;
  code: string;
  appName: string;
  appDescription: string;
  appEmoji?: string;
} 