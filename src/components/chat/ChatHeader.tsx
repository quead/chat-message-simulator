import { ArrowLeft, Info, Phone, Video } from "lucide-react"
import type { LayoutConfig, LayoutTheme } from "@/types/layout"
import { cn } from "@/utils/cn"
import { Button } from "@/components/ui/button"

interface ChatHeaderProps {
  title: string
  subtitle?: string
  avatarUrl?: string
  avatarFallback?: string
  layout: LayoutConfig
  theme: LayoutTheme
}

export const ChatHeader = ({
  title,
  subtitle,
  avatarUrl,
  avatarFallback,
  layout,
  theme,
}: ChatHeaderProps) => {
  const isWhatsApp = layout.id === "whatsapp"
  const isIMessage = layout.id === "imessage"
  const isSnapchat = layout.id === "snapchat"
  const isMessenger = layout.id === "messenger"
  const actionIcons = isWhatsApp
    ? [Video, Phone, Info]
    : isIMessage
      ? [Info]
      : isSnapchat
        ? [Video, Phone]
        : isMessenger
          ? [Phone, Video, Info]
          : [Phone, Video, Info]
  const headerPadding = isWhatsApp
    ? "px-3 py-2"
    : isIMessage
      ? "px-4 py-2.5"
      : isSnapchat
        ? "px-3 py-2"
        : isMessenger
          ? "px-3 py-2"
        : "px-4 py-3"
  const iconClass = isWhatsApp
    ? "h-5 w-5"
    : isIMessage || isSnapchat
      ? "h-[18px] w-[18px]"
      : isMessenger
        ? "h-[18px] w-[18px]"
      : "h-4 w-4"
  const iconButtonClass = cn(
    "text-inherit hover:bg-white/10",
    isWhatsApp && "h-9 w-9 rounded-full",
    isIMessage && "h-8 w-8 rounded-full text-[var(--chat-accent)] hover:bg-black/5",
    isSnapchat && "h-8 w-8 rounded-full text-[var(--chat-header-text)] hover:bg-black/5",
    isMessenger && "h-8 w-8 rounded-full text-[var(--chat-accent)] hover:bg-[color:rgba(0,132,255,0.1)]",
  )
  const avatarClass = isWhatsApp
    ? "h-9 w-9"
    : isIMessage
      ? "h-10 w-10"
      : isSnapchat
        ? "h-8 w-8"
        : isMessenger
          ? "h-9 w-9"
        : "h-10 w-10"
  const showHeaderAvatar = layout.showAvatars || isIMessage || isSnapchat || isMessenger
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
          : "bg-white/15 text-sm",
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
              <ArrowLeft className={iconClass} />
            </Button>
            <div className="flex flex-col items-center gap-1 justify-self-center">
              {showHeaderAvatar && avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={title}
                  className={cn("rounded-full object-cover", avatarClass)}
                />
              ) : (
                <div className={fallbackClass}>{fallbackText}</div>
              )}
              <div className="text-[0.85rem] font-semibold">{title}</div>
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
            isWhatsApp ? "gap-2.5" : isSnapchat ? "gap-2" : isMessenger ? "gap-2" : "gap-3",
          )}
        >
          <Button size="icon" variant="ghost" className={iconButtonClass}>
            <ArrowLeft className={iconClass} />
          </Button>
            {showHeaderAvatar && avatarUrl ? (
              <img
                src={avatarUrl}
                alt={title}
                className={cn(
                  "rounded-full border border-white/20 object-cover",
                  isSnapchat && "border-black/5",
                  avatarClass,
                )}
              />
            ) : (
              <div className={fallbackClass}>{fallbackText}</div>
            )}
            <div>
              <div
                className={cn(
                  "font-semibold",
                  isWhatsApp
                    ? "text-[0.95rem] leading-tight"
                    : isSnapchat
                      ? "text-[0.9rem]"
                      : isMessenger
                        ? "text-[0.95rem]"
                        : "text-sm",
                )}
              >
                {title}
              </div>
              {layout.showStatus && subtitle ? (
                <div
                  className={cn(
                    "opacity-80",
                    isWhatsApp ? "text-[0.7rem] leading-tight" : isSnapchat ? "text-[0.65rem]" : "text-xs",
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
