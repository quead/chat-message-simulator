import { useRef, useState } from "react"
import { ImagePlus, Loader2 } from "lucide-react"
import type { Message } from "@/types/message"
import type { Participant } from "@/types/conversation"
import { MESSAGE_IMAGE_MAX_SIZE } from "@/store/fileActions"
import { useFileDrop } from "@/hooks/useFileDrop"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/utils/cn"
import { readImageFile } from "@/utils/helpers"

interface MessageFormProps {
  participants: Participant[]
  initial: Message
  onSubmit: (payload: Pick<Message, "senderId" | "content" | "imageUrl" | "timestamp" | "type" | "status">) => void
  onCancel: () => void
}

const toInputValue = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export const MessageForm = ({ participants, initial, onSubmit, onCancel }: MessageFormProps) => {
  const [content, setContent] = useState(initial.content)
  const [senderId, setSenderId] = useState(initial.senderId)
  const [timestamp, setTimestamp] = useState(toInputValue(initial.timestamp))
  const [type, setType] = useState<Message["type"]>(initial.type)
  const [status, setStatus] = useState<Message["status"]>(initial.status)
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "")
  const [imageError, setImageError] = useState<string | null>(null)
  const [isReadingImage, setIsReadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImage = async (file: File) => {
    setIsReadingImage(true)
    try {
      setImageUrl(await readImageFile(file, MESSAGE_IMAGE_MAX_SIZE))
      setImageError(null)
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Could not read the image.")
    } finally {
      setIsReadingImage(false)
    }
  }

  const { isOver, dropProps } = useFileDrop((files) => {
    const image = files.find((file) => file.type.startsWith("image/"))
    if (image) void handleImage(image)
  })

  const submit = () => {
    if (type === "image" && !imageUrl) {
      setImageError("Upload an image for this message.")
      return
    }
    const parsedTime = new Date(timestamp)
    onSubmit({
      senderId,
      content,
      imageUrl: type === "image" ? imageUrl : undefined,
      timestamp: Number.isNaN(parsedTime.getTime()) ? initial.timestamp : parsedTime.toISOString(),
      type,
      status,
    })
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      onKeyDown={(event) => {
        // Keys from portalled Select menus bubble through React; only handle ones typed in the form.
        if (!event.currentTarget.contains(event.target as Node)) return
        if (event.key === "Escape") {
          event.stopPropagation()
          onCancel()
        } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          submit()
        }
      }}
    >
      <Textarea
        autoFocus
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={type === "image" ? "Caption (optional)" : "Message text"}
        className="min-h-[72px]"
        aria-label={type === "image" ? "Caption" : "Message text"}
      />

      {type === "image" ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border border-dashed border-slate-200 p-2 transition",
            isOver && "border-indigo-400 bg-indigo-50/60",
          )}
          {...dropProps}
        >
          <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
            {isReadingImage ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : imageUrl ? (
              <img src={imageUrl} alt="Message attachment" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-5 w-5 text-slate-300" />
            )}
          </div>
          <div className="space-y-1">
            <Button type="button" variant="outline" size="xs" onClick={() => fileInputRef.current?.click()}>
              {imageUrl ? "Replace image" : "Upload image"}
            </Button>
            <p className="text-[11px] text-slate-400">Or drop / paste an image here.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) void handleImage(file)
            }}
          />
        </div>
      ) : null}
      {imageError ? (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{imageError}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">From</Label>
          <Select value={senderId} onValueChange={setSenderId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sender" />
            </SelectTrigger>
            <SelectContent>
              {participants.map((participant) => (
                <SelectItem key={participant.id} value={participant.id}>
                  {participant.name || "Unnamed"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Type</Label>
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value as Message["type"])
              setImageError(null)
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Message</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="system">System notice</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as Message["status"])}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Time</Label>
          <Input
            type="datetime-local"
            value={timestamp}
            onChange={(event) => setTimestamp(event.target.value)}
            className="h-9 px-2 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isReadingImage}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <span className="ml-auto hidden text-[11px] text-slate-400 pointer-fine:inline">
          Ctrl+Enter to save · Esc to cancel
        </span>
      </div>
    </form>
  )
}
