import { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS, type Transform } from "@dnd-kit/utilities"
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import type { Message } from "@/types/message"
import { useConversationStore } from "@/store/conversationStore"
import { MessageForm } from "@/components/editor/MessageForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/utils/cn"
import { formatTimestamp, generateId } from "@/utils/helpers"

const toDateInputValue = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

const MessageRow = ({
  message,
  onEdit,
  onDelete,
  isActionsOpen,
  onToggleActions,
}: {
  message: Message
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleVisibility: () => void
  isActionsOpen: boolean
  onToggleActions: () => void
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: message.id,
    animateLayoutChanges: () => false,
  })

  const isHidden = Boolean(message.isHidden)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: "none",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:bg-slate-50",
        isHidden && "bg-slate-50 text-slate-500",
        isDragging && "ring-2 ring-slate-900/20",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="hidden cursor-grab sm:inline-flex"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </Button>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm font-medium break-words whitespace-normal sm:truncate",
            isHidden ? "text-slate-500" : "text-slate-900",
          )}
          title={message.content}
        >
          {message.content}
        </div>
        <div className="text-xs text-slate-500">
          {message.type} - {formatTimestamp(message.timestamp)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          size="icon"
          className={cn(isActionsOpen && "bg-slate-100")}
          onClick={onToggleActions}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More actions</span>
        </Button>
      </div>
    </div>
  )
}

