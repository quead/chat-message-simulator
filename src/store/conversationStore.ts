import { createStore } from 'solid-js/store';
import { createEffect } from 'solid-js';
import type { 
  Conversation, 
  Message, 
  Participant, 
  LayoutType,
  ConversationMetadata,
  ExportSettings
} from '../types';
import { AVAILABLE_LAYOUTS, DEFAULT_LAYOUT } from '../constants/layouts';

// UI State interface
interface UIState {
  activeTab: 'messages' | 'participants' | 'export';
  isExporting: boolean;
  isSidebarOpen: boolean;
  exportPanelOpen: boolean;
  zoomLevel: number;
  showChrome: boolean;
}

// Default UI state
const createDefaultUIState = (): UIState => ({
  activeTab: 'messages',
  isExporting: false,
  isSidebarOpen: true,
  exportPanelOpen: false,
  zoomLevel: 100,
  showChrome: true,
});

// Default export settings
const createDefaultExportSettings = (): ExportSettings => ({
  width: 393,
  height: 852,
  quality: 2,
  format: 'png',
  backgroundColor: '#ffffff',
  devicePreset: 'iPhone 14 Pro',
});

// Initialize default conversation
const createDefaultConversation = (): Conversation => ({
  id: crypto.randomUUID(),
  messages: [],
  participants: [
    {
      id: 'user-1',
      name: 'You',
      isCurrentUser: true,
      avatarColor: '#0084FF',
      status: 'online',
    },
    {
      id: 'user-2',
      name: 'Contact',
      avatarColor: '#25D366',
      status: 'online',
    },
  ],
  metadata: {
    title: 'New Conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
    layout: DEFAULT_LAYOUT,
    theme: 'light',
    showTimestamps: true,
    showAvatars: true,
    showReadReceipts: true,
    groupChat: false,
  },
});

// Create store
const [conversationStore, setConversationStore] = createStore({
  conversation: createDefaultConversation(),
  uiState: createDefaultUIState(),
  exportSettings: createDefaultExportSettings(),
  autoSave: true,
});

// Storage key
const STORAGE_KEY = 'chat-simulator-conversation';

// Load from localStorage
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Convert date strings back to Date objects
      data.metadata.createdAt = new Date(data.metadata.createdAt);
      data.metadata.updatedAt = new Date(data.metadata.updatedAt);
      data.messages = data.messages.map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
        deletedAt: msg.deletedAt ? new Date(msg.deletedAt) : undefined,
      }));
      data.participants = data.participants.map((p: Participant) => ({
        ...p,
        lastSeen: p.lastSeen ? new Date(p.lastSeen) : undefined,
      }));
      setConversationStore('conversation', data);
    }
  } catch (error) {
    console.error('Failed to load conversation from storage:', error);
  }
};

// Save to localStorage
const saveToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationStore.conversation));
  } catch (error) {
    console.error('Failed to save conversation to storage:', error);
  }
};

// Auto-save effect - tracks changes to the conversation object
createEffect(() => {
  // Access the conversation object to track it
  const conv = conversationStore.conversation;
  // Trigger save only if autoSave is enabled
  if (conversationStore.autoSave) {
    // Small delay to batch multiple rapid changes
    setTimeout(() => {
      saveToStorage();
    }, 100);
  }
});

// Load on initialization
loadFromStorage();

