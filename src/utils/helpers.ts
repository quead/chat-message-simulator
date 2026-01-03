import { format } from "date-fns"
import type { Conversation } from "@/types/conversation"

export const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`
}

export const formatTimestamp = (timestamp: string) => {
  try {
    return format(new Date(timestamp), "p")
  } catch {
    return ""
  }
}

export const formatDateSeparator = (timestamp: string) => {
  try {
    return format(new Date(timestamp), "MMM d, yyyy")
  } catch {
    return ""
  }
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const getConversationTitle = (conversation: Conversation) => {
  const names = conversation.participants.map((participant) => participant.name).filter(Boolean)
  if (conversation.participants.length > 2) {
    return conversation.groupName?.trim() || "Group Chat"
  }
  if (names.length === 0) return "New Chat"
  if (names.length === 1) return names[0]
  return `${names[0]} & ${names[1]}`
}

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
