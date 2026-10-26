import { differenceInCalendarDays, format, isThisYear, isToday, isYesterday } from "date-fns"
import type { Conversation, Participant } from "@/types/conversation"
import type { Message } from "@/types/message"

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

// Relative day labels like messaging apps use: Today, Yesterday, weekday, then the date.
export const formatChatDay = (timestamp: string) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ""
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  const days = differenceInCalendarDays(new Date(), date)
  if (days > 0 && days < 7) return format(date, "EEEE")
  return format(date, isThisYear(date) ? "EEE, MMM d" : "MMM d, yyyy")
}

export const formatInstagramDateSeparator = (timestamp: string) => {
  try {
    return format(new Date(timestamp), "d MMM 'AT' HH:mm").toUpperCase()
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

export const readFileAsDataUrl = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const MAX_IMAGE_UPLOAD_BYTES = 15 * 1024 * 1024

// Re-encode uploads so data URLs stay small enough for localStorage autosave.
export const readImageFile = async (file: File, maxDimension: number): Promise<string> => {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are supported.")
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) throw new Error("Images must be smaller than 15MB.")
  const source = await readFileAsDataUrl(file)
  if (file.type === "image/svg+xml" || file.type === "image/gif") return source
  const image = new Image()
  image.src = source
  await image.decode()
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height)
  const encoded = canvas.toDataURL("image/webp", 0.88)
  return encoded.length < source.length ? encoded : source
}

export const isJsonFile = (file: File) =>
  file.type === "application/json" || file.name.toLowerCase().endsWith(".json")

const participantPalette = ["#22c55e", "#0b84ff", "#f97316", "#ec4899", "#14b8a6", "#eab308", "#ef4444", "#64748b"]

export const nextParticipantColor = (participants: Participant[]) => {
  const used = new Set(participants.map((participant) => participant.color))
  return (
    participantPalette.find((color) => !used.has(color)) ??
    participantPalette[participants.length % participantPalette.length]
  )
}

// The active participant is "you": their messages render on the sending side.
export const getSelfParticipantId = (participants: Participant[], activeParticipantId: string) =>
  participants.find((participant) => participant.id === activeParticipantId)?.id ??
  participants[0]?.id ??
  ""

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?"

// One minute after the last message keeps new messages in chronological order.
export const getNextTimestamp = (messages: Message[]) => {
  const last = messages.at(-1)
  const lastTime = last ? Date.parse(last.timestamp) : Number.NaN
  return new Date(Number.isNaN(lastTime) ? Date.now() : lastTime + 60_000).toISOString()
}

// Scroll offsets that page through the conversation one viewport at a time, ending flush at the bottom.
// Floating chrome hides `obscuredHeight` of every screen, so pages overlap by that much.
export const getScreenScrollTops = (contentHeight: number, viewportHeight: number, obscuredHeight = 0) => {
  const viewport = Math.round(viewportHeight)
  const maxScroll = Math.max(0, Math.round(contentHeight) - viewport)
  if (!viewport || maxScroll === 0) return [0]
  const step = Math.max(1, viewport - Math.round(obscuredHeight))
  const positions: number[] = []
  for (let top = 0; top < maxScroll; top += step) {
    positions.push(top)
  }
  positions.push(maxScroll)
  return positions
}
