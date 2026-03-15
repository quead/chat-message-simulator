import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { defaultLayoutId } from "../constants/layouts"
import type { Conversation, Participant } from "../types/conversation"
import type { Message, MessageStatus, MessageType } from "../types/message"
import type { LayoutId, ThemeId } from "../types/layout"
import { generateId } from "../utils/helpers"

export type ExportFormat = "png" | "jpeg"
export type ExportCaptureMode = "viewport" | "full"

export interface ExportSettings {
  presetId: string
  width: number
  height: number
  scale: number
  format: ExportFormat
  quality: number
  captureMode: ExportCaptureMode
}

export interface UiState {
  activeView: "editor" | "preview"
  showChrome: boolean
  zoom: number
  isSidebarOpen: boolean
  activePanel: "messages" | "participants" | "settings" | "export"
  autoFit: boolean
}

type Snapshot = {
  conversation: Conversation
  layoutId: LayoutId
  themeId: ThemeId
  activeParticipantId: string
  backgroundImageUrl: string
  backgroundImageOpacity: number
  backgroundColor: string
  exportSettings: ExportSettings
}

interface HistoryState {
  past: Snapshot[]
  future: Snapshot[]
}

interface ConversationStore {
  conversation: Conversation
  layoutId: LayoutId
  themeId: ThemeId
  activeParticipantId: string
  backgroundImageUrl: string
  backgroundImageOpacity: number
  backgroundColor: string
  exportSettings: ExportSettings
  ui: UiState
  history: HistoryState
  lastAutosaveAt: number | null
  setLayout: (layoutId: LayoutId) => void
  setTheme: (themeId: ThemeId) => void
  setActiveParticipant: (participantId: string) => void
  setBackgroundImageUrl: (url: string) => void
  setBackgroundImageOpacity: (opacity: number) => void
  clearBackgroundImage: () => void
  setBackgroundColor: (color: string) => void
  setLastAutosaveAt: (timestamp: number | null) => void
  addParticipant: (participant: Omit<Participant, "id">) => void
  updateParticipant: (participantId: string, updates: Partial<Participant>) => void
  removeParticipant: (participantId: string) => void
  setGroupName: (groupName: string) => void
  addMessage: (payload: {
    senderId: string
    content: string
    imageUrl?: string
    timestamp: string
    type: MessageType
    status: MessageStatus
  }) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  deleteMessage: (messageId: string) => void
  duplicateMessage: (messageId: string) => void
  setMessages: (messages: Message[]) => void
  setExportSettings: (settings: Partial<ExportSettings>) => void
  setUi: (updates: Partial<UiState>) => void
  resetConversation: () => void
  loadConversation: (conversation: Conversation) => void
  undo: () => void
  redo: () => void
  saveSnapshot: () => void
  clearSnapshot: () => void
}

const defaultParticipants: Participant[] = [
  {
    id: "p1",
    name: "Avery",
    status: "online",
    color: "#22c55e",
  },
  {
    id: "p2",
    name: "Jordan",
    status: "typing",
    color: "#0b84ff",
  },
]

const removedDefaultAvatarUrls = new Set([
  "https://i.pravatar.cc/100?img=12",
  "https://i.pravatar.cc/100?img=32",
])
const removedDefaultAvatarPatterns = [/avatar-avery/i, /avatar-jordan/i]

const normalizeParticipants = (participants: Participant[]) =>
  participants.map((participant) => {
    const { avatarUrl } = participant
    if (!avatarUrl) return participant
    const isRemovedDefaultAvatar =
      removedDefaultAvatarUrls.has(avatarUrl) ||
      removedDefaultAvatarPatterns.some((pattern) => pattern.test(avatarUrl))
    return isRemovedDefaultAvatar ? { ...participant, avatarUrl: undefined } : participant
  })

