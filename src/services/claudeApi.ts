import Anthropic from '@anthropic-ai/sdk';
import { ClaudeResponse } from '../types';

class ClaudeService {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;

  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async generateApp(userMessage: string, conversationHistory: string[] = [], isFixing: boolean = false): Promise<ClaudeResponse> {
    if (!this.client) {
      throw new Error('Claude API not initialized');
    }

    const basePrompt = `You are an expert React Native developer that generates complete, working React Native components based on user requests. 

Your task is to generate a single React Native functional component that can be directly rendered in an Expo app.

CRITICAL: Use React.createElement() instead of JSX syntax, as the code will be evaluated dynamically.

CRITICAL: You MUST start your response with this exact format:
[EMOJI] [APP NAME] - [DESCRIPTION]

Examples:
🧮 Calculator Pro - A simple calculator with basic math operations
📝 Note Taker - A note-taking app with save functionality  
🎯 Todo List - A task management app with checkboxes
🏃‍♀️ Fitness Tracker - Track workouts and exercise routines
🎵 Music Player - Play and organize your music library

REQUIREMENTS:
- Start with ONE emoji (🧮, 📝, 🎯, etc.)
- Follow with SHORT app name (2-3 words max)
- Add " - " then brief description
- This MUST be your first line before any code

Guidelines:
1. Always create a complete, self-contained functional component
2. You have access to the FULL React Native API including:
   - Core: View, Text, TextInput, ScrollView, FlatList, SectionList, SafeAreaView, KeyboardAvoidingView
   - UI: Button, TouchableOpacity, TouchableHighlight, Pressable, Switch (Note: Slider, AsyncStorage, Clipboard are NOT available)
   - Media: Image, ImageBackground
   - Navigation: Modal
   - Animation: Animated (Value, timing, spring, etc.)
   - Platform: Platform, Dimensions, StatusBar
   - Device: Vibration, Share, Linking
   - And many more React Native components and APIs
3. Do NOT include import statements - all components are provided as parameters
4. Use ALL React hooks: useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer, etc.
5. Make the component visually appealing with proper styling and animations  
6. The component should be fully functional and feature-rich
7. IMPORTANT: Keep the initial version focused and not overly complex to avoid response truncation
8. Export the component as default
9. Use React.createElement() syntax instead of JSX
10. Feel free to use complex animations, gestures, and advanced React Native features
11. Create production-quality apps with rich user experiences
12. **CRITICAL: DO NOT use async/await functions - use .then() promises instead**
13. **AVOID deprecated components: Slider, AsyncStorage, Clipboard, AlertIOS, DatePickerIOS, etc.**

Example structure:
\`\`\`tsx
const MyComponent = () => {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);
  
  // CORRECT: Use .then() instead of async/await
  const fetchData = () => {
    fetch('https://api.example.com/data')
      .then(response => response.json())
      .then(result => setData(result))
      .catch(error => console.error(error));
  };
  
  // WRONG: Don't use async/await
  // const fetchData = async () => {
  //   const response = await fetch('https://api.example.com/data');
  //   const result = await response.json();
  //   setData(result);
  // };
  
  return React.createElement(View, { style: styles.container },
    React.createElement(Text, { style: styles.title }, 'Hello World'),
    React.createElement(TouchableOpacity, { 
      style: styles.button,
      onPress: () => setCount(count + 1)
    }, React.createElement(Text, null, 'Press me'))
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  button: { padding: 10, backgroundColor: '#007AFF' }
});

export default MyComponent;
\`\`\`

Format your response as:
1. A brief description of what the app does
2. The complete React Native component code wrapped in \`\`\`tsx code blocks
3. Any usage notes if needed`;

    const fixingPrompt = `You are an expert React Native developer fixing broken code. The user has provided you with code that has errors.

CRITICAL: Use React.createElement() instead of JSX syntax, as the code will be evaluated dynamically.

Your task is to:
1. Analyze the error message carefully
2. Fix the broken code while maintaining the original functionality
3. Convert JSX to React.createElement() calls if present
4. Convert async/await functions to .then() promises if present
5. Remove any deprecated components (Slider, AsyncStorage, Clipboard, etc.)
6. Return the complete corrected component

CRITICAL: Always respond with a brief explanation followed by the complete fixed code in a tsx code block.

Format your response exactly like this:
[EMOJI] [APP NAME] - I've fixed the [error type] in your code. Here's the corrected version:

Example: "🧮 Calculator Pro - I've fixed the syntax error in your code. Here's the corrected version:"

\`\`\`tsx
[Complete fixed React Native component code using React.createElement()]
\`\`\`

Make sure to:
- Fix syntax errors (especially JSX parsing issues)
- Convert all JSX to React.createElement() calls
- Convert async/await functions to .then() promises
- Do NOT include import statements - components are provided as parameters
- Fix undefined variables  
- Ensure proper React component structure
- Maintain the original app functionality
- Export the component as default
- Use React.createElement() syntax throughout
- Use the FULL React Native API - all components and APIs are available
- Use ALL React hooks available in React
- **AVOID deprecated components: Slider, AsyncStorage, Clipboard, AlertIOS, DatePickerIOS, etc.**`;

    const systemPrompt = isFixing ? fixingPrompt : basePrompt;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      
      console.log('Response length:', content.length);
      console.log('Response ends with:', content.slice(-100));
      console.log('Contains closing ```:', content.includes('```', content.indexOf('```tsx') + 6));
      
      // Check if response was truncated
      const hasOpeningCodeBlock = content.includes('```tsx') || content.includes('```');
      const hasClosingCodeBlock = content.lastIndexOf('```') > content.indexOf('```tsx');
      
      if (hasOpeningCodeBlock && !hasClosingCodeBlock) {
        console.warn('⚠️  Claude response appears to be truncated - missing closing ```');
        console.warn('Response length:', content.length, 'characters');
        console.warn('Consider increasing max_tokens');
      }
      
      // Extract code from the response - try multiple patterns
      let codeMatch = content.match(/```tsx\n([\s\S]*?)\n```/);
      if (!codeMatch) {
        codeMatch = content.match(/```(?:tsx|javascript|js)?\n([\s\S]*?)\n```/);
      }
      if (!codeMatch && hasOpeningCodeBlock) {
        // If we have opening but no closing, extract everything after the opening
        const openMatch = content.match(/```(?:tsx|javascript|js)?\n([\s\S]*)/);
        if (openMatch) {
          console.log('Extracting truncated code block');
          codeMatch = openMatch;
        }
      }
      
      const code = codeMatch ? codeMatch[1] : '';
      console.log('Extracted code length:', code.length);
      console.log('Code starts with:', code.substring(0, 100) + '...');
      console.log('Code ends with:', code.slice(-100));
      
      // Extract app name, emoji, and description from response
      const lines = content.split('\n');
      let firstLine = lines[0] || 'Generated App';
      
      // Sometimes the first line might be empty, look for the first non-empty line
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        if (lines[i].trim() && !lines[i].startsWith('```')) {
          firstLine = lines[i].trim();
          break;
        }
      }
      
      console.log('Full Claude response:', content);
      console.log('Using first line for parsing:', firstLine);
      
      const { emoji, name, description } = this.parseAppInfo(firstLine);
      
      return {
        content,
        code,
        appName: name,
        appDescription: description,
        appEmoji: emoji,
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error('Failed to generate app');
    }
  }

