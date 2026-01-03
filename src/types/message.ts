export type MessageType = "text" | "system" | "image"
export type MessageStatus = "sent" | "delivered" | "read"

export interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string
  type: MessageType
  status: MessageStatus
  isHidden?: boolean
}
