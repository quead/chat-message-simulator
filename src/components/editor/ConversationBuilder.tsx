import { useState } from "react"
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
import { CSS } from "@dnd-kit/utilities"
import { Copy, GripVertical, Pencil, Trash2 } from "lucide-react"
import type { Message } from "@/types/message"
import { useConversationStore } from "@/store/conversationStore"
import { MessageForm } from "@/components/editor/MessageForm"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/utils/cn"
import { formatTimestamp } from "@/utils/helpers"

const MessageRow = ({
  message,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  message: Message
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: message.id,
    animateLayoutChanges: () => false,
  })

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
        isDragging && "ring-2 ring-slate-900/20",
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Drag to reorder</TooltipContent>
      </Tooltip>
      <div className="min-w-0 flex-1">
        <div
          className="text-sm font-medium text-slate-900 break-words whitespace-normal sm:truncate"
          title={message.content}
        >
          {message.content}
        </div>
        <div className="text-xs text-slate-500">
          {message.type} - {formatTimestamp(message.timestamp)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicate</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export const ConversationBuilder = () => {
  const messages = useConversationStore((state) => state.conversation.messages)
  const participants = useConversationStore((state) => state.conversation.participants)
  const addMessage = useConversationStore((state) => state.addMessage)
  const updateMessage = useConversationStore((state) => state.updateMessage)
  const deleteMessage = useConversationStore((state) => state.deleteMessage)
  const duplicateMessage = useConversationStore((state) => state.duplicateMessage)
  const setMessages = useConversationStore((state) => state.setMessages)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Conversation Builder</h3>
          <p className="text-xs text-slate-500">Add, reorder, and refine each message.</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Messages</h4>
            <span className="text-xs text-slate-500">{messages.length} total</span>
          </div>
          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No messages yet. Add the first entry above.
            </div>
          ) : null}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
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
                {messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <MessageRow
                      message={message}
                      onEdit={() => {
                        setEditingId(message.id)
                        setIsAdvancedOpen(false)
                      }}
                      onDuplicate={() => duplicateMessage(message.id)}
                      onDelete={() => deleteMessage(message.id)}
                    />
                    {editingId === message.id ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <MessageForm
                          key={message.id}
                          participants={participants}
                          initial={message}
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
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <Separator />
        <div className="space-y-3">
          {isAddOpen ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <MessageForm
                key="new"
                participants={participants}
                initial={null}
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
      </div>
    </TooltipProvider>
  )
}


