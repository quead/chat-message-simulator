import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { format } from 'date-fns';
import type { Message, LayoutConfig } from '../../types';
import { cn } from '../../lib/utils';

interface MessageBubbleProps {
  message: Message;
  layout: LayoutConfig;
  theme: 'light' | 'dark';
  showAvatar?: boolean;
  showTimestamp?: boolean;
  participantName?: string;
  participantAvatar?: string;
}

export const MessageBubble: Component<MessageBubbleProps> = (props) => {
  const isReceived = () => props.message.alignment === 'left';
  const isSent = () => props.message.alignment === 'right';
  
  const colors = () => props.theme === 'light' ? props.layout.lightColors : props.layout.darkColors;
  
  const bubbleStyles = () => ({
    'background-color': isSent() ? colors().sentBubble : colors().receivedBubble,
    'color': isSent() ? colors().sentText : colors().receivedText,
    'max-width': props.layout.bubbleMaxWidth,
    'padding': props.layout.bubblePadding,
    'margin': props.layout.bubbleMargin,
    'border-radius': props.layout.borderRadius,
  });
  
  const formatTime = (date: Date) => {
    return format(date, 'HH:mm');
  };
  
  return (
    <div
      class={cn(
        'flex gap-2 mb-2',
        isSent() ? 'flex-row-reverse justify-start' : 'flex-row justify-start',
        props.layout.bubbleStyle === 'minimal' && 'mb-0'
      )}
    >
      {/* Avatar */}
      <Show when={props.showAvatar && isReceived()}>
        <div class="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
          <Show
            when={props.participantAvatar}
            fallback={
              <div 
                class="w-full h-full flex items-center justify-center text-white font-medium text-sm"
                style={{ 'background-color': '#6B7280' }}
              >
                {props.participantName?.charAt(0).toUpperCase() || 'U'}
              </div>
            }
          >
            <img src={props.participantAvatar} alt={props.participantName} class="w-full h-full object-cover" />
          </Show>
        </div>
      </Show>
      
      {/* Message Content */}
      <div class={cn('flex flex-col', isSent() ? 'items-end' : 'items-start')}>
        {/* Participant Name (for group chats or minimal layouts) */}
        <Show when={isReceived() && props.participantName && props.layout.bubbleStyle === 'minimal'}>
          <span class="text-xs font-semibold mb-1" style={{ color: colors().receivedText }}>
            {props.participantName}
          </span>
        </Show>
        
        {/* Message Bubble */}
        <div
          class={cn(
            'relative break-words',
            props.layout.bubbleStyle === 'rounded-tail' && 'message-bubble-tail',
            props.layout.bubbleStyle === 'rounded' && 'rounded-2xl',
            props.layout.bubbleStyle === 'sharp' && 'rounded-sm',
            props.layout.bubbleStyle === 'minimal' && 'bg-transparent'
          )}
          style={bubbleStyles()}
        >
          {/* Deleted Message */}
          <Show when={props.message.deleted}>
            <span class="italic opacity-60">This message was deleted</span>
          </Show>
          
          {/* Normal Message */}
          <Show when={!props.message.deleted}>
            <div class="whitespace-pre-wrap">{props.message.content}</div>
            
            {/* Edited Indicator */}
            <Show when={props.message.edited}>
              <span class="text-xs opacity-60 ml-1">(edited)</span>
            </Show>
          </Show>
          
          {/* Timestamp & Status */}
          <div class="flex items-center gap-1 mt-1">
            <Show when={props.showTimestamp}>
              <span class="text-xs opacity-60" style={{ color: colors().timestamp }}>
                {formatTime(props.message.timestamp)}
              </span>
            </Show>
            
            {/* Read Receipt / Status */}
            <Show when={isSent() && props.message.status && props.layout.supportsReadReceipts}>
              <span class="text-xs">
                <Show when={props.message.status === 'read'}>✓✓</Show>
                <Show when={props.message.status === 'delivered'}>✓✓</Show>
                <Show when={props.message.status === 'sent'}>✓</Show>
                <Show when={props.message.status === 'sending'}>⏱</Show>
                <Show when={props.message.status === 'failed'}>❌</Show>
              </span>
            </Show>
          </div>
        </div>
        
        {/* Reactions */}
        <Show when={props.message.reactions && props.message.reactions.length > 0 && props.layout.supportsReactions}>
          <div class="flex gap-1 mt-1">
            {props.message.reactions?.map((reaction) => (
              <span class="text-sm bg-background border rounded-full px-2 py-0.5">
                {reaction.emoji}
              </span>
            ))}
          </div>
        </Show>
      </div>
    </div>
  );
};
