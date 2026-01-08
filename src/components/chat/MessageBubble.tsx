import { Check, CheckCheck } from "lucide-react"
import type { Message } from "@/types/message"
import type { Participant } from "@/types/conversation"
import type { LayoutConfig } from "@/types/layout"
import { cn } from "@/utils/cn"
import { formatTimestamp } from "@/utils/helpers"
import { VerifiedBadge } from "@/components/ui/verified-badge"

interface MessageBubbleProps {
  message: Message
  sender: Participant | undefined
  isOwn: boolean
  layout: LayoutConfig
  isGroup: boolean
  showAvatar?: boolean
}

const statusIcon = (status: Message["status"], className?: string) => {
  const iconClass = cn("h-3.5 w-3.5", className)
  if (status === "read") return <CheckCheck className={iconClass} />
  if (status === "delivered") return <CheckCheck className={cn(iconClass, "opacity-70")} />
  return <Check className={cn(iconClass, "opacity-70")} />
}

export const MessageBubble = ({
  message,
  sender,
  isOwn,
  layout,
  isGroup,
  showAvatar,
}: MessageBubbleProps) => {
  const isWhatsApp = layout.id === "whatsapp"
  const isIMessage = layout.id === "imessage"
  const isSnapchat = layout.id === "snapchat"
  const isMessenger = layout.id === "messenger"
  const isInstagram = layout.id === "instagram"
  const isTinder = layout.id === "tinder"
  const showMessengerAvatar = isMessenger && !isOwn
  const showInstagramAvatar = isInstagram && !isOwn && Boolean(showAvatar)
  const avatarFallback = (sender?.name || "??").slice(0, 2).toUpperCase()
  const showSender = isWhatsApp
    ? isGroup
    : isSnapchat
      ? true
      : isMessenger
        ? isGroup
        : isInstagram
          ? isGroup
          : layout.showAvatars
  const verifiedBadge = sender?.isVerified ? (
    <VerifiedBadge className="h-3.5 w-3.5" variant={isWhatsApp ? "whatsapp" : "default"} />
  ) : null
  const bubbleRadius =
    isWhatsApp
      ? "rounded-[16px]"
      : isIMessage
        ? "rounded-[18px]"
        : isSnapchat
          ? "rounded-none"
          : isMessenger
            ? "rounded-[20px]"
            : isInstagram
              ? "rounded-[20px]"
              : isTinder
                ? "rounded-[22px]"
                : layout.bubbleStyle === "sharp"
                  ? "rounded-md"
                  : layout.bubbleStyle === "minimal"
                    ? "rounded-lg"
                    : "rounded-2xl"
  const bubbleColor = isOwn ? "var(--bubble-sent)" : "var(--bubble-received)"
  const textColor = isOwn ? "var(--bubble-sent-text)" : "var(--bubble-received-text)"
  const snapBorderColor = isOwn ? "var(--bubble-sent)" : "var(--bubble-received)"
  const bubbleStyle: React.CSSProperties & Record<string, string> = {
    backgroundColor: bubbleColor,
    color: textColor,
  }

  if (isWhatsApp) {
    bubbleStyle["--bubble-color"] = bubbleColor
  }
  if (isInstagram && isOwn) {
    bubbleStyle.backgroundImage =
      "linear-gradient(135deg, #7c3aed 0%, #6366f1 55%, #3b82f6 100%)"
  }
  if (isSnapchat) {
    bubbleStyle.backgroundColor = "transparent"
    bubbleStyle.color = snapBorderColor
    bubbleStyle.borderLeftColor = snapBorderColor
    bubbleStyle.borderLeftStyle = "solid"
    bubbleStyle.borderLeftWidth = "3px"
  }
  if (isTinder) {
    if (isOwn) {
      bubbleStyle.backgroundImage = "linear-gradient(135deg, #fd5068 0%, #ff7a59 100%)"
    } else {
      bubbleStyle.border = "1px solid var(--chat-border)"
    }
  }

  const bubbleAlignment = isMessenger
    ? ""
    : isSnapchat
      ? "mr-auto"
      : isOwn
        ? "ml-auto"
        : "mr-auto"
  const bubbleAlignmentClass = showInstagramAvatar ? "" : bubbleAlignment
  const instagramIndentClass =
    isInstagram && !isOwn && !showInstagramAvatar ? "ml-8" : ""
  const messengerAvatar = showMessengerAvatar ? (
    sender?.avatarUrl ? (
      <img
        src={sender.avatarUrl}
        alt={sender?.name || "Avatar"}
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
    ) : (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--chat-border)] text-[0.6rem] font-semibold text-[var(--chat-muted)]">
        {avatarFallback}
      </div>
    )
  ) : null
  const instagramAvatar = showInstagramAvatar ? (
    sender?.avatarUrl ? (
      <img
        src={sender.avatarUrl}
        alt={sender?.name || "Avatar"}
        className="h-6 w-6 shrink-0 rounded-full border border-[var(--chat-border)] object-cover"
      />
    ) : (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--chat-border)] bg-[var(--chat-border)] text-[0.55rem] font-semibold text-[var(--chat-muted)]">
        {avatarFallback}
      </div>
    )
  ) : null
  const bubbleContent = (
    <div
      className={cn(
        "px-3 py-2 text-sm shadow-sm",
        bubbleRadius,
        bubbleAlignmentClass,
        instagramIndentClass,
        isWhatsApp
          ? "whatsapp-bubble relative max-w-[80%] px-3 py-1.5 text-[0.94rem] leading-[1.3] shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
          : isIMessage
            ? "max-w-[76%] px-3 py-2 text-[0.95rem] leading-[1.35]"
            : isSnapchat
              ? "max-w-[82%] px-3 py-1 text-[0.95rem] leading-[1.35] shadow-none"
              : isMessenger
                ? "max-w-[78%] px-3 py-2 text-[0.95rem] leading-[1.35] shadow-none"
                : isInstagram
                  ? "max-w-[78%] px-3 py-2 text-[0.95rem] leading-[1.35] shadow-none"
                  : isTinder
                    ? "max-w-[72%] px-4 py-2 text-[0.95rem] leading-[1.35] shadow-none"
                    : "max-w-[78%]",
        isWhatsApp && (isOwn ? "whatsapp-bubble--own" : "whatsapp-bubble--other"),
      )}
      style={bubbleStyle}
    >
      {message.type === "image" ? (
        <div className="space-y-2">
          <div className="h-24 w-40 rounded-lg border border-white/20 bg-white/10" />
          <p className="text-xs opacity-75">Image placeholder</p>
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
      )}
      {isWhatsApp ? (
        <div
          className="mt-0.5 flex items-center justify-end gap-1 text-[0.6rem] leading-none"
          style={{ color: "var(--chat-muted)" }}
        >
          <span>{formatTimestamp(message.timestamp)}</span>
          {isOwn ? (
            <span
              className={cn(
                "flex items-center gap-1",
                message.status === "read" && "text-[#53bdeb]",
              )}
            >
              {statusIcon(message.status, "h-3 w-3")}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        isSnapchat ? "items-start" : isOwn ? "items-end" : "items-start",
      )}
    >
      {showSender && (isSnapchat || (!isOwn && sender)) ? (
        <div
          className={cn(
            "flex items-center gap-2 text-xs",
            isWhatsApp
              ? "font-medium text-[0.7rem]"
              : isSnapchat
                ? "font-semibold text-[0.7rem] uppercase tracking-wide"
                : isMessenger
                  ? "font-semibold text-[0.7rem]"
                  : isInstagram
                    ? "font-semibold text-[0.7rem]"
                : "text-slate-200",
          )}
          style={
            isWhatsApp
              ? { color: sender?.color }
              : isSnapchat
                ? { color: snapBorderColor }
                : isMessenger
                  ? { color: "var(--chat-muted)" }
                  : isInstagram
                    ? { color: "var(--chat-muted)" }
                    : undefined
          }
        >
          {!isWhatsApp && !isSnapchat ? (
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: sender?.color ?? "transparent" }}
            />
          ) : null}
          <span>{isSnapchat ? (isOwn ? "You" : sender?.name ?? "Unknown") : sender?.name}</span>
          {verifiedBadge}
        </div>
      ) : null}
      {isMessenger ? (
        <div className={cn("flex w-full items-end gap-2", isOwn ? "justify-end" : "justify-start")}>
          {isOwn ? (
            <>
              {bubbleContent}
              {messengerAvatar}
            </>
          ) : (
            <>
              {messengerAvatar}
              {bubbleContent}
            </>
          )}
        </div>
      ) : showInstagramAvatar ? (
        <div className="flex w-full items-end gap-2">
          {instagramAvatar}
          {bubbleContent}
        </div>
      ) : (
        bubbleContent
      )}
      {!isWhatsApp && !isIMessage && !isSnapchat && !isMessenger && !isInstagram && !isTinder ? (
        <div
          className={cn(
            "flex items-center gap-2 text-[0.7rem]",
            isOwn ? "text-right" : "text-left",
            isIMessage && "text-[0.6rem]",
          )}
          style={{ color: "var(--chat-muted)" }}
        >
          <span>{formatTimestamp(message.timestamp)}</span>
          {isOwn ? <span className="flex items-center gap-1">{statusIcon(message.status)}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