const defaultMessageSeed: Array<{
  senderId: string
  content: string
  type: MessageType
  status: MessageStatus
}> = [
  {
    senderId: "p1",
    content: "Morning. I expanded the chat mockup layout so it feels closer to a real thread.",
    type: "text",
    status: "read",
  },
  {
    senderId: "p2",
    content: "Good. The short demo was too tidy and it hid the long-conversation problem.",
    type: "text",
    status: "read",
  },
  {
    senderId: "p1",
    content: "Exactly. Once the conversation got dense, people couldn’t tell how to review older messages.",
    type: "text",
    status: "read",
  },
  {
    senderId: "p2",
    content: "And exports only made sense if the important part happened to be inside the device viewport.",
    type: "text",
    status: "read",
  },
  {
    senderId: "p1",
    content: "So I’m splitting it into two actions: capture the current viewport, or export every visible message.",
    type: "text",
    status: "delivered",
  },
  {
    senderId: "p2",
    content: "That solves the screenshot problem. We still need a clearer way to move through the preview itself.",
    type: "text",
    status: "read",
  },
  {
    senderId: "p1",
    content: "I’m adding jump controls for top and latest, plus a status callout when the thread is taller than the phone.",
    type: "text",
    status: "delivered",
  },
  {
    senderId: "p2",
    content: "Perfect. It should feel obvious without adding weird chrome inside the fake app UI.",
    type: "text",
    status: "read",
  },
  {
    senderId: "p1",
    content: "Also removing the bundled SVG avatars. Default mocks will use initials until the user uploads real images.",
    type: "text",
    status: "delivered",
  },
  {
    senderId: "p2",
    content: "Better. Neutral defaults make the generator feel less pre-scripted.",
    type: "text",
    status: "read",
  },
  {
    senderId: "p1",
    content: "I left hidden messages out of the full export on purpose. If it’s hidden in the builder, it stays hidden everywhere.",
    type: "text",
    status: "delivered",
  },
  {
    senderId: "p2",
    content: "Good call. Otherwise export behavior gets surprising fast.",
    type: "text",
    status: "read",
  },
  {
    senderId: "p2",
    content: "System note: long threads now get dedicated preview guidance and an all-messages export mode.",
    type: "system",
    status: "sent",
  },
  {
    senderId: "p1",
    content: "I’m keeping the phone preview fixed-height so editing still feels like composing on a real device.",
    type: "text",
    status: "delivered",
  },
  {
    senderId: "p2",
    content: "That’s the right tradeoff. The editor stays readable, and the export can grow when it needs to.",
    type: "text",
    status: "read",
  },
  {
    senderId: "p1",
    content: "Ship it. This seed thread should make the new behavior obvious the moment the app loads.",
    type: "text",
    status: "sent",
  },
]

const buildDefaultConversation = (): Conversation => {
  const updatedAt = new Date()
  const firstTimestamp = updatedAt.getTime() - (defaultMessageSeed.length - 1) * 60_000
  return {
    id: "conv-1",
    participants: normalizeParticipants(defaultParticipants),
    messages: defaultMessageSeed.map((message, index) => ({
      id: `m${index + 1}`,
      ...message,
      timestamp: new Date(firstTimestamp + index * 60_000).toISOString(),
    })),
    metadata: {
      createdAt: new Date(firstTimestamp).toISOString(),
      updatedAt: updatedAt.toISOString(),
    },
  }
}

const defaultExportSettings: ExportSettings = {
  presetId: "iphone-14-pro",
  width: 393,
  height: 852,
  scale: 2,
  format: "png",
  quality: 0.95,
  captureMode: "viewport",
}

const defaultUiState: UiState = {
  activeView: "editor",
  showChrome: true,
  zoom: 1,
  isSidebarOpen: true,
  activePanel: "messages",
  autoFit: true,
}

const STORAGE_KEY = "chat-sim-storage"
const HISTORY_LIMIT = 3

const buildSnapshot = (state: ConversationStore): Snapshot => ({
  conversation: state.conversation,
  layoutId: state.layoutId,
  themeId: state.themeId,
  activeParticipantId: state.activeParticipantId,
  backgroundImageUrl: state.backgroundImageUrl,
  backgroundImageOpacity: state.backgroundImageOpacity,
  backgroundColor: state.backgroundColor,
  exportSettings: state.exportSettings,
})