  private extractAppName(code: string): string | null {
    const match = code.match(/const\s+(\w+)\s*=/);
    return match ? match[1] : null;
  }

  private parseAppInfo(firstLine: string): { emoji: string; name: string; description: string } {
    console.log('Parsing first line:', firstLine);
    
    // More flexible regex patterns to match different formats
    // Pattern 1: "🧮 Calculator Pro - A simple calculator"
    let match = firstLine.match(/^(.+?)\s*-\s*(.+)$/);
    
    if (match) {
      const [, beforeDash, afterDash] = match;
      console.log('Matched with dash:', { beforeDash, afterDash });
      
             // Extract emoji from the before-dash part (including compound emojis like 🏋️)
       const emojiMatch = beforeDash.match(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F7E0}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])[\u{FE0F}\u{200D}]*/u);
       const emoji = emojiMatch ? emojiMatch[0] : '📱'; // Use [0] to get the full match including modifiers
       
       // Extract name (everything after removing the full emoji including modifiers)
       const nameWithoutEmoji = beforeDash.replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F7E0}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])[\u{FE0F}\u{200D}]*/u, '').trim();
      const name = nameWithoutEmoji || 'Generated App';
      
      const result = {
        emoji,
        name,
        description: afterDash.trim() || 'A generated app'
      };
      
      console.log('Parsed result:', result);
      return result;
    }
    
         // Fallback: just extract emoji and use rest as name
     const emojiMatch = firstLine.match(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F7E0}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])[\u{FE0F}\u{200D}]*/u);
     const emoji = emojiMatch ? emojiMatch[0] : '📱';
     
     // Remove emoji and use rest as name
     const nameWithoutEmoji = firstLine.replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F7E0}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])[\u{FE0F}\u{200D}]*/u, '').trim();
    const name = nameWithoutEmoji || 'Rep Counter';
    
    const fallbackResult = {
      emoji,
      name,
      description: 'A generated app'
    };
    
    console.log('Fallback result:', fallbackResult);
    return fallbackResult;
  }
}

export const claudeService = new ClaudeService(); 