// Store actions
export const conversationActions = {
  // Messages
  addMessage: (message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
    };
    setConversationStore('conversation', 'messages', (messages) => [...messages, newMessage]);
    setConversationStore('conversation', 'metadata', 'updatedAt', new Date());
  },

  updateMessage: (id: string, updates: Partial<Message>) => {
    setConversationStore(
      'conversation',
      'messages',
      (msg) => msg.id === id,
      (msg) => ({ ...msg, ...updates })
    );
    setConversationStore('conversation', 'metadata', 'updatedAt', new Date());
  },

  deleteMessage: (id: string) => {
    setConversationStore(
      'conversation',
      'messages',
      (messages) => messages.filter((msg) => msg.id !== id)
    );
    setConversationStore('conversation', 'metadata', 'updatedAt', new Date());
  },
  
  reorderMessages: (ids: string[]) => {
    setConversationStore('conversation', 'messages', (msgs) => {
      const messageMap = new Map(msgs.map(m => [m.id, m]));
      return ids.map(id => messageMap.get(id)!).filter(Boolean);
    });
    setConversationStore('conversation', 'metadata', 'updatedAt', new Date());
  },

  clearMessages: () => {
    setConversationStore('conversation', 'messages', []);
    setConversationStore('conversation', 'metadata', 'updatedAt', new Date());
  },

  // Participants
  addParticipant: (participant: Omit<Participant, 'id'>) => {
    const newParticipant: Participant = {
      ...participant,
      id: crypto.randomUUID(),
    };
    setConversationStore('conversation', 'participants', (participants) => [
      ...participants,
      newParticipant,
    ]);
  },

  updateParticipant: (id: string, updates: Partial<Participant>) => {
    setConversationStore(
      'conversation',
      'participants',
      (p) => p.id === id,
      (p) => ({ ...p, ...updates })
    );
  },

  deleteParticipant: (id: string) => {
    setConversationStore(
      'conversation',
      'participants',
      (participants) => participants.filter((p) => p.id !== id)
    );
  },

  // Layout & Theme
  setLayout: (layout: LayoutType) => {
    setConversationStore('conversation', 'metadata', 'layout', layout);
  },

  setTheme: (theme: 'light' | 'dark') => {
    setConversationStore('conversation', 'metadata', 'theme', theme);
  },

  toggleTheme: () => {
    setConversationStore(
      'conversation',
      'metadata',
      'theme',
      (theme) => (theme === 'light' ? 'dark' : 'light')
    );
  },

  // Metadata
  updateMetadata: (updates: Partial<ConversationMetadata>) => {
    setConversationStore('conversation', 'metadata', (metadata) => ({
      ...metadata,
      ...updates,
      updatedAt: new Date(),
    }));
  },

  // Storage
  resetConversation: () => {
    setConversationStore('conversation', createDefaultConversation());
    localStorage.removeItem(STORAGE_KEY);
  },

  loadConversation: (conversation: Conversation) => {
    setConversationStore('conversation', conversation);
  },

  toggleAutoSave: () => {
    setConversationStore('autoSave', (auto) => !auto);
  },

  // UI State
  setActiveTab: (tab: 'messages' | 'participants' | 'export') => {
    setConversationStore('uiState', 'activeTab', tab);
  },

  setIsExporting: (isExporting: boolean) => {
    setConversationStore('uiState', 'isExporting', isExporting);
  },

  toggleSidebar: () => {
    setConversationStore('uiState', 'isSidebarOpen', (open) => !open);
  },

  toggleExportPanel: () => {
    setConversationStore('uiState', 'exportPanelOpen', (open) => !open);
  },  
  setZoomLevel: (level: number) => {
    const clampedLevel = Math.max(50, Math.min(200, level));
    setConversationStore('uiState', 'zoomLevel', clampedLevel);
  },
  
  toggleChrome: () => {
    setConversationStore('uiState', 'showChrome', (prev) => !prev);
  },
  // Export Settings
  updateExportSettings: (updates: Partial<ExportSettings>) => {
    setConversationStore('exportSettings', (settings) => ({
      ...settings,
      ...updates,
    }));
  },

  resetExportSettings: () => {
    setConversationStore('exportSettings', createDefaultExportSettings());
  },

  // Conversation Management
  saveConversationToFile: () => {
    const data = JSON.stringify(conversationStore.conversation, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation-${conversationStore.conversation.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  loadConversationFromFile: async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Convert date strings back to Date objects
      data.metadata.createdAt = new Date(data.metadata.createdAt);
      data.metadata.updatedAt = new Date(data.metadata.updatedAt);
      data.messages = data.messages.map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
        deletedAt: msg.deletedAt ? new Date(msg.deletedAt) : undefined,
      }));
      data.participants = data.participants.map((p: Participant) => ({
        ...p,
        lastSeen: p.lastSeen ? new Date(p.lastSeen) : undefined,
      }));
      
      setConversationStore('conversation', data);
      return { success: true };
    } catch (error) {
      console.error('Failed to load conversation from file:', error);
      return { success: false, error: 'Invalid conversation file' };
    }
  },

  clearAllData: () => {
    setConversationStore('conversation', createDefaultConversation());
    setConversationStore('uiState', createDefaultUIState());
    setConversationStore('exportSettings', createDefaultExportSettings());
    localStorage.removeItem(STORAGE_KEY);
  },

  saveToLocalStorage: () => {
    saveToStorage();
  },
};

// Computed values
export const getLayoutConfig = () => {
  const layout = conversationStore.conversation.metadata.layout;
  return AVAILABLE_LAYOUTS.find((l) => l.id === layout) || AVAILABLE_LAYOUTS[0];
};

export const getCurrentUser = () => {
  return conversationStore.conversation.participants.find((p) => p.isCurrentUser);
};

export { conversationStore };
