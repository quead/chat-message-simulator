import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { Phone, Video, Info, ArrowLeft, MoreVertical } from 'lucide-solid';
import type { Participant, LayoutConfig } from '../../types';
import { cn } from '../../lib/utils';

interface ChatHeaderProps {
  participant?: Participant;
  layout: LayoutConfig;
  theme: 'light' | 'dark';
  groupChat?: boolean;
  groupName?: string;
  onBack?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onInfo?: () => void;
}

export const ChatHeader: Component<ChatHeaderProps> = (props) => {
  const colors = () => props.theme === 'light' ? props.layout.lightColors : props.layout.darkColors;
  
  const displayName = () => {
    if (props.groupChat && props.groupName) return props.groupName;
    return props.participant?.name || 'Unknown';
  };
  
  const headerStyles = () => ({
    'background-color': colors().headerBackground,
    'color': colors().headerText,
  });
  
  return (
    <div
      class={cn(
        'flex items-center gap-3 px-4 border-b',
        props.layout.headerStyle === 'full' ? 'py-3' : 'py-2',
        props.layout.headerStyle === 'compact' ? 'h-12' : 'h-16'
      )}
      style={{
        ...headerStyles(),
        'border-color': colors().border,
      }}
    >
      {/* Back Button */}
      <Show when={props.onBack}>
        <button
          onClick={props.onBack}
          class="p-1 hover:bg-black/10 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      </Show>
      
      {/* Avatar */}
      <div class="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden">
        <Show
          when={props.participant?.avatar}
          fallback={
            <div 
              class="w-full h-full flex items-center justify-center text-white font-medium"
              style={{ 
                'background-color': props.participant?.avatarColor || '#6B7280' 
              }}
            >
              {displayName().charAt(0).toUpperCase()}
            </div>
          }
        >
          <img 
            src={props.participant?.avatar} 
            alt={displayName()} 
            class="w-full h-full object-cover" 
          />
        </Show>
      </div>
      
      {/* Name and Status */}
      <div class="flex-1 min-w-0">
        <h2 class="font-semibold text-base truncate">
          {displayName()}
        </h2>
        
        {/* Status */}
        <Show when={props.participant?.status}>
          <p class="text-xs opacity-75">
            <Show when={props.participant?.status === 'online'}>
              <span class="text-green-500">● </span>
              Online
            </Show>
            <Show when={props.participant?.status === 'typing'}>
              <span class="italic">typing...</span>
            </Show>
            <Show when={props.participant?.status === 'offline'}>
              <Show when={props.participant?.lastSeen}>
                Last seen {new Date(props.participant!.lastSeen!).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Show>
            </Show>
            <Show when={props.participant?.status === 'away'}>
              Away
            </Show>
            <Show when={props.participant?.status === 'busy'}>
              Busy
            </Show>
          </p>
        </Show>
      </div>
      
      {/* Action Buttons */}
      <div class="flex items-center gap-2">
        <Show when={props.onVideoCall}>
          <button
            onClick={props.onVideoCall}
            class="p-2 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Video call"
          >
            <Video size={20} />
          </button>
        </Show>
        
        <Show when={props.onCall}>
          <button
            onClick={props.onCall}
            class="p-2 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Voice call"
          >
            <Phone size={20} />
          </button>
        </Show>
        
        <Show when={props.onInfo}>
          <button
            onClick={props.onInfo}
            class="p-2 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Contact info"
          >
            <Show when={props.layout.headerStyle === 'full'} fallback={<MoreVertical size={20} />}>
              <Info size={20} />
            </Show>
          </button>
        </Show>
      </div>
    </div>
  );
};
