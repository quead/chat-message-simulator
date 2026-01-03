export type LayoutType = 'whatsapp' | 'imessage' | 'messenger' | 'telegram' | 'discord' | 'slack';

export type BubbleStyle = 'rounded' | 'sharp' | 'minimal' | 'rounded-tail';

export type HeaderStyle = 'compact' | 'full' | 'minimal';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Background colors
  background: string;
  chatBackground: string;
  
  // Message bubble colors
  sentBubble: string;
  receivedBubble: string;
  
  // Text colors
  sentText: string;
  receivedText: string;
  timestamp: string;
  
  // UI colors
  primary: string;
  secondary: string;
  border: string;
  
  // Header colors
  headerBackground: string;
  headerText: string;
  
  // Input colors
  inputBackground: string;
  inputText: string;
  inputBorder: string;
}

export interface LayoutConfig {
  id: LayoutType;
  name: string;
  description: string;
  icon?: string;
  
  // Styling configuration
  bubbleStyle: BubbleStyle;
  headerStyle: HeaderStyle;
  fontFamily: string;
  
  // Theme colors (light and dark variants)
  lightColors: ThemeColors;
  darkColors: ThemeColors;
  
  // Spacing and dimensions
  bubbleMaxWidth: string;
  bubblePadding: string;
  bubbleMargin: string;
  borderRadius: string;
  
  // Features support
  supportsReactions: boolean;
  supportsReplies: boolean;
  supportsReadReceipts: boolean;
  supportsTypingIndicator: boolean;
}

