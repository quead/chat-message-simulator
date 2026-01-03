import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { Plus, Edit2, Trash2, Copy, GripVertical } from 'lucide-solid';
import type { Message } from '../../types';
import { MessageForm } from './MessageForm';
import { Button } from '../ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { format } from 'date-fns';
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  createSortable,
  closestCenter,
} from '@thisbeyond/solid-dnd';

interface ConversationBuilderProps {
  messages: Message[];
  participants: Array<{ id: string; name: string; isCurrentUser: boolean }>;
  onAddMessage: (message: Omit<Message, 'id'>) => void;
  onEditMessage: (id: string, message: Partial<Message>) => void;
  onDeleteMessage: (id: string) => void;
  onDuplicateMessage: (id: string) => void;
  onReorderMessages: (ids: string[]) => void;
}

const SortableMessageItem: Component<{
  message: Message;
  participantName: string;
  isEditing: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}> = (props) => {
  const sortable = createSortable(props.message.id);

  return (
    <div
      ref={sortable.ref}
      class="border rounded-lg p-4 hover:bg-accent/50 transition-all"
      classList={{
        'bg-accent/30': props.isEditing,
        'opacity-25': sortable.isActiveDraggable,
        'transition-transform': !!sortable.transform,
      }}
      style={{
        transform: `translate3d(${sortable.transform?.x ?? 0}px, ${sortable.transform?.y ?? 0}px, 0)`,
      }}
    >
      <div class="flex items-start justify-between gap-4">
        <Button
          {...sortable.dragActivators}
          variant="ghost"
          size="icon"
          class="mt-1 cursor-grab active:cursor-grabbing touch-none h-6 w-6 p-0"
          title="Drag to reorder"
        >
          <GripVertical class="w-4 h-4 text-muted-foreground" />
        </Button>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="font-semibold text-sm">
              {props.participantName}
            </span>
            <span class="text-xs text-muted-foreground">
              {format(new Date(props.message.timestamp), 'MMM d, HH:mm')}
            </span>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              classList={{
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': props.message.status === 'sent',
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': props.message.status === 'delivered' || props.message.status === 'read',
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': props.message.status === 'failed',
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': props.message.status === 'sending',
              }}
            >
              {props.message.status}
            </span>
            <Show when={props.message.type !== 'text'}>
              <span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {props.message.type}
              </span>
            </Show>
          </div>
          <p class="text-sm break-words whitespace-pre-wrap">
            {props.message.content}
          </p>
        </div>

        <div class="flex items-center gap-1 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger
              as={Button}
              size="sm"
              variant="ghost"
              onClick={props.onEdit}
              class="hover:bg-accent"
            >
              <Edit2 class="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent>Edit message</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger
              as={Button}
              size="sm"
              variant="ghost"
              onClick={props.onDuplicate}
              class="hover:bg-accent"
            >
              <Copy class="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent>Duplicate message</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger
              as={Button}
              size="sm"
              variant="ghost"
              onClick={props.onDelete}
              class="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 class="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent>Delete message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export const ConversationBuilder: Component<ConversationBuilderProps> = (props) => {
  const [isAdding, setIsAdding] = createSignal(false);
  const [editingId, setEditingId] = createSignal<string | null>(null);

  const editingMessage = () => props.messages.find(m => m.id === editingId());

  const handleAdd = (message: Omit<Message, 'id'>) => {
    props.onAddMessage(message);
    setIsAdding(false);
  };

  const handleEdit = (message: Omit<Message, 'id'>) => {
    if (editingId()) {
      props.onEditMessage(editingId()!, message);
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const getParticipantName = (senderId: string) => {
    return props.participants.find(p => p.id === senderId)?.name || 'Unknown';
  };

  const messageIds = () => props.messages.map(m => m.id);

  const onDragEnd = ({ draggable, droppable }: any) => {
    if (draggable && droppable) {
      const currentItems = messageIds();
      const fromIndex = currentItems.indexOf(draggable.id);
      const toIndex = currentItems.indexOf(droppable.id);
      
      if (fromIndex !== toIndex) {
        const updatedItems = currentItems.slice();
        updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));
        props.onReorderMessages(updatedItems);
      }
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Messages ({props.messages.length})</h2>
        <Button
          onClick={() => setIsAdding(!isAdding())}
          variant={isAdding() ? 'outline' : 'default'}
          size="sm"
          class="transition-all"
        >
          <Plus class="w-4 h-4 mr-2" />
          {isAdding() ? 'Cancel' : 'Add Message'}
        </Button>
      </div>

      {/* Add Message Form */}
      <Show when={isAdding()}>
        <div class="animate-in fade-in duration-200">
          <MessageForm
            participants={props.participants}
            onSubmit={handleAdd}
            onCancel={handleCancel}
          />
        </div>
      </Show>

      {/* Edit Message Form */}
      <Show when={editingId()}>
        <div class="animate-in fade-in duration-200">
          <MessageForm
            participants={props.participants}
            editingMessage={editingMessage()}
            onSubmit={handleEdit}
            onCancel={handleCancel}
          />
        </div>
      </Show>

      {/* Messages List */}
      <div class="space-y-2">
        <Show
          when={props.messages.length > 0}
          fallback={
            <div class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
              <p class="text-lg font-medium mb-1">No messages yet</p>
              <p class="text-sm">Click "Add Message" to get started</p>
            </div>
          }
        >
          <DragDropProvider onDragEnd={onDragEnd} collisionDetector={closestCenter}>
            <DragDropSensors />
            <SortableProvider ids={messageIds()}>
              <For each={props.messages}>
                {(message) => (
                  <SortableMessageItem
                    message={message}
                    participantName={getParticipantName(message.senderId)}
                    isEditing={editingId() === message.id}
                    onEdit={() => setEditingId(message.id)}
                    onDuplicate={() => props.onDuplicateMessage(message.id)}
                    onDelete={() => props.onDeleteMessage(message.id)}
                  />
                )}
              </For>
            </SortableProvider>
            <DragOverlay>
              {(draggable: any) => {
                const message = props.messages.find(m => m.id === draggable.id);
                return message ? (
                  <div class="border rounded-lg p-4 bg-background shadow-lg opacity-90">
                    <div class="flex items-start gap-4">
                      <GripVertical class="w-4 h-4 text-muted-foreground mt-1" />
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="font-semibold text-sm">
                            {getParticipantName(message.senderId)}
                          </span>
                        </div>
                        <p class="text-sm break-words line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null;
              }}
            </DragOverlay>
          </DragDropProvider>
        </Show>
      </div>
    </div>
  );
};
