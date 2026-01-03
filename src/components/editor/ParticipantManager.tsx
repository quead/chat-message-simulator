import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { Plus, Edit2, Trash2, UserCircle2, Upload } from 'lucide-solid';
import type { Participant, UserStatus } from '../../types';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

interface ParticipantManagerProps {
  participants: Participant[];
  onAddParticipant: (participant: Omit<Participant, 'id'>) => void;
  onUpdateParticipant: (id: string, participant: Partial<Participant>) => void;
  onDeleteParticipant: (id: string) => void;
}

export const ParticipantManager: Component<ParticipantManagerProps> = (props) => {
  const [isAdding, setIsAdding] = createSignal(false);
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [name, setName] = createSignal('');
  const [avatar, setAvatar] = createSignal('');
  const [avatarFile, setAvatarFile] = createSignal<string | null>(null);
  const [status, setStatus] = createSignal<UserStatus>('online');
  const [isCurrentUser, setIsCurrentUser] = createSignal(false);
  let fileInputRef: HTMLInputElement | undefined;

  const resetForm = () => {
    setName('');
    setAvatar('');
    setAvatarFile(null);
    setStatus('online');
    setIsCurrentUser(false);
    if (fileInputRef) fileInputRef.value = '';
  };

  const loadEditingData = (participant: Participant) => {
    setName(participant.name);
    setAvatar(participant.avatar || '');
    setStatus(participant.status || 'online');
    setIsCurrentUser(participant.isCurrentUser || false);
  };

  const handleStartEdit = (participant: Participant) => {
    setEditingId(participant.id);
    loadEditingData(participant);
    setIsAdding(false);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    if (!name().trim()) return;

    const participantData = {
      name: name().trim(),
      avatar: avatarFile() || avatar().trim() || undefined,
      status: status(),
      isCurrentUser: isCurrentUser(),
    };

    if (editingId()) {
      props.onUpdateParticipant(editingId()!, participantData);
      setEditingId(null);
    } else {
      props.onAddParticipant(participantData);
      setIsAdding(false);
    }

    resetForm();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };
  
  const handleFileUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setAvatarFile(dataUrl);
        setAvatar(''); // Clear URL input when file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveFile = () => {
    setAvatarFile(null);
    if (fileInputRef) fileInputRef.value = '';
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    resetForm();
  };

  const canDelete = () => {
    return props.participants.length > 2;
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Participants ({props.participants.length})</h2>
        <Button
          onClick={handleStartAdd}
          variant={isAdding() ? 'outline' : 'default'}
          size="sm"
        >
          <Plus class="w-4 h-4 mr-2" />
          {isAdding() ? 'Cancel' : 'Add Participant'}
        </Button>
      </div>

      <Show when={isAdding() || editingId()}>
        <form onSubmit={handleSubmit} class="space-y-4 p-4 border rounded-lg bg-card">
          <div class="flex items-center gap-2 mb-4">
            <UserCircle2 class="w-5 h-5" />
            <h3 class="text-lg font-semibold">
              {editingId() ? 'Edit Participant' : 'Add New Participant'}
            </h3>
          </div>

          <div class="space-y-2">
            <Label for="participant-name">Name *</Label>
            <input
              id="participant-name"
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              placeholder="John Doe"
              class="w-full px-3 py-2 border rounded-md bg-background"
              required
            />
          </div>

          <div class="space-y-2">
            <Label class="flex items-center gap-2">
              <Upload class="w-4 h-4" />
              Avatar (optional)
            </Label>
            
            {/* File Upload */}
            <div class="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                class="hidden"
                id="avatar-file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef?.click()}
                class="w-full"
              >
                <Upload class="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            </div>
            
            {/* Preview */}
            <Show when={avatarFile()}>
              <div class="relative inline-block">
                <img
                  src={avatarFile()!}
                  alt="Avatar preview"
                  class="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
                <Button
                  type="button"
                  onClick={handleRemoveFile}
                  variant="destructive"
                  size="icon"
                  class="absolute -top-2 -right-2 rounded-full w-6 h-6 text-lg leading-none p-0"
                  title="Remove image"
                >
                  ×
                </Button>
              </div>
            </Show>
            
            {/* Or URL Input */}
            <div class="relative">
              <div class="text-xs text-muted-foreground text-center py-1">or</div>
              <input
                id="avatar-url"
                type="url"
                value={avatar()}
                onInput={(e) => setAvatar(e.currentTarget.value)}
                placeholder="https://example.com/avatar.jpg"
                class="w-full px-3 py-2 border rounded-md bg-background"
                disabled={!!avatarFile()}
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="status">Status</Label>
              <select
                id="status"
                value={status()}
                onChange={(e) => setStatus(e.currentTarget.value as UserStatus)}
                class="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="away">Away</option>
                <option value="busy">Busy</option>
                <option value="typing">Typing</option>
              </select>
            </div>

            <div class="space-y-2">
              <Label for="is-current-user">Role</Label>
              <select
                id="is-current-user"
                value={isCurrentUser() ? 'you' : 'other'}
                onChange={(e) => setIsCurrentUser(e.currentTarget.value === 'you')}
                class="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="other">Other Person</option>
                <option value="you">You (Current User)</option>
              </select>
            </div>
          </div>

          <div class="flex gap-2 pt-2">
            <Button type="submit" class="flex-1">
              {editingId() ? 'Update' : 'Add'} Participant
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Show>

      <div class="space-y-2">
        <Show
          when={props.participants.length > 0}
          fallback={
            <div class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
              <UserCircle2 class="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p class="text-lg font-medium mb-1">No participants yet</p>
              <p class="text-sm">Add at least 2 participants to start a conversation</p>
            </div>
          }
        >
          <For each={props.participants}>
          {(participant) => (
            <div
              class="border rounded-lg p-4 transition-all duration-200"
              classList={{
                'bg-accent/30 ring-2 ring-primary/20': editingId() === participant.id,
                'hover:bg-accent/50 hover:shadow-sm': editingId() !== participant.id,
              }}
            >
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 flex-1">
                  <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <Show
                      when={participant.avatar}
                      fallback={
                        <UserCircle2 class="w-6 h-6 text-primary" />
                      }
                    >
                      <img
                        src={participant.avatar}
                        alt={participant.name}
                        class="w-full h-full object-cover"
                      />
                    </Show>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold">
                        {participant.name}
                      </span>
                      <Show when={participant.isCurrentUser}>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          You
                        </span>
                      </Show>
                    </div>
                    <span
                      class="text-xs"
                      classList={{
                        'text-green-600': participant.status === 'online',
                        'text-gray-500': participant.status === 'offline',
                        'text-yellow-600': participant.status === 'away' || participant.status === 'busy',
                      }}
                    >
                      {participant.status || 'online'}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(participant)}
                    title="Edit participant"
                    class="hover:bg-accent"
                  >
                    <Edit2 class="w-4 h-4" />
                  </Button>
                  <Show when={canDelete()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => props.onDeleteParticipant(participant.id)}
                      title="Delete participant"
                      class="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </Show>
                </div>
              </div>
            </div>
          )}
        </For>
        </Show>
      </div>
    </div>
  );
};
