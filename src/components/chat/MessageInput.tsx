import { Camera, ImagePlus, Mic, Plus, Send, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"
import type { LayoutConfig } from "@/types/layout"

interface MessageInputProps {
  placeholder?: string
  layout?: LayoutConfig
}

export const MessageInput = ({ placeholder = "Message", layout }: MessageInputProps) => {
  const isWhatsApp = layout?.id === "whatsapp"
  const isIMessage = layout?.id === "imessage"
  const isSnapchat = layout?.id === "snapchat"
  const isMessenger = layout?.id === "messenger"
  const isTinder = layout?.id === "tinder"
  const iconClass =
    isWhatsApp || isIMessage || isSnapchat || isMessenger || isTinder
      ? "h-[18px] w-[18px]"
      : "h-4 w-4"
  const iconButtonClass = cn(
    "text-[var(--chat-muted)] hover:bg-white/10",
    isWhatsApp && "h-8 w-8 rounded-full",
    isIMessage && "h-8 w-8 rounded-full",
    isSnapchat && "h-8 w-8 rounded-full text-[var(--chat-header-text)] hover:bg-black/5",
    isMessenger && "h-8 w-8 rounded-full text-[var(--chat-accent)] hover:bg-[color:rgba(0,132,255,0.1)]",
    isTinder && "h-9 w-9 rounded-full text-[var(--chat-accent)] hover:bg-[color:rgba(253,80,104,0.12)]",
  )
  const inputPlaceholder = isIMessage
    ? "iMessage"
    : isSnapchat
      ? "Chat"
      : isMessenger
        ? "Aa"
        : isTinder
          ? "Say something nice"
        : placeholder

  return (
    <div
      className={cn(
        "relative z-10 flex items-center gap-2 border-t border-white/10 px-3 py-2",
        isWhatsApp && "gap-1.5 border-black/5 px-2.5 py-2",
        isIMessage && "border-black/5 px-3 py-2",
        isSnapchat && "gap-2 border-black/5 px-3 py-2",
        isMessenger && "gap-2 border-black/5 px-3 py-2",
        isTinder && "gap-2.5 border-black/5 px-4 py-3",
      )}
      style={{ backgroundColor: "var(--chat-input)" }}
    >
      {isTinder ? (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-[var(--chat-border)] px-3 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--chat-accent)] hover:bg-[color:rgba(253,80,104,0.08)]"
          >
            GIF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-[var(--chat-border)] px-3 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--chat-accent)] hover:bg-[color:rgba(253,80,104,0.08)]"
          >
            Sticker
          </Button>
        </>
      ) : null}
      {isMessenger ? (
        <Button
          variant="ghost"
          size="icon"
          className={cn(iconButtonClass, "text-[var(--chat-accent)]")}
        >
          <Plus className={iconClass} />
        </Button>
      ) : null}
      {isSnapchat ? (
        <Button
          variant="ghost"
          size="icon"
          className={cn(iconButtonClass, "text-[var(--chat-header-text)]")}
        >
          <Plus className={iconClass} />
        </Button>
      ) : null}
      {isIMessage ? (
        <Button
          variant="ghost"
          size="icon"
          className={cn(iconButtonClass, "text-[var(--chat-accent)]")}
        >
          <Plus className={iconClass} />
        </Button>
      ) : null}
      {isWhatsApp ? (
        <Button variant="ghost" size="icon" className={iconButtonClass}>
          <Plus className={iconClass} />
        </Button>
      ) : !isIMessage && !isSnapchat && !isMessenger && !isTinder ? (
        <Button variant="ghost" size="icon" className={iconButtonClass}>
          <Smile className={iconClass} />
        </Button>
      ) : null}
      {!isWhatsApp && !isIMessage && !isSnapchat && !isMessenger && !isTinder ? (
        <Button variant="ghost" size="icon" className={iconButtonClass}>
          <ImagePlus className={iconClass} />
        </Button>
      ) : null}
      <div
        className={cn(
          "flex-1 rounded-full px-4 py-2 text-sm",
          isWhatsApp && "min-h-[36px] py-2 text-[0.95rem] shadow-sm",
          isIMessage && "flex items-center gap-2 border py-2 text-[0.95rem]",
          isSnapchat && "flex items-center gap-2 border bg-[var(--chat-input-inner)] py-2 text-[0.95rem]",
          isMessenger && "flex items-center gap-2 border bg-[var(--chat-input-inner)] py-2 text-[0.95rem]",
          isTinder && "flex items-center gap-2 border bg-[var(--chat-input-inner)] py-2 text-[0.95rem]",
        )}
        style={{
          backgroundColor: "var(--chat-input-inner)",
          color: "var(--chat-text)",
          borderColor: isIMessage || isSnapchat || isMessenger || isTinder ? "var(--chat-border)" : undefined,
        }}
      >
        {isIMessage ? <Camera className={cn(iconClass, "text-[var(--chat-muted)]")} /> : null}
        {isSnapchat ? <Smile className={cn(iconClass, "text-[var(--chat-muted)]")} /> : null}
        {isMessenger ? <Smile className={cn(iconClass, "text-[var(--chat-muted)]")} /> : null}
        <span className="text-[var(--chat-muted)]">{inputPlaceholder}</span>
      </div>
      {isWhatsApp ? (
        <Button variant="ghost" size="icon" className={iconButtonClass}>
          <Camera className={iconClass} />
        </Button>
      ) : null}
      {isSnapchat ? (
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-[var(--chat-accent)] text-black shadow-sm hover:opacity-90"
        >
          <Camera className={iconClass} />
        </Button>
      ) : null}
      {isMessenger ? (
        <>
          <Button variant="ghost" size="icon" className={iconButtonClass}>
            <Camera className={iconClass} />
          </Button>
          <Button variant="ghost" size="icon" className={iconButtonClass}>
            <ImagePlus className={iconClass} />
          </Button>
          <Button variant="ghost" size="icon" className={iconButtonClass}>
            <Mic className={iconClass} />
          </Button>
        </>
      ) : null}
      {isWhatsApp ? (
        <Button
          size="icon"
          className={cn(
            "bg-[var(--chat-accent)] text-white hover:opacity-90",
            "h-10 w-10 rounded-full",
          )}
        >
          <Mic className={iconClass} />
        </Button>
      ) : isIMessage ? (
        <Button variant="ghost" size="icon" className={iconButtonClass}>
          <Mic className={iconClass} />
        </Button>
      ) : isTinder ? (
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-[var(--chat-accent)] text-white shadow-sm hover:opacity-90"
        >
          <Send className={iconClass} />
        </Button>
      ) : !isSnapchat && !isMessenger && !isTinder ? (
        <>
          <Button variant="ghost" size="icon" className={iconButtonClass}>
            <Mic className={iconClass} />
          </Button>
          <Button size="icon" className="bg-[var(--chat-accent)] text-white hover:opacity-90">
            <Send className={iconClass} />
          </Button>
        </>
      ) : null}
    </div>
  )
}
