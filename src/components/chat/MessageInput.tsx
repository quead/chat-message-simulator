import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { Smile, Paperclip, Send, Mic } from 'lucide-solid';
import type { LayoutConfig } from '../../types';
import { cn } from '../../lib/utils';

interface MessageInputProps {
  layout: LayoutConfig;
  theme: 'light' | 'dark';
  onSend?: (content: string) => void;
  onTyping?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const MessageInput: Component<MessageInputProps> = (props) => {
  const [message, setMessage] = createSignal('');
  const [isRecording, setIsRecording] = createSignal(false);
  
  const colors = () => props.theme === 'light' ? props.layout.lightColors : props.layout.darkColors;
  
  const inputStyles = () => ({
    'background-color': colors().inputBackground,
    'color': colors().inputText,
    'border-color': colors().inputBorder,
  });
  
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleInput = (e: InputEvent) => {
    const target = e.target as HTMLTextAreaElement;
    setMessage(target.value);
    props.onTyping?.();
    
    // Auto-resize textarea
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };
  
  const handleSend = () => {
    const content = message().trim();
    if (content && !props.disabled) {
      props.onSend?.(content);
      setMessage('');
      
      // Reset textarea height
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
      }
    }
  };
  
  const toggleRecording = () => {
    setIsRecording(!isRecording());
  };
  
  return (
    <div
      class="flex items-center gap-2 px-4 py-3 border-t"
      style={{
        'background-color': colors().background,
        'border-color': colors().inputBorder,
      }}
    >
      {/* Emoji Button */}
      <button
        class="p-2 hover:bg-black/10 rounded-full transition-colors flex-shrink-0"
        style={{ color: colors().inputText }}
        aria-label="Add emoji"
        disabled={props.disabled}
      >
        <Smile size={20} />
      </button>
      
      {/* Attachment Button */}
      <button
        class="p-2 hover:bg-black/10 rounded-full transition-colors flex-shrink-0"
        style={{ color: colors().inputText }}
        aria-label="Attach file"
        disabled={props.disabled}
      >
        <Paperclip size={20} />
      </button>
      
      {/* Text Input */}
      <div class="flex relative w-full">
        <textarea
          value={message()}
          onInput={handleInput}
          onKeyPress={handleKeyPress}
          placeholder={props.placeholder || 'Type a message...'}
          disabled={props.disabled}
          rows={1}
          class={cn(
            'w-full px-4 py-2 rounded-full resize-none border focus:outline-none focus:ring-2',
            'transition-shadow'
          )}
          style={{
            ...inputStyles(),
            'max-height': '120px',
            'min-height': '40px',
          }}
        />
      </div>
      
      {/* Send or Mic Button */}
      <Show
        when={message().trim().length > 0}
        fallback={
          <button
            onClick={toggleRecording}
            class={cn(
              'p-2 rounded-full transition-colors flex-shrink-0',
              isRecording() ? 'bg-red-500 text-white' : 'hover:bg-black/10'
            )}
            style={{ color: isRecording() ? 'white' : colors().inputText }}
            aria-label={isRecording() ? 'Stop recording' : 'Record voice message'}
            disabled={props.disabled}
          >
            <Mic size={20} />
          </button>
        }
      >
        <button
          onClick={handleSend}
          class="p-2 rounded-full transition-colors flex-shrink-0"
          style={{ 
            'background-color': colors().primary,
            color: 'white' 
          }}
          aria-label="Send message"
          disabled={props.disabled}
        >
          <Send size={20} />
        </button>
      </Show>
    </div>
  );
};
