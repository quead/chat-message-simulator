import type { Component } from 'solid-js';
import { createSignal, Show, For } from 'solid-js';
import { Calendar, Send, UserCircle2, MessageSquare } from 'lucide-solid';
import type { Message, MessageType, MessageStatus } from '../../types';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface MessageFormProps {
  participants: Array<{ id: string; name: string; isCurrentUser: boolean }>;
  onSubmit: (message: Omit<Message, 'id'>) => void;
  editingMessage?: Message;
  onCancel?: () => void;
}

export const MessageForm: Component<MessageFormProps> = (props) => {
  const [content, setContent] = createSignal(props.editingMessage?.content || '');
  const [senderId, setSenderId] = createSignal(
    props.editingMessage?.senderId || props.participants.find(p => p.isCurrentUser)?.id || ''
  );
  const [messageType, setMessageType] = createSignal<MessageType>(
    props.editingMessage?.type || 'text'
  );
  const [status, setStatus] = createSignal<MessageStatus>(
    props.editingMessage?.status || 'delivered'
  );
  const [timestamp, setTimestamp] = createSignal(
    props.editingMessage?.timestamp
      ? new Date(props.editingMessage.timestamp).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    if (!content().trim() || !senderId()) return;

    const selectedParticipant = props.participants.find(p => p.id === senderId());
    
    props.onSubmit({
      senderId: senderId(),
      content: content().trim(),
      timestamp: new Date(timestamp()),
      type: messageType(),
      status: status(),
      alignment: selectedParticipant?.isCurrentUser ? 'right' : 'left',
    });

    // Reset form if not editing
    if (!props.editingMessage) {
      setContent('');
      setTimestamp(new Date().toISOString().slice(0, 16));
    }
  };

  const messageTypes: MessageType[] = ['text', 'system', 'image', 'video', 'audio', 'file'];
  const messageStatuses: MessageStatus[] = ['sending', 'sent', 'delivered', 'read', 'failed'];

  return (
    <form onSubmit={handleSubmit} class="space-y-4 p-4 border rounded-lg bg-card">
      <div class="flex items-center gap-2 mb-4">
        <MessageSquare class="w-5 h-5" />
        <h3 class="text-lg font-semibold">
          {props.editingMessage ? 'Edit Message' : 'Add New Message'}
        </h3>
      </div>

      <div class="space-y-2">
        <Label for="message-content">Message Content</Label>
        <Textarea
          id="message-content"
          value={content()}
          onInput={(e: Event) => setContent((e.currentTarget as HTMLTextAreaElement).value)}
          placeholder="Type your message..."
          rows={3}
          class="resize-none"
        />
      </div>

      <div class="space-y-2">
        <Label for="sender-select" class="flex items-center gap-2">
          <UserCircle2 class="w-4 h-4" />
          Sender
        </Label>
        <select
          id="sender-select"
          value={senderId()}
          onChange={(e) => setSenderId(e.currentTarget.value)}
          class="w-full px-3 py-2 border rounded-md bg-background"
        >
          <For each={props.participants}>
            {(participant) => (
              <option value={participant.id}>
                {participant.name} {participant.isCurrentUser ? '(You)' : ''}
              </option>
            )}
          </For>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="message-type">Message Type</Label>
          <select
            id="message-type"
            value={messageType()}
            onChange={(e) => setMessageType(e.currentTarget.value as MessageType)}
            class="w-full px-3 py-2 border rounded-md bg-background"
          >
            <For each={messageTypes}>
              {(type) => (
                <option value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              )}
            </For>
          </select>
        </div>

        <div class="space-y-2">
          <Label for="message-status">Status</Label>
          <select
            id="message-status"
            value={status()}
            onChange={(e) => setStatus(e.currentTarget.value as MessageStatus)}
            class="w-full px-3 py-2 border rounded-md bg-background"
          >
            <For each={messageStatuses}>
              {(stat) => (
                <option value={stat}>
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </option>
              )}
            </For>
          </select>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="timestamp" class="flex items-center gap-2">
          <Calendar class="w-4 h-4" />
          Timestamp
        </Label>
        <input
          id="timestamp"
          type="datetime-local"
          value={timestamp()}
          onInput={(e) => setTimestamp(e.currentTarget.value)}
          class="w-full px-3 py-2 border rounded-md bg-background"
        />
      </div>

      <div class="flex gap-2 pt-2">
        <Button type="submit" class="flex-1">
          <Send class="w-4 h-4 mr-2" />
          {props.editingMessage ? 'Update Message' : 'Add Message'}
        </Button>
        <Show when={props.onCancel}>
          <Button type="button" variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
        </Show>
      </div>
    </form>
  );
};
