import { Camera, Check, CheckCheck, ChevronLeft, Mic, Phone, Plus, Sticker, Video } from "lucide-react"
import type { Message } from "@/types/message"
import type { Participant } from "@/types/conversation"
import { cn } from "@/utils/cn"
import { formatTimestamp } from "@/utils/helpers"
import { AvatarImage } from "@/components/ui/avatar-image"
import { VerifiedBadge } from "@/components/ui/verified-badge"

// WhatsApp for iOS, 2026 "Liquid Glass" design (app 26.35+): a transparent header and a floating
// composer over the wallpaper, glass controls, rounder bubbles, frameless media.
// No backdrop-filter: html-to-image can't render it, so glass is a translucent fill plus a hairline.

const glassClass =
  "bg-[var(--chat-input-inner)] shadow-[0_1px_8px_rgba(0,0,0,0.1),inset_0_0_0_0.5px_var(--chat-border)]"

// Scroll-edge fade: content passing under the floating bars dims instead of colliding with them.
const fade = (direction: "bottom" | "top") =>
  `linear-gradient(to ${direction}, var(--chat-bg) 55%, transparent)`

const DefaultAvatar = ({ group, className }: { group?: boolean; className?: string }) => (
  <span
    className={cn("relative inline-flex shrink-0 items-end justify-center overflow-hidden rounded-full", className)}
    aria-hidden="true"
  >
    <span className="absolute inset-0 bg-[var(--chat-muted)] opacity-35" />
    <svg viewBox="0 0 24 24" className="relative h-[88%] w-[88%] fill-white/90">
      {group ? (
        <>
          <circle cx="15.8" cy="9.4" r="3.4" opacity="0.7" />
          <path d="M10.2 24c0-4.3 2.5-7.2 5.6-7.2s5.6 2.9 5.6 7.2z" opacity="0.7" />
          <circle cx="9" cy="10.6" r="3.9" />
          <path d="M2.4 24c0-4.7 3-7.8 6.6-7.8s6.6 3.1 6.6 7.8z" />
        </>
      ) : (
        <>
          <circle cx="12" cy="9.5" r="4.6" />
          <path d="M3.4 24c0-5.2 3.9-8.6 8.6-8.6s8.6 3.4 8.6 8.6z" />
        </>
      )}
    </svg>
  </span>
)

interface WhatsAppHeaderProps {
  title: string
  subtitle?: string
  avatarUrl?: string
  isVerified?: boolean
  isGroup?: boolean
}

export const WhatsAppHeader = ({ title, subtitle, avatarUrl, isVerified, isGroup }: WhatsAppHeaderProps) => (
  <div
    className="flex items-center gap-2 px-4 pt-2 pb-6"
    style={{ backgroundImage: fade("bottom"), color: "var(--chat-header-text)" }}
  >
    <span className={cn(glassClass, "flex h-10 w-10 shrink-0 items-center justify-center rounded-full")}>
      <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
    </span>
    {avatarUrl ? (
      <AvatarImage src={avatarUrl} alt={title} className="h-9 w-9" />
    ) : (
      <DefaultAvatar group={isGroup} className="h-9 w-9" />
    )}
    <div className="min-w-0 flex-1 leading-tight">
      <div className="flex items-center gap-1 text-[16px] font-semibold">
        <span className="truncate">{title}</span>
        {isVerified ? <VerifiedBadge className="h-4 w-4 shrink-0" /> : null}
      </div>
      {subtitle ? <div className="truncate text-[12px] text-[var(--chat-muted)]">{subtitle}</div> : null}
    </div>
    <span className={cn(glassClass, "flex h-10 shrink-0 items-center gap-5 rounded-full px-4")}>
      <Video className="h-[22px] w-[22px]" strokeWidth={1.6} />
      <Phone className="h-[19px] w-[19px]" strokeWidth={1.6} />
    </span>
  </div>
)

export const WhatsAppComposer = () => (
  <div
    className="flex items-center gap-1.5 px-3 pt-3 pb-4"
    style={{ backgroundImage: fade("top"), color: "var(--chat-header-text)" }}
  >
    <span className={cn(glassClass, "flex h-10 w-10 shrink-0 items-center justify-center rounded-full")}>
      <Plus className="h-6 w-6" strokeWidth={1.6} />
    </span>
    <span className={cn(glassClass, "flex h-10 min-w-0 flex-1 items-center justify-end rounded-full px-3")}>
      <Sticker className="h-5 w-5" strokeWidth={1.6} />
    </span>
    <span className={cn(glassClass, "flex h-10 w-10 shrink-0 items-center justify-center rounded-full")}>
      <Camera className="h-5 w-5" strokeWidth={1.6} />
    </span>
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--chat-accent)] text-white">
      <Mic className="h-5 w-5" strokeWidth={2} />
    </span>
  </div>
)

