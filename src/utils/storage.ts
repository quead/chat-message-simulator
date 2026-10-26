import type { Conversation, Participant, ParticipantStatus } from "../types/conversation"
import type { Message, MessageStatus, MessageType } from "../types/message"

export const downloadJson = (data: Conversation, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  // Revoking synchronously can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const participantStatuses: ParticipantStatus[] = ["online", "offline", "typing", "empty"]
const messageTypes: MessageType[] = ["text", "system", "image"]
const messageStatuses: MessageStatus[] = ["sent", "delivered", "read"]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const pick = <T extends string>(value: unknown, allowed: T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

// Only inline images or web URLs may reach <img src> / CSS url() from an imported file.
const safeImageUrl = (value: unknown) =>
  typeof value === "string" && /^(data:image\/|https?:\/\/)/i.test(value) ? value : undefined

const validTimestamp = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : undefined

// Imported JSON is untrusted: keep well-formed entries only and fill in defaults.
export const parseConversation = (data: unknown): Conversation => {
  if (!isRecord(data) || !Array.isArray(data.participants) || !Array.isArray(data.messages)) {
    throw new Error("This file is not a conversation export.")
  }
  const participants: Participant[] = data.participants
    .filter(isRecord)
    .filter((entry) => typeof entry.id === "string" && typeof entry.name === "string")
    .map((entry) => ({
      id: entry.id as string,
      name: entry.name as string,
      avatarUrl: safeImageUrl(entry.avatarUrl),
      isVerified: entry.isVerified === true,
      status: pick(entry.status, participantStatuses, "online"),
      color: typeof entry.color === "string" ? entry.color : "#22c55e",
    }))
  if (participants.length === 0) {
    throw new Error("The file has no participants.")
  }
  const participantIds = new Set(participants.map((participant) => participant.id))
  const now = new Date().toISOString()
  const messages: Message[] = data.messages
    .filter(isRecord)
    .filter(
      (entry) =>
        typeof entry.id === "string" &&
        typeof entry.senderId === "string" &&
        participantIds.has(entry.senderId),
    )
    .map((entry) => ({
      id: entry.id as string,
      senderId: entry.senderId as string,
      content: typeof entry.content === "string" ? entry.content : "",
      imageUrl: safeImageUrl(entry.imageUrl),
      timestamp: validTimestamp(entry.timestamp) ?? now,
      type: pick(entry.type, messageTypes, "text"),
      status: pick(entry.status, messageStatuses, "sent"),
      isHidden: entry.isHidden === true,
    }))
  const metadata = isRecord(data.metadata) ? data.metadata : {}
  const legacyTitle = typeof data.title === "string" ? data.title : undefined
  return {
    id: typeof data.id === "string" ? data.id : "imported",
    participants,
    messages,
    groupName: typeof data.groupName === "string" ? data.groupName : legacyTitle,
    metadata: {
      createdAt: validTimestamp(metadata.createdAt) ?? now,
      updatedAt: now,
    },
  }
}

export const readJsonFile = async (file: File): Promise<Conversation> => {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error("The file is not valid JSON.")
  }
  return parseConversation(data)
}
