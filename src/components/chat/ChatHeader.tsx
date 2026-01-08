import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  MoreHorizontal,
  Phone,
  Shield,
  Video,
} from "lucide-react"
import type { LayoutConfig, LayoutTheme } from "@/types/layout"
import { cn } from "@/utils/cn"
import { Button } from "@/components/ui/button"
import { VerifiedBadge } from "@/components/ui/verified-badge"

interface ChatHeaderProps {
  title: string
  subtitle?: string
  avatarUrl?: string
  avatarFallback?: string
  isVerified?: boolean
  layout: LayoutConfig
  theme: LayoutTheme
}

export const ChatHeader = ({
  title,
  subtitle,
  avatarUrl,
  avatarFallback,
  isVerified,
  layout,
  theme,
}: ChatHeaderProps) => {
  const isWhatsApp = layout.id === "whatsapp"
  const isIMessage = layout.id === "imessage"
  const isSnapchat = layout.id === "snapchat"
  const isMessenger = layout.id === "messenger"
  const isInstagram = layout.id === "instagram"
  const isTinder = layout.id === "tinder"
  const BackIcon = isInstagram ? ChevronLeft : ArrowLeft
  const actionIcons = isWhatsApp
    ? [Video, Phone, Info]
    : isIMessage
      ? [Info]
      : isSnapchat
        ? [Video, Phone]
        : isMessenger
          ? [Phone, Video, Info]
          : isInstagram
            ? [Phone, Video]
            : isTinder
              ? [Shield, MoreHorizontal]
              : [Phone, Video, Info]
  const headerPadding = isWhatsApp
    ? "px-3 py-2"
    : isIMessage
      ? "px-4 py-2.5"
      : isSnapchat
        ? "px-3 py-2"
        : isMessenger
          ? "px-3 py-2"
          : isInstagram
            ? "px-3 py-2.5"
            : isTinder
              ? "px-4 py-3"
              : "px-4 py-3"
  const iconClass = isWhatsApp
    ? "h-5 w-5"
    : isIMessage || isSnapchat
      ? "h-[18px] w-[18px]"
      : isMessenger || isInstagram
        ? "h-[18px] w-[18px]"
        : isTinder
          ? "h-5 w-5"
          : "h-4 w-4"
  const iconButtonClass = cn(
    "text-inherit hover:bg-white/10",
    isWhatsApp && "h-9 w-9 rounded-full",
    isIMessage && "h-8 w-8 rounded-full text-[var(--chat-accent)] hover:bg-black/5",
    isSnapchat && "h-8 w-8 rounded-full text-[var(--chat-header-text)] hover:bg-black/5",
    isMessenger && "h-8 w-8 rounded-full text-[var(--chat-accent)] hover:bg-[color:rgba(0,132,255,0.1)]",
    isInstagram && "h-8 w-8 rounded-full text-[var(--chat-header-text)] hover:bg-white/10",
    isTinder && "h-9 w-9 rounded-full text-[var(--chat-accent)] hover:bg-[color:rgba(253,80,104,0.12)]",
  )
  const avatarClass = isWhatsApp
    ? "h-9 w-9"
    : isIMessage
      ? "h-10 w-10"
      : isSnapchat
        ? "h-8 w-8"
        : isMessenger || isInstagram
          ? "h-9 w-9"
          : isTinder
            ? "h-10 w-10"
            : "h-10 w-10"
  const showHeaderAvatar =
    layout.showAvatars || isIMessage || isSnapchat || isMessenger || isInstagram || isTinder
  const fallbackText = (avatarFallback || title).slice(0, 2).toUpperCase()
  const fallbackClass = cn(
    "flex items-center justify-center rounded-full font-semibold",
    avatarClass,
    isWhatsApp
      ? "bg-white/15 text-[0.75rem]"
      : isIMessage
        ? "bg-black/5 text-[0.7rem]"
        : isSnapchat
          ? "bg-black/5 text-[0.7rem]"
          : isMessenger
            ? "bg-[var(--chat-border)] text-[0.7rem]"
            : isInstagram
              ? "bg-[var(--chat-border)] text-[0.7rem]"
              : isTinder
                ? "bg-[var(--chat-border)] text-[0.7rem] text-[var(--chat-muted)]"
      : "bg-white/15 text-sm",
  )
  const verifiedBadge = isVerified ? (
    <VerifiedBadge className="h-3.5 w-3.5" variant={isWhatsApp ? "whatsapp" : "default"} />
  ) : null
  const avatarNode =
    showHeaderAvatar && avatarUrl ? (
      <img
        src={avatarUrl}
        alt={title}
        className={cn(
          "rounded-full object-cover",
          (isInstagram || isTinder) && "border border-[var(--chat-border)]",
          !isIMessage && !isInstagram && !isTinder && "border border-white/20",
          isSnapchat && "border-black/5",
          avatarClass,
        )}
      />
    ) : (
      <div className={fallbackClass}>{fallbackText}</div>
    )

  return (
    <div
      className={cn(
        "chat-header relative z-10 flex items-center justify-between gap-4",
        headerPadding,
        isWhatsApp
          ? "min-h-[56px]"
          : isIMessage
            ? "min-h-[72px] border-b border-[var(--chat-border)]"
            : isSnapchat
              ? "min-h-[56px] border-b border-[var(--chat-border)]"
              : isMessenger
                ? "min-h-[56px] border-b border-[var(--chat-border)]"
                : isInstagram
          ? "min-h-[56px] border-b border-[var(--chat-border)]"
          : isTinder
            ? "min-h-[64px] border-b border-[var(--chat-border)]"
                    : layout.headerStyle === "compact"
                      ? "min-h-[56px]"
                      : "min-h-[68px]",
      )}
      style={{
        backgroundColor: theme.colors.header,
        color: theme.colors.headerText,
      }}
    >
      {isIMessage ? (
        <>
          <div className="grid w-full grid-cols-[auto_1fr_auto] items-center">
            <Button size="icon" variant="ghost" className={iconButtonClass}>
              <BackIcon className={iconClass} />
            </Button>
            <div className="flex flex-col items-center gap-1 justify-self-center">
              {avatarNode}
              <div className="flex items-center gap-1 text-[0.85rem] font-semibold">
                <span>{title}</span>
                {verifiedBadge}
              </div>
            </div>
            <div className="flex items-center justify-self-end">
              {actionIcons.map((Icon, index) => (
                <Button
                  key={`${layout.id}-action-${index}`}
                  size="icon"
                  variant="ghost"
                  className={iconButtonClass}
                >
                  <Icon className={iconClass} />
                </Button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
        <div
          className={cn(
            "flex items-center",
            isWhatsApp
              ? "gap-2.5"
              : isSnapchat
                ? "gap-2"
                : isMessenger
                ? "gap-2"
                : isInstagram
                  ? "gap-2"
                    : isTinder
                      ? "gap-3"
                      : "gap-3",
          )}
        >
          <Button size="icon" variant="ghost" className={iconButtonClass}>
            <BackIcon className={iconClass} />
          </Button>
            {avatarNode}
            <div>
              <div
                className={cn(
                  "flex items-center gap-1 font-semibold",
                  isWhatsApp
                    ? "text-[0.95rem] leading-tight"
                    : isSnapchat
                      ? "text-[0.9rem]"
                      : isMessenger || isInstagram
                        ? "text-[0.95rem]"
                        : isTinder
                          ? "text-[1rem] leading-tight"
                          : "text-sm",
                )}
              >
                <span>{title}</span>
                {verifiedBadge}
                {isInstagram ? <ChevronRight className="h-3.5 w-3.5 opacity-70" /> : null}
              </div>
              {layout.showStatus && subtitle ? (
                <div
                  className={cn(
                    "opacity-80",
                    isWhatsApp
                      ? "text-[0.7rem] leading-tight"
                      : isSnapchat
                        ? "text-[0.65rem]"
                        : "text-xs",
                  )}
                >
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>
          <div className={cn("flex items-center", isWhatsApp ? "gap-1" : "gap-2")}>
            {actionIcons.map((Icon, index) => (
              <Button
                key={`${layout.id}-action-${index}`}
                size="icon"
                variant="ghost"
                className={iconButtonClass}
              >
                <Icon className={iconClass} />
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
