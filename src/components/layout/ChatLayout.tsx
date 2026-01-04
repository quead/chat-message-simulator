import type { Conversation } from "@/types/conversation"
import type { LayoutConfig, LayoutTheme } from "@/types/layout"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { ConversationView } from "@/components/chat/ConversationView"
import { MessageInput } from "@/components/chat/MessageInput"
import { getConversationTitle } from "@/utils/helpers"

interface ChatLayoutProps {
  conversation: Conversation
  layout: LayoutConfig
  theme: LayoutTheme
  showChrome: boolean
  activeParticipantId: string
  backgroundImageUrl: string
  backgroundImageOpacity: number
  backgroundColor: string
}

const groupStatusLabel = (participants: Conversation["participants"]) => {
  const typing = participants.find((participant) => participant.status === "typing")
  if (typing) return `${typing.name} is typing...`
  const online = participants.filter((participant) => participant.status === "online")
  if (online.length) return `${online.length} online`
  const hasStatus = participants.some((participant) => participant.status !== "empty")
  if (!hasStatus) return ""
  return "Offline"
}

const directStatusLabel = (status?: string) => {
  if (status === "typing") return "typing..."
  if (status === "online") return "online"
  if (status === "empty") return ""
  return "offline"
}

const getSelfParticipantId = (
  participants: Conversation["participants"],
  activeParticipantId: string,
) => {
  if (participants.length === 2) {
    // In direct chats, treat the active participant as "you".
    const active = participants.find((participant) => participant.id === activeParticipantId)
    return active?.id ?? participants[0]?.id ?? ""
  }
  return participants[0]?.id ?? ""
}

export const ChatLayout = ({
  conversation,
  layout,
  theme,
  showChrome,
  activeParticipantId,
  backgroundImageUrl,
  backgroundImageOpacity,
  backgroundColor,
}: ChatLayoutProps) => {
  const bodyFont = `Roboto, ${layout.fonts.body}`
  const headerFont = `Roboto, ${layout.fonts.header}`
  const selfId = getSelfParticipantId(conversation.participants, activeParticipantId)
  const isGroup = conversation.participants.length > 2
  const headerParticipant = !isGroup
    ? conversation.participants.find((participant) => participant.id !== selfId) ??
      conversation.participants[0]
    : undefined
  const title = isGroup ? getConversationTitle(conversation) : headerParticipant?.name ?? "New Chat"
  const subtitle = isGroup
    ? groupStatusLabel(conversation.participants)
    : directStatusLabel(headerParticipant?.status)

  return (
    <div
      className={`chat-surface relative flex h-full w-full flex-col overflow-hidden layout-${layout.id}`}
      data-layout={layout.id}
      style={
        {
          "--chat-bg": backgroundColor || theme.colors.background,
          "--chat-surface": theme.colors.surface,
          "--chat-header": theme.colors.header,
          "--chat-header-text": theme.colors.headerText,
          "--bubble-sent": theme.colors.bubbleSent,
          "--bubble-sent-text": theme.colors.bubbleSentText,
          "--bubble-received": theme.colors.bubbleReceived,
          "--bubble-received-text": theme.colors.bubbleReceivedText,
          "--chat-input": theme.colors.surface,
          "--chat-input-inner": theme.colors.input,
          "--chat-text": theme.colors.inputText,
          "--chat-accent": theme.colors.accent,
          "--chat-muted": theme.colors.muted,
          "--chat-border": theme.colors.border,
          "--chat-pattern": theme.pattern ?? "none",
          "--chat-radius": layout.radius,
          "--layout-font-header": headerFont,
          "--layout-font-body": bodyFont,
          fontFamily: bodyFont,
        } as React.CSSProperties
      }
    >
      {backgroundImageUrl ? (
        <img
          src={backgroundImageUrl}
          alt=""
          className="chat-layer h-full w-full object-cover"
          style={{ opacity: backgroundImageOpacity }}
          aria-hidden="true"
        />
      ) : null}
      {theme.pattern ? <div className="chat-layer chat-bg-pattern" aria-hidden="true" /> : null}
      {showChrome ? (
        <ChatHeader
          title={title}
          subtitle={subtitle}
          avatarUrl={!isGroup ? headerParticipant?.avatarUrl : undefined}
          avatarFallback={!isGroup ? headerParticipant?.name : title}
          layout={layout}
          theme={theme}
        />
      ) : null}
      <div className="relative flex-1 min-h-0">
        <ConversationView
          messages={conversation.messages}
          participants={conversation.participants}
          layout={layout}
          selfId={selfId}
        />
      </div>
      {showChrome ? <MessageInput layout={layout} /> : null}
    </div>
  )
}
