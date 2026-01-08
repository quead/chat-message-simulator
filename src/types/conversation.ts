import type { Message } from "./message"

export type ParticipantStatus = "online" | "offline" | "typing" | "empty"

export interface Participant {
  id: string
  name: string
  avatarUrl?: string
  isVerified?: boolean
  status: ParticipantStatus
  color: string
}

export interface ConversationMetadata {
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  participants: Participant[]
  messages: Message[]
  metadata: ConversationMetadata
  groupName?: string
}
