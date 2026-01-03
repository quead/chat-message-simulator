export type MessageType = 'text' | 'system' | 'image' | 'video' | 'audio' | 'file';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type MessageAlignment = 'left' | 'right';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: MessageType;
  status?: MessageStatus;
  alignment?: MessageAlignment;
  
  // Optional metadata
  edited?: boolean;
  editedAt?: Date;
  deleted?: boolean;
  deletedAt?: Date;
  
  // For media messages
  mediaUrl?: string;
  mediaThumbnail?: string;
  mediaSize?: number;
  mediaDuration?: number; // for audio/video in seconds
  
  // For replies/threading
  replyTo?: string; // Message ID being replied to
  
  // For reactions
  reactions?: MessageReaction[];
  
  // For forwarded messages
  forwarded?: boolean;
  originalSenderId?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface SystemMessage extends Omit<Message, 'senderId' | 'status' | 'alignment'> {
  type: 'system';
  systemType: 'join' | 'leave' | 'name_change' | 'photo_change' | 'custom';
}
