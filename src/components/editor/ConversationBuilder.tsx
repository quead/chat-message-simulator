import { useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type Modifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  CalendarDays,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  List,
  MessageSquarePlus,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  ScrollText,
  Trash2,
  X,
} from "lucide-react"
import type { Message } from "@/types/message"
import type { Participant } from "@/types/conversation"
import { useConversationStore } from "@/store/conversationStore"
import { undoAction } from "@/store/fileActions"
import { toast } from "@/store/toastStore"
import { MessageForm } from "@/components/editor/MessageForm"
import { MessageComposer } from "@/components/editor/MessageComposer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Segmented } from "@/components/ui/segmented"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/utils/cn"
import {
  formatTimestamp,
  generateId,
  getNextTimestamp,
  getSelfParticipantId,
} from "@/utils/helpers"

const toDateInputValue = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })

const BubblePreview = ({
  message,
  isOwn,
  className,
}: {
  message: Message
  isOwn: boolean
  className?: string
}) => {
  if (message.type === "system") {
    return (
      <div
        className={cn(
          "max-w-[90%] rounded-md bg-neutral-100 px-3 py-1 text-center text-xs text-neutral-500 italic",
          className,
        )}
      >
        <span className="line-clamp-2">{message.content || "System message"}</span>
      </div>
    )
  }
  return (
    <div
      className={cn(
        "max-w-[85%] overflow-hidden rounded-lg text-left text-sm",
        isOwn
          ? "rounded-br-md bg-black text-white"
          : "rounded-bl-md border border-neutral-200 bg-white text-neutral-800",
        className,
      )}
    >
      {message.imageUrl ? (
        <img src={message.imageUrl} alt="" className="max-h-40 w-full object-cover" />
      ) : null}
      {message.content ? (
        <p className="line-clamp-4 px-3 py-1.5 break-words whitespace-pre-wrap">{message.content}</p>
      ) : message.imageUrl ? null : (
        <p className="px-3 py-1.5 italic opacity-60">Empty message</p>
      )}
    </div>
  )
}

interface MessageRowProps {
  message: Message
  sender: Participant | undefined
  isOwn: boolean
  showName: boolean
  isEditing: boolean
  onEdit: () => void
  onDuplicate: () => void
  onToggleHidden: () => void
  onDelete: () => void
}

