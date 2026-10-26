import { useRef, useState } from "react"
import { ImagePlus, Loader2, Plus, SendHorizontal, SlidersHorizontal, X } from "lucide-react"
import type { MessageStatus } from "@/types/message"
import { useConversationStore } from "@/store/conversationStore"
import { MESSAGE_IMAGE_MAX_SIZE, undoAction } from "@/store/fileActions"
import { toast } from "@/store/toastStore"
import { useFileDrop } from "@/hooks/useFileDrop"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ParticipantAvatar } from "@/components/ui/participant-avatar"
import { Segmented } from "@/components/ui/segmented"
import { cn } from "@/utils/cn"
import { getNextTimestamp, getSelfParticipantId, nextParticipantColor, readImageFile } from "@/utils/helpers"

const MAX_TEXTAREA_HEIGHT = 144

const resizeTextarea = (element: HTMLTextAreaElement | null) => {
  if (!element) return
  element.style.height = "auto"
  element.style.height = `${Math.min(element.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
}

export const MessageComposer = ({ onSent }: { onSent?: () => void }) => {
  const participants = useConversationStore((state) => state.conversation.participants)
  const messages = useConversationStore((state) => state.conversation.messages)
  const activeParticipantId = useConversationStore((state) => state.activeParticipantId)
  const addMessage = useConversationStore((state) => state.addMessage)
  const addParticipant = useConversationStore((state) => state.addParticipant)
  const removeParticipant = useConversationStore((state) => state.removeParticipant)
  const setActiveParticipant = useConversationStore((state) => state.setActiveParticipant)
  const setUi = useConversationStore((state) => state.setUi)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const selfId = getSelfParticipantId(participants, activeParticipantId)
  const [preferredSenderId, setPreferredSenderId] = useState(selfId)
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isReadingImage, setIsReadingImage] = useState(false)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [type, setType] = useState<"text" | "system">("text")
  const [status, setStatus] = useState<MessageStatus>("read")
  const [timestamp, setTimestamp] = useState("")

  const senderId = participants.some((participant) => participant.id === preferredSenderId)
    ? preferredSenderId
    : selfId
  const sender = participants.find((participant) => participant.id === senderId)
  const canSend = Boolean(senderId) && Boolean(content.trim() || imageUrl) && !isReadingImage

  const attachImage = async (file: File) => {
    setIsReadingImage(true)
    try {
      setImageUrl(await readImageFile(file, MESSAGE_IMAGE_MAX_SIZE))
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not read the image.", "error")
    } finally {
      setIsReadingImage(false)
    }
  }

  const { isOver, dropProps } = useFileDrop((files) => {
    const image = files.find((file) => file.type.startsWith("image/"))
    if (image) void attachImage(image)
    else toast("Drop an image to attach it to this message.", "info")
  })

  const send = (switchSender: boolean) => {
    if (!canSend) return
    addMessage({
      senderId,
      content: content.trim(),
      imageUrl: imageUrl || undefined,
      type: imageUrl ? "image" : type,
      status,
      timestamp: timestamp ? new Date(timestamp).toISOString() : getNextTimestamp(messages),
    })
    setContent("")
    setImageUrl("")
    setTimestamp("")
    requestAnimationFrame(() => resizeTextarea(textareaRef.current))
    if (switchSender && participants.length > 1) {
      const index = participants.findIndex((participant) => participant.id === senderId)
      setPreferredSenderId(participants[(index + 1) % participants.length].id)
    }
    textareaRef.current?.focus()
    onSent?.()
  }

  const addPerson = () => {
    addParticipant({
      name: `Person ${participants.length + 1}`,
      status: "online",
      color: nextParticipantColor(participants),
    })
    // The store appends, so the new person is last; send as them next.
    const added = useConversationStore.getState().conversation.participants.at(-1)
    if (added) setPreferredSenderId(added.id)
    toast(`Added ${added?.name ?? "a person"}`, "success", {
      label: "Rename",
      onClick: () => setUi({ activePanel: "participants" }),
    })
  }

  if (!participants.length) {
    return (
      <div className="shrink-0 border-t border-neutral-200 p-4 text-center text-xs text-neutral-500">
        Add people in the People tab to start writing messages.
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-neutral-200 bg-white px-3 pt-2.5 pb-3" {...dropProps}>
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        <span className="shrink-0 pr-1 text-xs text-neutral-400">From</span>
        {participants.map((participant) => {
          const isActive = participant.id === senderId
          const name = participant.name || "Unnamed"
          return (
            <div
              key={participant.id}
              className={cn(
                "group flex h-7 shrink-0 items-center rounded-md border text-xs font-medium transition-colors",
                isActive
                  ? "border-black bg-black text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-black",
              )}
            >
              <button
                type="button"
                aria-pressed={isActive}
                title={`Write as ${name} · double-click to make ${name} "you"`}
                onClick={() => {
                  setPreferredSenderId(participant.id)
                  textareaRef.current?.focus()
                }}
                onDoubleClick={() => {
                  if (participant.id === selfId) return
                  setActiveParticipant(participant.id)
                  toast(`${name} is now you: their messages show on the sending side`, "success", undoAction)
                }}
                className="flex h-full items-center gap-1.5 rounded-l-md pr-1 pl-1 select-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none"
              >
                <ParticipantAvatar participant={participant} className="h-5 w-5 text-[9px]" />
                {name}
                {participant.id === selfId ? <span className="font-normal opacity-60">you</span> : null}
              </button>
              <button
                type="button"
                aria-label={`Remove ${name}`}
                title={`Remove ${name}`}
                onClick={() => {
                  removeParticipant(participant.id)
                  toast(`Removed ${name} and their messages`, "info", undoAction)
                }}
                className="flex h-full w-5 items-center justify-center rounded-r-md opacity-0 transition-opacity group-hover:opacity-50 hover:!opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none pointer-coarse:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )
        })}
        <button
          type="button"
          onClick={addPerson}
          className="flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none"
        >
          <Plus className="h-3 w-3" />
          Person
        </button>
        <button
          type="button"
          onClick={() => setUi({ activePanel: "participants" })}
          className="ml-auto h-7 shrink-0 rounded-md px-2 text-xs text-neutral-400 transition-colors hover:text-black focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none"
        >
          Manage
        </button>
      </div>

      {imageUrl || isReadingImage ? (
        <div className="mb-2 flex items-center gap-2.5">
          <div className="relative h-14 w-14 shrink-0">
            {isReadingImage ? (
              <div className="flex h-full w-full items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
              </div>
            ) : (
              <img src={imageUrl} alt="Attached" className="h-full w-full rounded-lg border border-neutral-200 object-cover" />
            )}
            <button
              type="button"
              className="absolute -top-1.5 -right-1.5 rounded-md bg-black p-0.5 text-white"
              onClick={() => setImageUrl("")}
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <span className="text-xs text-neutral-500">Image attached. Add an optional caption.</span>
        </div>
      ) : null}

      <div
        className={cn(
          "flex items-end gap-1 rounded-lg border border-neutral-200 bg-white p-1 transition focus-within:border-black",
          isOver && "border-black bg-neutral-50",
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-lg"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach image"
          title="Attach image (or paste / drop one)"
        >
          <ImagePlus />
        </Button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(event) => {
            setContent(event.target.value)
            resizeTextarea(event.target)
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
            event.preventDefault()
            send(event.ctrlKey || event.metaKey || event.altKey)
          }}
          onPaste={(event) => {
            const image = Array.from(event.clipboardData.files).find((file) =>
              file.type.startsWith("image/"),
            )
            if (!image) return
            event.preventDefault()
            void attachImage(image)
          }}
          placeholder={
            type === "system" && !imageUrl
              ? "System notice, e.g. “Avery joined the chat”"
              : `Message as ${sender?.name || "Unnamed"}…`
          }
          aria-label="Message text"
          className="max-h-36 min-h-8 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("rounded-lg", isOptionsOpen && "bg-neutral-100 text-neutral-900")}
          aria-pressed={isOptionsOpen}
          onClick={() => setIsOptionsOpen((open) => !open)}
          aria-label="Message options"
          title="Type, status and time"
        >
          <SlidersHorizontal />
        </Button>
        <Button
          size="icon-sm"
          className="rounded-lg bg-black hover:bg-black"
          disabled={!canSend}
          onClick={() => send(false)}
          aria-label="Add message"
        >
          <SendHorizontal />
        </Button>
      </div>

      {isOptionsOpen ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2.5 rounded-lg bg-neutral-50 p-2.5">
          <div className="space-y-1">
            <span className="block text-[11px] font-medium text-neutral-500">Type</span>
            <Segmented
              label="Message type"
              size="sm"
              value={imageUrl ? "text" : type}
              onChange={setType}
              options={[
                { value: "text", label: imageUrl ? "Image" : "Message" },
                { value: "system", label: "Notice" },
              ]}
            />
          </div>
          <div className="space-y-1">
            <span className="block text-[11px] font-medium text-neutral-500">Status</span>
            <Segmented<MessageStatus>
              label="Delivery status"
              size="sm"
              value={status}
              onChange={setStatus}
              options={[
                { value: "sent", label: "Sent" },
                { value: "delivered", label: "Delivered" },
                { value: "read", label: "Read" },
              ]}
            />
          </div>
          <label className="block w-full space-y-1">
            <span className="block text-[11px] font-medium text-neutral-500">Time</span>
            <span className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={timestamp}
                onChange={(event) => setTimestamp(event.target.value)}
                className="h-8 w-auto px-2 text-xs"
              />
              <span className="text-[11px] text-neutral-400">
                {timestamp ? "Next messages follow this time." : "Empty: 1 min after the last message."}
              </span>
            </span>
          </label>
        </div>
      ) : null}

      <p className="mt-1.5 hidden text-[11px] text-neutral-400 pointer-fine:block">
        <kbd className="font-sans font-semibold">Enter</kbd> add ·{" "}
        <kbd className="font-sans font-semibold">Shift+Enter</kbd> new line ·{" "}
        <kbd className="font-sans font-semibold">Ctrl+Enter</kbd> add &amp; switch ·{" "}
        <kbd className="font-sans font-semibold">Double-click</kbd> name to make them you
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) void attachImage(file)
        }}
      />
    </div>
  )
}
