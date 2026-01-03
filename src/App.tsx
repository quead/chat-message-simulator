import { createEffect, createSignal, Show } from 'solid-js';
import { Toolbar } from './components/layout/Toolbar';
import { ChatHeader, ConversationView, MessageInput } from './components/chat';
import { ConversationBuilder, ParticipantManager } from './components/editor';
import { ExportPanel } from './components/export';
import { ChatLayout } from './layouts';
import { conversationStore, conversationActions, getLayoutConfig, getCurrentUser } from './store/conversationStore';
import { exportConversationAsPng, downloadImage } from './utils/export';
import type { LayoutType } from './types/layout';
import type { Message, Participant, ExportSettings } from './types';
import './App.css';

function App() {
  let chatPreviewRef: HTMLDivElement | undefined;
  
  const layoutConfig = () => getLayoutConfig();
  const theme = () => conversationStore.conversation.metadata.theme;
  const messages = () => conversationStore.conversation.messages;
  const participants = () => conversationStore.conversation.participants;
  const currentUser = () => getCurrentUser();
  const otherParticipant = () => participants().find(p => !p.isCurrentUser);
  
  // Use store state instead of local signals
  const activeTab = () => conversationStore.uiState.activeTab;
  const isExporting = () => conversationStore.uiState.isExporting;

  const handleLayoutChange = (layout: LayoutType) => {
    conversationActions.setLayout(layout);
  };

  const handleThemeToggle = () => {
    conversationActions.toggleTheme();
  };

  const handleExportClick = () => {
    conversationActions.setActiveTab('export');
  };
  
  const handleSave = () => {
    conversationActions.saveConversationToFile();
  };
  
  const handleLoad = async (file: File) => {
    try {
      await conversationActions.loadConversationFromFile(file);
      alert('Conversation loaded successfully!');
    } catch (error) {
      alert(`Failed to load conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleClear = () => {
    conversationActions.clearAllData();
  };
  
  const handleSaveToLocalStorage = () => {
    conversationActions.saveToLocalStorage();
    alert('Saved to LocalStorage!');
  };
  
  const handleZoomIn = () => {
    conversationActions.setZoomLevel(conversationStore.uiState.zoomLevel + 10);
  };
  
  const handleZoomOut = () => {
    conversationActions.setZoomLevel(conversationStore.uiState.zoomLevel - 10);
  };
  
  const handleResetZoom = () => {
    conversationActions.setZoomLevel(100);
  };
  
  const handleToggleChrome = () => {
    conversationActions.toggleChrome();
  };
  
  const handleToggleSidebar = () => {
    conversationActions.toggleSidebar();
  };

  const handleExport = async (settings: ExportSettings) => {
    if (!chatPreviewRef || isExporting()) return;
    
    conversationActions.setIsExporting(true);
    
    try {
      const result = await exportConversationAsPng({
        element: chatPreviewRef,
        settings,
        onProgress: (progress) => {
          console.log(`Export progress: ${progress}%`);
        },
      });
      
      if (result.success && result.dataUrl) {
        downloadImage(result.dataUrl, result.filename);
        // Show success notification (could add a toast notification here)
        console.log('Export successful!');
      } else {
        console.error('Export failed:', result.error);
        // Show error notification
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('An unexpected error occurred during export');
    } finally {
      conversationActions.setIsExporting(false);
    }
  };

  const handleSendMessage = (content: string) => {
    conversationActions.addMessage({
      senderId: currentUser()?.id || 'user-1',
      content,
      timestamp: new Date(),
      type: 'text',
      status: 'read',
      alignment: 'right',
    });
  };

  const handleAddMessage = (message: Omit<Message, 'id'>) => {
    conversationActions.addMessage(message);
  };

  const handleEditMessage = (id: string, updates: Partial<Message>) => {
    conversationActions.updateMessage(id, updates);
  };

  const handleDeleteMessage = (id: string) => {
    conversationActions.deleteMessage(id);
  };

  const handleDuplicateMessage = (id: string) => {
    const message = messages().find(m => m.id === id);
    if (message) {
      const { id: _, ...messageData } = message;
      conversationActions.addMessage({
        ...messageData,
        timestamp: new Date(),
      });
    }
  };

  const handleReorderMessages = (ids: string[]) => {
    conversationActions.reorderMessages(ids);
  };

  const handleAddParticipant = (participant: Omit<Participant, 'id'>) => {
    conversationActions.addParticipant(participant);
  };

  const handleUpdateParticipant = (id: string, updates: Partial<Participant>) => {
    conversationActions.updateParticipant(id, updates);
  };

  const handleDeleteParticipant = (id: string) => {
    conversationActions.deleteParticipant(id);
  };

  // Apply theme to document
  createEffect(() => {
    if (theme() === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  const participantList = () => participants().map(p => ({
    id: p.id,
    name: p.name,
    isCurrentUser: p.isCurrentUser ?? false,
  }));

  return (
    <div class="min-h-screen bg-background">
      <Toolbar 
        onLayoutChange={handleLayoutChange} 
        onThemeToggle={handleThemeToggle}
        onExportClick={handleExportClick}
        onSave={handleSave}
        onLoad={handleLoad}
        onClear={handleClear}
        onSaveToLocalStorage={handleSaveToLocalStorage}
        onToggleSidebar={handleToggleSidebar}
        theme={theme()}
      />
      
      <main class="h-[calc(100vh-3.5rem)] flex relative">
        {/* Editor Panel */}
        <Show when={conversationStore.uiState.isSidebarOpen}>
          <div class="w-full md:w-96 border-r bg-card overflow-y-auto flex-shrink-0">
            <div class="sticky top-0 bg-card border-b z-10">
              <div class="flex">
                <button
                  onClick={() => conversationActions.setActiveTab('messages')}
                  class="flex-1 px-4 py-3 font-medium transition-colors"
                classList={{
                  'bg-primary text-primary-foreground': activeTab() === 'messages',
                  'hover:bg-accent': activeTab() !== 'messages',
                }}
              >
                Messages
              </button>
              <button
                onClick={() => conversationActions.setActiveTab('participants')}
                class="flex-1 px-4 py-3 font-medium transition-colors"
                classList={{
                  'bg-primary text-primary-foreground': activeTab() === 'participants',
                  'hover:bg-accent': activeTab() !== 'participants',
                }}
              >
                Participants
              </button>
              <button
                onClick={() => conversationActions.setActiveTab('export')}
                class="flex-1 px-4 py-3 font-medium transition-colors"
                classList={{
                  'bg-primary text-primary-foreground': activeTab() === 'export',
                  'hover:bg-accent': activeTab() !== 'export',
                }}
              >
                Export
              </button>
            </div>
          </div>
          
          <div class="p-4">
            <Show when={activeTab() === 'messages'}>
              <ConversationBuilder
                messages={messages()}
                participants={participantList()}
                onAddMessage={handleAddMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onDuplicateMessage={handleDuplicateMessage}
                onReorderMessages={handleReorderMessages}
              />
            </Show>
            <Show when={activeTab() === 'participants'}>
              <ParticipantManager
                participants={participants()}
                onAddParticipant={handleAddParticipant}
                onUpdateParticipant={handleUpdateParticipant}
                onDeleteParticipant={handleDeleteParticipant}
              />
            </Show>
            <Show when={activeTab() === 'export'}>
              <ExportPanel
                onExport={handleExport}
                isExporting={isExporting()}
              />
            </Show>
          </div>
        </div>
        </Show>

        {/* Preview Panel */}
        <div class="flex-1 overflow-hidden bg-muted/20 relative flex flex-col">
          {/* Preview Controls */}
          <div class="absolute top-4 right-4 z-10 flex gap-2">
            <Show when={!conversationStore.uiState.isSidebarOpen}>
              <button
                onClick={handleToggleSidebar}
                class="px-3 py-2 bg-background border rounded-lg shadow-sm hover:bg-accent text-sm font-medium"
                title="Show sidebar"
              >
                Show Editor
              </button>
            </Show>
            <button
              onClick={handleToggleChrome}
              classList={{
                'px-3 py-2 bg-background border rounded-lg shadow-sm hover:bg-accent text-sm font-medium': true,
                'bg-primary text-primary-foreground': !conversationStore.uiState.showChrome,
              }}
              title="Toggle header and input visibility"
            >
              {conversationStore.uiState.showChrome ? 'Hide Chrome' : 'Show Chrome'}
            </button>
            <div class="flex gap-1 bg-background border rounded-lg shadow-sm">
              <button
                onClick={handleZoomOut}
                disabled={conversationStore.uiState.zoomLevel <= 50}
                class="px-3 py-2 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                -
              </button>
              <button
                onClick={handleResetZoom}
                class="px-3 py-2 hover:bg-accent min-w-[60px] text-sm font-medium"
                title="Reset zoom"
              >
                {conversationStore.uiState.zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={conversationStore.uiState.zoomLevel >= 200}
                class="px-3 py-2 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Chat Preview */}
          <div class="flex-1 overflow-auto flex items-center justify-center p-4">
            <div 
              ref={chatPreviewRef}
              class="w-full h-full transition-transform origin-center"
              style={{
                'max-width': '800px',
                'transform': `scale(${conversationStore.uiState.zoomLevel / 100})`,
              }}
            >
              <ChatLayout
                layout={layoutConfig()}
                theme={theme()}
              >
                <Show when={conversationStore.uiState.showChrome}>
                  <ChatHeader
                    participant={otherParticipant()}
                    layout={layoutConfig()}
                    theme={theme()}
                  />
                </Show>
                
                <ConversationView
                  messages={messages()}
                  participants={participants()}
                  layout={layoutConfig()}
                  theme={theme()}
                  showAvatars={conversationStore.conversation.metadata.showAvatars}
                  showTimestamps={conversationStore.conversation.metadata.showTimestamps}
                />
                
                <Show when={conversationStore.uiState.showChrome}>
                  <MessageInput
                    layout={layoutConfig()}
                    theme={theme()}
                    onSend={handleSendMessage}
                  />
                </Show>
              </ChatLayout>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