const MessageRow = ({
  message,
  sender,
  isOwn,
  showName,
  isEditing,
  onEdit,
  onDuplicate,
  onToggleHidden,
  onDelete,
}: MessageRowProps) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: message.id })
  const isSystem = message.type === "system"

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group relative flex items-start gap-1 rounded-lg py-0.5 pr-1",
        isDragging && "z-10 opacity-30",
        isEditing && "bg-neutral-50",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="mt-0.5 flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-neutral-300 transition hover:bg-neutral-100 hover:text-neutral-500 focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          isSystem ? "items-center" : isOwn ? "items-end" : "items-start",
          message.isHidden && "opacity-40",
        )}
      >
        {showName && !isSystem ? (
          <span
            className="mb-0.5 px-1 text-[11px] font-semibold"
            style={{ color: sender?.color ?? "#64748b" }}
          >
            {sender?.name || "Unknown"}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            "flex w-full cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none",
            isSystem ? "justify-center" : isOwn ? "justify-end" : "justify-start",
          )}
          aria-label={`Edit message${message.content ? `: ${message.content.slice(0, 60)}` : ""}`}
        >
          <BubblePreview message={message} isOwn={isOwn} />
        </button>
        <span className="mt-0.5 flex items-center gap-1 px-1 text-[10px] text-neutral-400 tabular-nums">
          {message.isHidden ? <EyeOff className="h-3 w-3" /> : null}
          {formatTimestamp(message.timestamp)}
          {isOwn && !isSystem ? ` · ${message.status}` : ""}
          {message.isHidden ? " · hidden" : ""}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="mt-0.5 h-7 w-7 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
            aria-label="Message actions"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onToggleHidden}>
            {message.isHidden ? <Eye /> : <EyeOff />}
            {message.isHidden ? "Show in chat" : "Hide from chat"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export const ConversationBuilder = () => {
  const messages = useConversationStore((state) => state.conversation.messages)
  const participants = useConversationStore((state) => state.conversation.participants)
  const activeParticipantId = useConversationStore((state) => state.activeParticipantId)
  const updateMessage = useConversationStore((state) => state.updateMessage)
  const deleteMessage = useConversationStore((state) => state.deleteMessage)
  const duplicateMessage = useConversationStore((state) => state.duplicateMessage)
  const setMessages = useConversationStore((state) => state.setMessages)

  const listRef = useRef<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<"list" | "script">("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [isDateOpen, setIsDateOpen] = useState(false)
  const [script, setScript] = useState("")
  const [scriptError, setScriptError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const selfId = getSelfParticipantId(participants, activeParticipantId)
  const otherId = participants.find((participant) => participant.id !== selfId)?.id ?? selfId
  const participantById = new Map(participants.map((participant) => [participant.id, participant]))
  const selfName = participantById.get(selfId)?.name || "You"
  const otherName = participantById.get(otherId)?.name || "Them"
  const hiddenCount = messages.filter((message) => message.isHidden).length
  const dates = new Set(messages.map((message) => toDateInputValue(message.timestamp)))
  const sharedDate = dates.size === 1 ? [...dates][0] : ""
  const draggingMessage = messages.find((message) => message.id === draggingId)
  const positionOf = (id: string | number) => messages.findIndex((message) => message.id === id) + 1

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up message ${positionOf(active.id)} of ${messages.length}.`,
    onDragOver: ({ over }) => (over ? `Message is over position ${positionOf(over.id)}.` : undefined),
    onDragEnd: ({ over }) =>
      over ? `Message dropped at position ${positionOf(over.id)}.` : "Message dropped.",
    onDragCancel: () => "Reordering cancelled.",
  }

  const scrollListToEnd = () =>
    requestAnimationFrame(() =>
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }),
    )

  const handleDateChange = (value: string) => {
    const target = new Date(`${value}T00:00`)
    if (!value || Number.isNaN(target.getTime())) return
    setMessages(
      messages.map((message) => {
        const updated = new Date(message.timestamp)
        if (Number.isNaN(updated.getTime())) return message
        updated.setFullYear(target.getFullYear(), target.getMonth(), target.getDate())
        return { ...message, timestamp: updated.toISOString() }
      }),
    )
  }

  const buildScript = () =>
    messages
      .map((message) => `${message.senderId === selfId ? "<" : ">"} ${message.content}`)
      .join("\n")

  const switchMode = (nextMode: "list" | "script") => {
    setEditingId(null)
    setScriptError(null)
    if (nextMode === "script") setScript(buildScript())
    setMode(nextMode)
  }

  const applyScript = () => {
    if (participants.length < 2) {
      setScriptError("Add at least two people to use script mode.")
      return
    }
    const entries: Array<{ senderId: string; content: string }> = []
    let hasInvalidLine = false
    script.split("\n").forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) return
      const marker = trimmed[0]
      if (marker !== "<" && marker !== ">") {
        if (entries.length) entries[entries.length - 1].content += `\n${trimmed}`
        else hasInvalidLine = true
        return
      }
      const content = trimmed.slice(1).trim()
      if (content) entries.push({ senderId: marker === "<" ? selfId : otherId, content })
    })
    if (hasInvalidLine || entries.length === 0) {
      setScriptError("Start each message line with < or >.")
      return
    }
    const nextMessages: Message[] = []
    entries.forEach((entry, index) => {
      const existing = messages[index]
      nextMessages.push(
        existing
          ? { ...existing, senderId: entry.senderId, content: entry.content }
          : {
              id: generateId(),
              senderId: entry.senderId,
              content: entry.content,
              timestamp: getNextTimestamp(nextMessages),
              type: "text",
              status: "read",
            },
      )
    })
    setMessages(nextMessages)
    setScriptError(null)
    toast(`Applied ${nextMessages.length} messages`, "success", undoAction)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-neutral-100 px-4 py-2">
        <Segmented
          label="Editor mode"
          size="sm"
          value={mode}
          onChange={switchMode}
          options={[
            { value: "list", label: <><List />List</>, title: "Edit and drag messages" },
            { value: "script", label: <><ScrollText />Script</>, title: "Write the whole chat as text" },
          ]}
        />
        {hiddenCount ? (
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <EyeOff className="h-3 w-3" />
            {hiddenCount} hidden
          </span>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Conversation actions">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem disabled={!messages.length} onSelect={() => setIsDateOpen(true)}>
              <CalendarDays />
              Change date of all messages
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!hiddenCount}
              onSelect={() => setMessages(messages.map((message) => ({ ...message, isHidden: false })))}
            >
              <Eye />
              Show all messages
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={hiddenCount === messages.length}
              onSelect={() => setMessages(messages.map((message) => ({ ...message, isHidden: true })))}
            >
              <EyeOff />
              Hide all messages
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              disabled={!messages.length}
              onSelect={() => {
                setMessages([])
                toast("Conversation cleared", "info", undoAction)
              }}
            >
              <Trash2 />
              Clear conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isDateOpen ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-xs text-neutral-500">
          <CalendarDays className="h-4 w-4 text-neutral-400" />
          <span>All messages on</span>
          <Input
            type="date"
            value={sharedDate}
            onChange={(event) => handleDateChange(event.target.value)}
            className="h-8 w-auto text-xs"
          />
          <span>{sharedDate ? "Times stay the same." : "Messages span several days."}</span>
          <Button variant="ghost" size="icon-sm" className="ml-auto h-7 w-7" onClick={() => setIsDateOpen(false)} aria-label="Close">
            <X />
          </Button>
        </div>
      ) : null}

      {mode === "script" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <p className="text-xs leading-relaxed text-neutral-500">
            One message per line. Start with{" "}
            <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1 font-mono">&lt;</kbd> for{" "}
            <span className="font-semibold text-neutral-700">{selfName}</span> or{" "}
            <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1 font-mono">&gt;</kbd> for{" "}
            <span className="font-semibold text-neutral-700">{otherName}</span>. Lines without a marker
            continue the previous message.
          </p>
          <Textarea
            value={script}
            onChange={(event) => {
              setScript(event.target.value)
              setScriptError(null)
            }}
            placeholder={`< Hey, are we still on for tonight?\n> Yes! 8pm at the usual place`}
            className="min-h-48 flex-1 resize-none font-mono text-[13px] leading-relaxed"
            spellCheck={false}
          />
          {scriptError ? (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{scriptError}</div>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={applyScript}>Apply to chat</Button>
            <Button variant="ghost" onClick={() => setScript(buildScript())}>
              Revert
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-black">
                  <MessageSquarePlus className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-neutral-900">No messages yet</div>
                <p className="max-w-xs text-xs text-neutral-500">
                  Type below, drop images anywhere, or switch to Script to paste a whole conversation.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                accessibility={{ announcements }}
                onDragStart={({ active }) => setDraggingId(String(active.id))}
                onDragCancel={() => setDraggingId(null)}
                onDragEnd={({ active, over }) => {
                  setDraggingId(null)
                  if (!over || active.id === over.id) return
                  const oldIndex = messages.findIndex((message) => message.id === active.id)
                  const newIndex = messages.findIndex((message) => message.id === over.id)
                  if (oldIndex === -1 || newIndex === -1) return
                  setMessages(arrayMove(messages, oldIndex, newIndex))
                }}
              >
                <SortableContext
                  items={messages.map((message) => message.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {messages.map((message, index) => {
                      const previous = messages[index - 1]
                      const isEditing = editingId === message.id
                      return (
                        <div key={message.id}>
                          <MessageRow
                            message={message}
                            sender={participantById.get(message.senderId)}
                            isOwn={message.senderId === selfId}
                            showName={
                              !previous ||
                              previous.senderId !== message.senderId ||
                              previous.type === "system"
                            }
                            isEditing={isEditing}
                            onEdit={() => setEditingId(isEditing ? null : message.id)}
                            onDuplicate={() => duplicateMessage(message.id)}
                            onToggleHidden={() =>
                              updateMessage(message.id, { isHidden: !message.isHidden })
                            }
                            onDelete={() => {
                              deleteMessage(message.id)
                              toast("Message deleted", "info", undoAction)
                            }}
                          />
                          {isEditing ? (
                            <div className="mt-1 mb-3 ml-7 rounded-lg border border-neutral-200 bg-white p-3">
                              <MessageForm
                                key={message.id}
                                participants={participants}
                                initial={message}
                                onSubmit={(payload) => {
                                  updateMessage(message.id, payload)
                                  setEditingId(null)
                                }}
                                onCancel={() => setEditingId(null)}
                              />
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {draggingMessage ? (
                    <div
                      className={cn(
                        "flex cursor-grabbing rounded-lg pl-7",
                        draggingMessage.type === "system"
                          ? "justify-center"
                          : draggingMessage.senderId === selfId
                            ? "justify-end"
                            : "justify-start",
                      )}
                    >
                      <BubblePreview
                        message={draggingMessage}
                        isOwn={draggingMessage.senderId === selfId}
                        className=""
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
          <MessageComposer onSent={scrollListToEnd} />
        </>
      )}
    </div>
  )
}