const Meta = ({
  message,
  isOwn,
  onMedia,
  className,
}: {
  message: Message
  isOwn: boolean
  onMedia?: boolean
  className?: string
}) => {
  const tickClass = cn("h-[15px] w-[15px]", message.status === "read" ? "text-[#53bdeb]" : !onMedia && "opacity-60")
  return (
    <span className={cn("inline-flex items-center gap-[3px] text-[11px] leading-none whitespace-nowrap", className)}>
      <span className={onMedia ? undefined : "opacity-60"}>{formatTimestamp(message.timestamp)}</span>
      {isOwn ? (
        message.status === "sent" ? (
          <Check className={tickClass} strokeWidth={2} />
        ) : (
          <CheckCheck className={tickClass} strokeWidth={2} />
        )
      ) : null}
    </span>
  )
}

// Text plus an invisible copy of the meta, so the real (absolutely placed) meta never overlaps the last line.
const TextWithMeta = ({ text, message, isOwn }: { text: string; message: Message; isOwn: boolean }) => (
  <>
    <p className="break-words whitespace-pre-wrap">
      {text}
      <Meta message={message} isOwn={isOwn} className="invisible ml-2" />
    </p>
    <Meta message={message} isOwn={isOwn} className="absolute right-2.5 bottom-[6px]" />
  </>
)

const Tail = ({ isOwn }: { isOwn: boolean }) => (
  <svg
    viewBox="0 0 10 16"
    aria-hidden="true"
    className={cn("absolute bottom-0 h-4 w-2.5", isOwn ? "-right-1.5" : "-left-1.5")}
    style={{
      fill: isOwn ? "var(--bubble-sent)" : "var(--bubble-received)",
      transform: isOwn ? undefined : "scaleX(-1)",
    }}
  >
    <path d="M0 0H4V6C4 11 6.5 14.5 10 16H0Z" />
  </svg>
)

interface WhatsAppBubbleProps {
  message: Message
  sender: Participant | undefined
  isOwn: boolean
  isGroup: boolean
  isFirstInRun: boolean
  isLastInRun: boolean
}

export const WhatsAppBubble = ({
  message,
  sender,
  isOwn,
  isGroup,
  isFirstInRun,
  isLastInRun,
}: WhatsAppBubbleProps) => {
  const showSenderName = isGroup && !isOwn && isFirstInRun && Boolean(sender)
  const showAvatarColumn = isGroup && !isOwn
  const senderName = showSenderName ? (
    <div className="flex items-center gap-1 text-[13px] leading-[18px] font-semibold" style={{ color: sender?.color }}>
      <span className="truncate">{sender?.name}</span>
      {sender?.isVerified ? <VerifiedBadge className="h-3.5 w-3.5 shrink-0" /> : null}
    </div>
  ) : null
  const image = message.imageUrl ? (
    <img
      src={message.imageUrl}
      alt={message.content || "Photo"}
      className="block max-h-[320px] w-[260px] max-w-full object-cover"
    />
  ) : (
    <div className="h-40 w-[240px] max-w-full bg-black/10" />
  )
  const isFramelessMedia = message.type === "image" && !message.content

  const body = isFramelessMedia ? (
    <div className="min-w-0">
      {senderName ? <div className="mb-1 px-1">{senderName}</div> : null}
      <div className="relative overflow-hidden rounded-[16px] [filter:drop-shadow(0_1px_0.5px_rgba(0,0,0,0.13))]">
        {image}
        <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/45 to-transparent px-2.5 pt-6 pb-1.5 text-white">
          <Meta message={message} isOwn={isOwn} onMedia />
        </div>
      </div>
    </div>
  ) : (
    <div
      className={cn(
        "relative min-w-0 rounded-[18px] text-[16px] leading-[21px] [filter:drop-shadow(0_1px_0.5px_rgba(0,0,0,0.13))]",
        message.type === "image" ? "p-[3px]" : "px-2.5 pt-1.5 pb-[7px]",
        isLastInRun && (isOwn ? "rounded-br-[4px]" : "rounded-bl-[4px]"),
      )}
      style={{
        backgroundColor: isOwn ? "var(--bubble-sent)" : "var(--bubble-received)",
        color: isOwn ? "var(--bubble-sent-text)" : "var(--bubble-received-text)",
      }}
    >
      {message.type === "image" ? (
        <>
          {senderName ? <div className="px-[7px] pt-[3px] pb-1">{senderName}</div> : null}
          <div className="overflow-hidden rounded-[15px]">{image}</div>
          <div className="max-w-[260px] px-[7px] pt-1 pb-1">
            <TextWithMeta text={message.content} message={message} isOwn={isOwn} />
          </div>
        </>
      ) : (
        <>
          {senderName}
          <TextWithMeta text={message.content} message={message} isOwn={isOwn} />
        </>
      )}
      {isLastInRun ? <Tail isOwn={isOwn} /> : null}
    </div>
  )

  return (
    <div className={cn("flex w-full items-end gap-1.5", isOwn ? "justify-end pl-14" : "justify-start pr-14")}>
      {showAvatarColumn ? (
        isLastInRun ? (
          sender?.avatarUrl ? (
            <AvatarImage src={sender.avatarUrl} alt={sender.name} className="h-7 w-7" />
          ) : (
            <DefaultAvatar className="h-7 w-7" />
          )
        ) : (
          <span className="w-7 shrink-0" />
        )
      ) : null}
      {body}
    </div>
  )
}
