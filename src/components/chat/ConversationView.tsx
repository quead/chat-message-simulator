import type { Component } from 'solid-js';
import { For, Show, createMemo } from 'solid-js';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { MessageBubble } from './MessageBubble';
import type { Message, Participant, LayoutConfig } from '../../types';
import { cn } from '../../lib/utils';

interface ConversationViewProps {
  messages: Message[];
  participants: Participant[];
  layout: LayoutConfig;
  theme: 'light' | 'dark';
  showAvatars?: boolean;
  showTimestamps?: boolean;
  backgroundImage?: string;
  backgroundColor?: string;
}

export const ConversationView: Component<ConversationViewProps> = (props) => {
  const colors = () => props.theme === 'light' ? props.layout.lightColors : props.layout.darkColors;
  
  // Group messages by date for date separators
  const messagesWithDates = createMemo(() => {
    const grouped: Array<{ date?: Date; message?: Message; isDateSeparator?: boolean }> = [];
    let lastDate: Date | null = null;
    
    props.messages.forEach((message) => {
      const messageDate = message.timestamp;
      
      if (!lastDate || !isSameDay(lastDate, messageDate)) {
        grouped.push({
          date: messageDate,
          isDateSeparator: true,
        });
        lastDate = messageDate;
      }
      
      grouped.push({
        message,
        isDateSeparator: false,
      });
    });
    
    return grouped;
  });
  
  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };
  
  const getParticipant = (senderId: string) => {
    return props.participants.find(p => p.id === senderId);
  };
  
  const containerStyles = () => {
    const styles: Record<string, string> = {
      'background-color': props.backgroundColor || colors().chatBackground,
    };
    
    if (props.backgroundImage) {
      styles['background-image'] = `url(${props.backgroundImage})`;
      styles['background-size'] = 'cover';
      styles['background-position'] = 'center';
    }
    
    return styles;
  };
  
  return (
    <div
      class={cn(
        'flex-1 overflow-y-auto p-4',
        props.layout.id === 'discord' && 'p-0',
        props.layout.id === 'slack' && 'p-0'
      )}
      style={containerStyles()}
    >
      <div class="max-w-4xl mx-auto">
        <For each={messagesWithDates()}>
          {(item) => (
            <Show
              when={item.isDateSeparator}
              fallback={
                <Show when={item.message}>
                  {(msg) => {
                    const participant = getParticipant(msg().senderId);
                    
                    return (
                      <Show
                        when={msg().type === 'system'}
                        fallback={
                          <MessageBubble
                            message={msg()}
                            layout={props.layout}
                            theme={props.theme}
                            showAvatar={props.showAvatars}
                            showTimestamp={props.showTimestamps}
                            participantName={participant?.name}
                            participantAvatar={participant?.avatar}
                          />
                        }
                      >
                        {/* System Message */}
                        <div class="flex justify-center my-4">
                          <div
                            class="px-4 py-2 rounded-full text-xs text-center"
                            style={{
                              'background-color': colors().receivedBubble,
                              color: colors().timestamp,
                            }}
                          >
                            {msg().content}
                          </div>
                        </div>
                      </Show>
                    );
                  }}
                </Show>
              }
            >
              {/* Date Separator */}
              <div class="flex justify-center my-6">
                <div
                  class="px-3 py-1 rounded text-xs font-medium"
                  style={{
                    'background-color': colors().receivedBubble,
                    color: colors().timestamp,
                  }}
                >
                  {formatDateSeparator(item.date!)}
                </div>
              </div>
            </Show>
          )}
        </For>
        
        {/* Empty State */}
        <Show when={props.messages.length === 0}>
          <div class="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div class="text-center" style={{ color: colors().timestamp }}>
              <p class="text-lg font-medium mb-2">No messages yet</p>
              <p class="text-sm opacity-75">Start a conversation!</p>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