const pushHistory = (state: ConversationStore): HistoryState => {
  const past = [...state.history.past, buildSnapshot(state)]
  return {
    past: past.slice(-HISTORY_LIMIT),
    future: [],
  }
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversation: buildDefaultConversation(),
      layoutId: defaultLayoutId,
      themeId: "light",
      activeParticipantId: defaultParticipants[0].id,
      backgroundImageUrl: "",
      backgroundImageOpacity: 0.35,
      backgroundColor: "",
      exportSettings: defaultExportSettings,
      ui: defaultUiState,
      history: { past: [], future: [] },
      lastAutosaveAt: null,
      setLayout: (layoutId) => set((state) => ({ layoutId, history: pushHistory(state) })),
      setTheme: (themeId) => set((state) => ({ themeId, history: pushHistory(state) })),
      setActiveParticipant: (participantId) =>
        set((state) => ({ activeParticipantId: participantId, history: pushHistory(state) })),
      setBackgroundImageUrl: (url) =>
        set((state) => ({ backgroundImageUrl: url, history: pushHistory(state) })),
      setBackgroundImageOpacity: (opacity) =>
        set((state) => ({ backgroundImageOpacity: opacity, history: pushHistory(state) })),
      clearBackgroundImage: () =>
        set((state) => ({ backgroundImageUrl: "", history: pushHistory(state) })),
      setBackgroundColor: (color) =>
        set((state) => ({ backgroundColor: color, history: pushHistory(state) })),
      setLastAutosaveAt: (timestamp) => set({ lastAutosaveAt: timestamp }),
      addParticipant: (participant) =>
        set((state) => {
          const newParticipant: Participant = { id: generateId(), ...participant }
          const nextParticipants = [...state.conversation.participants, newParticipant]
          const groupName =
            nextParticipants.length > 2
              ? state.conversation.groupName ?? "Group Chat"
              : undefined
          return {
            conversation: {
              ...state.conversation,
              participants: nextParticipants,
              groupName,
              metadata: {
                ...state.conversation.metadata,
                updatedAt: new Date().toISOString(),
              },
            },
            history: pushHistory(state),
          }
        }),
      updateParticipant: (participantId, updates) =>
        set((state) => ({
          conversation: {
            ...state.conversation,
            participants: state.conversation.participants.map((participant) =>
              participant.id === participantId
                ? { ...participant, ...updates }
                : participant,
            ),
            metadata: {
              ...state.conversation.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
          history: pushHistory(state),
        })),
      removeParticipant: (participantId) =>
        set((state) => {
          const remaining = state.conversation.participants.filter(
            (participant) => participant.id !== participantId,
          )
          const activeParticipantId =
            state.activeParticipantId === participantId && remaining.length
              ? remaining[0].id
              : state.activeParticipantId
          const groupName =
            remaining.length > 2 ? state.conversation.groupName ?? "Group Chat" : undefined
          return {
            activeParticipantId,
            conversation: {
              ...state.conversation,
              participants: remaining,
              messages: state.conversation.messages.filter(
                (message) => message.senderId !== participantId,
              ),
              groupName,
              metadata: {
                ...state.conversation.metadata,
                updatedAt: new Date().toISOString(),
              },
            },
            history: pushHistory(state),
          }
        }),
      setGroupName: (groupName) =>
        set((state) => ({
          conversation: {
            ...state.conversation,
            groupName: state.conversation.participants.length > 2 ? groupName : undefined,
            metadata: {
              ...state.conversation.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
          history: pushHistory(state),
        })),
      addMessage: (payload) =>
        set((state) => ({
          conversation: {
            ...state.conversation,
            messages: [
              ...state.conversation.messages,
              {
                id: generateId(),
                ...payload,
              },
            ],
            metadata: {
              ...state.conversation.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
          history: pushHistory(state),
        })),
      updateMessage: (messageId, updates) =>
        set((state) => ({
          conversation: {
            ...state.conversation,
            messages: state.conversation.messages.map((message) =>
              message.id === messageId ? { ...message, ...updates } : message,
            ),
            metadata: {
              ...state.conversation.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
          history: pushHistory(state),
        })),
      deleteMessage: (messageId) =>
        set((state) => ({
          conversation: {
            ...state.conversation,
            messages: state.conversation.messages.filter((message) => message.id !== messageId),
            metadata: {
              ...state.conversation.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
          history: pushHistory(state),
        })),
      duplicateMessage: (messageId) =>
        set((state) => {
          const message = state.conversation.messages.find((entry) => entry.id === messageId)
          if (!message) return state
          const copy: Message = {
            ...message,
            id: generateId(),
            timestamp: new Date().toISOString(),
          }
          return {
            conversation: {
              ...state.conversation,
              messages: [...state.conversation.messages, copy],
              metadata: {
                ...state.conversation.metadata,
                updatedAt: new Date().toISOString(),
              },
            },
            history: pushHistory(state),
          }
        }),
      setMessages: (messages) =>
        set((state) => ({
          conversation: {
            ...state.conversation,
            messages,
            metadata: {
              ...state.conversation.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
          history: pushHistory(state),
        })),
      setExportSettings: (settings) =>
        set((state) => ({
          exportSettings: {
            ...state.exportSettings,
            ...settings,
          },
          history: pushHistory(state),
        })),
      setUi: (updates) => set((state) => ({ ui: { ...state.ui, ...updates } })),
      resetConversation: () =>
        set((state) => ({
          conversation: buildDefaultConversation(),
          activeParticipantId: defaultParticipants[0].id,
          layoutId: defaultLayoutId,
          themeId: "light",
          backgroundImageUrl: "",
          backgroundImageOpacity: 0.35,
          backgroundColor: "",
          exportSettings: { ...defaultExportSettings },
          ui: { ...defaultUiState },
          lastAutosaveAt: null,
          history: pushHistory(state),
        })),
      loadConversation: (conversation) => {
        const legacyTitle = (conversation as { title?: string }).title
        const participants = normalizeParticipants(conversation.participants)
        const groupName =
          participants.length > 2 ? conversation.groupName ?? legacyTitle ?? "Group Chat" : undefined
        set((state) => ({
          conversation: {
            ...conversation,
            participants,
            groupName,
          },
          activeParticipantId: participants[0]?.id ?? "",
          history: pushHistory(state),
        }))
      },
      undo: () =>
        set((state) => {
          if (state.history.past.length === 0) return state
          const previous = state.history.past[state.history.past.length - 1]
          return {
            conversation: previous.conversation,
            layoutId: previous.layoutId,
            themeId: previous.themeId,
            activeParticipantId: previous.activeParticipantId,
            backgroundImageUrl: previous.backgroundImageUrl,
            backgroundImageOpacity: previous.backgroundImageOpacity,
            backgroundColor: previous.backgroundColor,
            exportSettings: previous.exportSettings,
            history: {
              past: state.history.past.slice(0, -1),
              future: [buildSnapshot(state), ...state.history.future].slice(0, HISTORY_LIMIT),
            },
          }
        }),
      redo: () =>
        set((state) => {
          if (state.history.future.length === 0) return state
          const next = state.history.future[0]
          return {
            conversation: next.conversation,
            layoutId: next.layoutId,
            themeId: next.themeId,
            activeParticipantId: next.activeParticipantId,
            backgroundImageUrl: next.backgroundImageUrl,
            backgroundImageOpacity: next.backgroundImageOpacity,
            backgroundColor: next.backgroundColor,
            exportSettings: next.exportSettings,
            history: {
              past: [...state.history.past, buildSnapshot(state)].slice(-HISTORY_LIMIT),
              future: state.history.future.slice(1),
            },
          }
        }),
      saveSnapshot: () => {
        const snapshot = get()
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              conversation: snapshot.conversation,
              layoutId: snapshot.layoutId,
              themeId: snapshot.themeId,
              activeParticipantId: snapshot.activeParticipantId,
              exportSettings: snapshot.exportSettings,
            }),
          )
        } catch (error) {
          console.error("Failed to save snapshot", error)
        }
      },
      clearSnapshot: () => {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch (error) {
          console.error("Failed to clear snapshot", error)
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (state) => {
        if (!state) return state
        const typed = state as ConversationStore
        return {
          ...typed,
          conversation: {
            ...typed.conversation,
            participants: normalizeParticipants(typed.conversation.participants),
          },
          exportSettings: {
            ...defaultExportSettings,
            ...typed.exportSettings,
          },
        }
      },
      partialize: (state) => ({
        conversation: state.conversation,
        layoutId: state.layoutId,
        themeId: state.themeId,
        activeParticipantId: state.activeParticipantId,
        backgroundImageUrl: state.backgroundImageUrl,
        backgroundImageOpacity: state.backgroundImageOpacity,
        backgroundColor: state.backgroundColor,
        exportSettings: state.exportSettings,
        lastAutosaveAt: state.lastAutosaveAt,
      }),
    },
  ),
)
