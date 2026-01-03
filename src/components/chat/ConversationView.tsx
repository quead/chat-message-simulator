import type { Message } from "@/types/message"
import type { Participant } from "@/types/conversation"
import type { LayoutConfig } from "@/types/layout"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { formatDateSeparator } from "@/utils/helpers"
import { cn } from "@/utils/cn"

interface ConversationViewProps {
  messages: Message[]
  participants: Participant[]
  layout: LayoutConfig
  selfId: string
}

export const ConversationView = ({
  messages,
  participants,
  layout,
  selfId,
}: ConversationViewProps) => {
  const isWhatsApp = layout.id === "whatsapp"
  const isSnapchat = layout.id === "snapchat"
  const isMessenger = layout.id === "messenger"
  const isGroup = participants.length > 2
  const dateBadgeClass = cn(
    "mx-auto w-fit rounded-full px-2.5 py-0.5 text-[0.7rem]",
    isWhatsApp
      ? "bg-white/70 text-[0.65rem] font-medium text-[#54656f] shadow-[0_1px_0_rgba(0,0,0,0.08)]"
      : isSnapchat
        ? "bg-black/5 text-[0.6rem] font-medium text-[var(--chat-muted)]"
        : isMessenger
          ? "bg-black/5 text-[0.6rem] font-medium text-[var(--chat-muted)]"
        : "bg-white/20 text-[var(--chat-muted)]",
  )
  const systemMessageClass = cn(
    "mx-auto max-w-[70%] rounded-full px-4 py-2 text-center text-xs",
    isWhatsApp
      ? "bg-white/70 text-[#54656f] shadow-[0_1px_0_rgba(0,0,0,0.08)]"
      : isSnapchat
        ? "bg-black/5 text-[var(--chat-muted)]"
        : isMessenger
          ? "bg-black/5 text-[var(--chat-muted)]"
        : "bg-white/15 text-[var(--chat-muted)]",
  )

  return (
    <div
      className={cn(
        "relative z-10 flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain",
        isWhatsApp
          ? "gap-1 px-3 py-4"
          : isSnapchat
            ? "gap-2 px-2.5 py-4"
            : isMessenger
              ? "gap-3 px-3 py-4"
            : "gap-4 px-4 py-6",
      )}
    >
      {messages.length === 0 ? (
        <div className="mx-auto max-w-sm rounded-2xl border border-dashed border-white/40 bg-white/10 px-6 py-8 text-center text-sm text-[var(--chat-muted)]">
          Start your story by adding messages in the builder.
        </div>
      ) : null}
      {messages.map((message, index) => {
        const sender = participants.find((participant) => participant.id === message.senderId)
        const currentDate = formatDateSeparator(message.timestamp)
        const previousDate =
          index > 0 ? formatDateSeparator(messages[index - 1].timestamp) : ""
        const showDate = currentDate !== previousDate

        if (message.type === "system") {
          return (
            <div key={message.id} className="space-y-3">
              {showDate ? <div className={dateBadgeClass}>{currentDate}</div> : null}
              <div className={systemMessageClass}>{message.content}</div>
            </div>
          )
        }

        return (
          <div key={message.id} className={isWhatsApp ? "space-y-2" : "space-y-3"}>
            {showDate ? <div className={dateBadgeClass}>{currentDate}</div> : null}
            <MessageBubble
              message={message}
              sender={sender}
              isOwn={message.senderId === selfId}
              layout={layout}
              isGroup={isGroup}
            />
          </div>
        )
      })}
    </div>
  )
}