export const ConversationBuilder = () => {
  const messages = useConversationStore((state) => state.conversation.messages)
  const participants = useConversationStore((state) => state.conversation.participants)
  const activeParticipantId = useConversationStore((state) => state.activeParticipantId)
  const addMessage = useConversationStore((state) => state.addMessage)
  const updateMessage = useConversationStore((state) => state.updateMessage)
  const deleteMessage = useConversationStore((state) => state.deleteMessage)
  const duplicateMessage = useConversationStore((state) => state.duplicateMessage)
  const setMessages = useConversationStore((state) => state.setMessages)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [openActionsId, setOpenActionsId] = useState<string | null>(null)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"standard" | "easy">("standard")
  const [easyInput, setEasyInput] = useState("")
  const [easyError, setEasyError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const { globalDate, hasMixedDates } = useMemo(() => {
    if (messages.length === 0) {
      return { globalDate: "", hasMixedDates: false }
    }
    const dateValues = messages.map((message) => toDateInputValue(message.timestamp))
    const uniqueDates = new Set(dateValues)
    return {
      globalDate: uniqueDates.size === 1 ? dateValues[0] : "",
      hasMixedDates: uniqueDates.size > 1,
    }
  }, [messages])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  const restrictToVerticalAxis = ({ transform }: { transform: Transform }) => ({
    ...transform,
    x: 0,
  })

  const moveMessage = (messageId: string, direction: -1 | 1) => {
    const index = messages.findIndex((message) => message.id === messageId)
    const targetIndex = index + direction
    if (index === -1 || targetIndex < 0 || targetIndex >= messages.length) return
    setMessages(arrayMove(messages, index, targetIndex))
  }

  const handleGlobalDateChange = (value: string) => {
    if (!value || messages.length === 0) return
    const target = new Date(`${value}T00:00`)
    if (Number.isNaN(target.getTime())) return
    setMessages(
      messages.map((message) => {
        const current = new Date(message.timestamp)
        if (Number.isNaN(current.getTime())) return message
        const updated = new Date(current)
        updated.setFullYear(target.getFullYear(), target.getMonth(), target.getDate())
        return { ...message, timestamp: updated.toISOString() }
      }),
    )
  }

  const resolveReceiverId = () => {
    const fallback = participants[0]?.id ?? ""
    if (!activeParticipantId) return fallback
    return participants.find((participant) => participant.id !== activeParticipantId)?.id ?? fallback
  }

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone })
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 2400)
  }

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    },
    [],
  )

  const buildEasyText = () =>
    messages
      .map((message) => {
        const marker = message.senderId === activeParticipantId ? "<" : ">"
        return `${marker} ${message.content}`
      })
      .join("\n")

  const handleViewModeChange = (mode: "standard" | "easy") => {
    setEditingId(null)
    setOpenActionsId(null)
    setEasyError(null)
    if (mode === "easy") {
      setEasyInput(buildEasyText())
    }
    setViewMode(mode)
  }

  const handleEasyApply = () => {
    const receiverId = resolveReceiverId()
    if (!activeParticipantId || !receiverId) {
      setEasyError("Add at least two participants to use easy mode.")
      showToast("Add at least two participants to use easy mode.", "error")
      return
    }

    const lines = easyInput.split("\n")
    const entries: Array<{ senderId: string; content: string }> = []
    let hasInvalidLine = false

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) return
      const marker = trimmed[0]
      if (marker !== "<" && marker !== ">") {
        if (entries.length) {
          entries[entries.length - 1].content += `\n${trimmed}`
        } else {
          hasInvalidLine = true
        }
        return
      }
      const content = trimmed.slice(1).trim()
      if (!content) return
      const senderId = marker === "<" ? activeParticipantId : receiverId
      entries.push({ senderId, content })
    })

    if (hasInvalidLine || entries.length === 0) {
      setEasyError("Use < or > at the start of each message line.")
      showToast("Use < or > at the start of each message line.", "error")
      return
    }

    const now = Date.now()
    const nextMessages = entries.map((entry, index) => {
      const existing = messages[index]
      if (existing) {
        return {
          ...existing,
          senderId: entry.senderId,
          content: entry.content,
        }
      }
      return {
        id: generateId(),
        senderId: entry.senderId,
        content: entry.content,
        timestamp: new Date(now + index * 1000).toISOString(),
        type: "text" as const,
        status: "sent" as const,
      }
    })

    setMessages(nextMessages)
    setEasyError(null)
    showToast("Easy changes applied.")
  }

  const hasHidden = messages.some((message) => message.isHidden)
  const hasVisible = messages.some((message) => !message.isHidden)
  const activeParticipant = participants.find((participant) => participant.id === activeParticipantId)
  const receiverParticipant = participants.find(
    (participant) => participant.id === resolveReceiverId(),
  )

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Conversation Builder</h3>
          <p className="text-xs text-slate-500">Add, reorder, and refine each message.</p>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Messages</h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">{messages.length} total</span>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Label className="text-[10px] uppercase text-slate-400">Global date</Label>
                <Input
                  type="date"
                  value={globalDate}
                  onChange={(event) => handleGlobalDateChange(event.target.value)}
                  className="h-8 w-[145px] text-xs"
                  disabled={messages.length === 0}
                />
                <span className="text-xs text-slate-400">
                  {hasMixedDates ? "Mixed dates" : "Keeps time-of-day"}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setMessages(messages.map((message) => ({ ...message, isHidden: true })))
                }
                disabled={!hasVisible}
              >
                Hide all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setMessages(messages.map((message) => ({ ...message, isHidden: false })))
                }
                disabled={!hasHidden}
              >
                Show all
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase text-slate-400">Editor view</div>
              <p className="text-xs text-slate-500">Switch between the list and easy text editor.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "standard" ? "default" : "outline"}
                onClick={() => handleViewModeChange("standard")}
              >
                Standard
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "easy" ? "default" : "outline"}
                onClick={() => handleViewModeChange("easy")}
              >
                Easy
              </Button>
            </div>
          </div>
          {viewMode === "easy" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs uppercase text-slate-400">Easy editor</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEasyInput(buildEasyText())}
                >
                  Refresh
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                <Textarea
                  value={easyInput}
                  onChange={(event) => {
                    setEasyInput(event.target.value)
                    if (easyError) setEasyError(null)
                  }}
                  placeholder={`< ${activeParticipant?.name ?? "Sender"} message\n> ${receiverParticipant?.name ?? "Receiver"} message`}
                  className="min-h-[280px] resize-y"
                />
                <p className="text-xs text-slate-500">
                  <span className="font-semibold">&lt;</span> = {activeParticipant?.name ?? "Sender"},{" "}
                  <span className="font-semibold">&gt;</span> = {receiverParticipant?.name ?? "Receiver"}.
                  New lines become new messages, timestamps default to now.
                </p>
                {easyError ? (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {easyError}
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="button" onClick={handleEasyApply}>
                  Apply changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEasyInput("")
                    setEasyError(null)
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                  No messages yet. Add the first entry above.
                </div>
              ) : null}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={({ active, over }) => {
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
                  <div className="space-y-2">
                    {messages.map((message) => {
                      const canMoveUp = messages[0]?.id !== message.id
                      const canMoveDown = messages[messages.length - 1]?.id !== message.id
                      const isActionsOpen = openActionsId === message.id
                      return (
                        <div key={message.id} className="space-y-2">
                          <MessageRow
                            message={message}
                            onEdit={() => {
                              setEditingId(message.id)
                              setIsAdvancedOpen(false)
                              setOpenActionsId(null)
                            }}
                            onToggleVisibility={() =>
                              updateMessage(message.id, { isHidden: !message.isHidden })
                            }
                            onDuplicate={() => {
                              duplicateMessage(message.id)
                              setOpenActionsId(null)
                            }}
                            onDelete={() => {
                              deleteMessage(message.id)
                              setOpenActionsId(null)
                            }}
                            isActionsOpen={isActionsOpen}
                            onToggleActions={() =>
                              setOpenActionsId((current) => (current === message.id ? null : message.id))
                            }
                          />
                          {isActionsOpen ? (
                            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                              <div className="flex items-center gap-1 sm:hidden">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => moveMessage(message.id, -1)}
                                  disabled={!canMoveUp}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                  <span className="sr-only">Move up</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => moveMessage(message.id, 1)}
                                  disabled={!canMoveDown}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                  <span className="sr-only">Move down</span>
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  updateMessage(message.id, { isHidden: !message.isHidden })
                                  setOpenActionsId(null)
                                }}
                              >
                                {message.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                {message.isHidden ? "Show in chat" : "Hide from chat"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  duplicateMessage(message.id)
                                  setOpenActionsId(null)
                                }}
                              >
                                <Copy className="h-4 w-4" />
                                Duplicate
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="sm:hidden"
                                onClick={() => {
                                  deleteMessage(message.id)
                                  setOpenActionsId(null)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          ) : null}
                          {editingId === message.id ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <MessageForm
                                key={message.id}
                                participants={participants}
                                initial={message}
                                defaultSenderId={activeParticipantId}
                                compact
                                advancedOpen={isAdvancedOpen}
                                onToggleAdvanced={() => setIsAdvancedOpen((prev) => !prev)}
                                onSubmit={(payload) => {
                                  updateMessage(message.id, payload)
                                  setEditingId(null)
                                }}
                                onCancel={() => setEditingId(null)}
                                submitLabel="Save changes"
                              />
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
        {viewMode === "standard" ? (
          <>
            <Separator />
            <div className="space-y-3">
              {isAddOpen ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <MessageForm
                    key="new"
                    participants={participants}
                    initial={null}
                    defaultSenderId={activeParticipantId}
                    compact
                    resetOnSubmit
                    onSubmit={(payload) => {
                      addMessage(payload)
                    }}
                    submitLabel="Add message"
                  />
                </div>
              ) : null}
              <Button
                type="button"
                className="w-full"
                variant={isAddOpen ? "outline" : "default"}
                onClick={() => setIsAddOpen((prev) => !prev)}
              >
                {isAddOpen ? "Hide add message" : "Add message"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
      {toast ? (
        <div
          className="pointer-events-none fixed top-5 left-1/2 z-50 w-[90%] -translate-x-1/2 sm:w-auto"
          aria-live="polite"
        >
          <div
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium shadow-lg",
              toast.tone === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-600 text-white",
            )}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </TooltipProvider>
  )
}
