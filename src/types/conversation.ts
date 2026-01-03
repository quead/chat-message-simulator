import type { Message } from './message';
import type { LayoutType } from './layout';

export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'typing';

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  avatarColor?: string; // Fallback color if no avatar
  status?: UserStatus;
  lastSeen?: Date;
  phoneNumber?: string;
  email?: string;
  
  // For display customization
  isCurrentUser?: boolean;
  color?: string; // Custom color for this participant's messages
}

export interface ConversationMetadata {
  title?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  layout: LayoutType;
  theme: 'light' | 'dark';
  
  // Chat-specific settings
  showTimestamps?: boolean;
  showAvatars?: boolean;
  showReadReceipts?: boolean;
  groupChat?: boolean;
  
  // Background customization
  backgroundImage?: string;
  backgroundColor?: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  participants: Participant[];
  metadata: ConversationMetadata;
}

export interface ConversationDraft {
  conversation: Conversation;
  lastSaved?: Date;
  autoSave?: boolean;
}
