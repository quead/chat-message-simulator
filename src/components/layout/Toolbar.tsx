import { useEffect, useRef, useState } from "react"
import { FileDown, FileUp, MoreHorizontal, Redo2, Save, Trash2, Undo2 } from "lucide-react"
import { useConversationStore } from "@/store/conversationStore"
import { getLayoutConfig } from "@/constants/layouts"
import { downloadJson, readJsonFile } from "@/utils/storage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type StoreState = ReturnType<typeof useConversationStore.getState>

const hasPersistedChange = (state: StoreState, prevState: StoreState) =>
  state.conversation !== prevState.conversation ||
  state.layoutId !== prevState.layoutId ||
  state.themeId !== prevState.themeId ||
  state.activeParticipantId !== prevState.activeParticipantId ||
  state.backgroundImageUrl !== prevState.backgroundImageUrl ||
  state.backgroundImageOpacity !== prevState.backgroundImageOpacity ||
  state.backgroundColor !== prevState.backgroundColor ||
  state.exportSettings !== prevState.exportSettings

const formatRelativeTime = (from: number, to: number) => {
  const diffSeconds = Math.max(0, Math.floor((to - from) / 1000))
  if (diffSeconds < 5) return "just now"
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export const Toolbar = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [isResetOpen, setIsResetOpen] = useState(false)
  const conversation = useConversationStore((state) => state.conversation)
  const layoutId = useConversationStore((state) => state.layoutId)
  const themeId = useConversationStore((state) => state.themeId)
  const loadConversation = useConversationStore((state) => state.loadConversation)
  const resetConversation = useConversationStore((state) => state.resetConversation)
  const saveSnapshot = useConversationStore((state) => state.saveSnapshot)
  const clearSnapshot = useConversationStore((state) => state.clearSnapshot)
  const lastAutosaveAt = useConversationStore((state) => state.lastAutosaveAt)
  const setLastAutosaveAt = useConversationStore((state) => state.setLastAutosaveAt)
  const undo = useConversationStore((state) => state.undo)
  const redo = useConversationStore((state) => state.redo)
  const canUndo = useConversationStore((state) => state.history.past.length > 0)
  const canRedo = useConversationStore((state) => state.history.future.length > 0)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const unsubscribe = useConversationStore.subscribe((state, prevState) => {
      if (!prevState) return
      if (hasPersistedChange(state, prevState)) {
        setLastAutosaveAt(Date.now())
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName
        if (tagName === "INPUT" || tagName === "TEXTAREA" || target.isContentEditable) {
          return
        }
      }
      const isModifier = event.ctrlKey || event.metaKey
      if (!isModifier) return
      const key = event.key.toLowerCase()
      if (key === "z") {
        if (event.shiftKey) {
          if (canRedo) redo()
        } else if (canUndo) {
          undo()
        }
        event.preventDefault()
      } else if (key === "y") {
        if (canRedo) redo()
        event.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [canRedo, canUndo, redo, undo])

  const autosaveLabel = lastAutosaveAt
    ? `Autosaved ${formatRelativeTime(lastAutosaveAt, now)}`
    : "Autosave idle"
  const layout = getLayoutConfig(layoutId)
  const theme = layout.themes.find((entry) => entry.id === themeId) ?? layout.themes[0]
  const projectBadges = [
    `${conversation.participants.length} participants`,
    `${conversation.messages.length} messages`,
    `${layout.name} ${theme.name}`,
  ]

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/70 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xs font-semibold uppercase tracking-widest text-white">
            CS
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-slate-900">Chat Message Simulator</div>
            <div className="text-xs text-slate-500">Craft and export chat mockups</div>
            <div className="hidden flex-wrap items-center gap-2 pt-1 sm:flex">
              {projectBadges.map((badge) => (
                <Badge key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <Badge variant="secondary">{autosaveLabel}</Badge>

          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Undo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl/Cmd+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Redo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)</TooltipContent>
            </Tooltip>
          </div>

          <Dialog open={isActionsOpen} onOpenChange={setIsActionsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Project actions</DialogTitle>
                <DialogDescription>
                  Manage files, local storage, and project utilities.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    File
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        downloadJson(conversation, "conversation.json")
                        setIsActionsOpen(false)
                      }}
                    >
                      <FileDown className="h-4 w-4" />
                      Export JSON
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsActionsOpen(false)
                        fileInputRef.current?.click()
                      }}
                    >
                      <FileUp className="h-4 w-4" />
                      Load JSON
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        saveSnapshot()
                        setLastAutosaveAt(Date.now())
                        setIsActionsOpen(false)
                      }}
                    >
                      <Save className="h-4 w-4" />
                      Save Local
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Utilities
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsActionsOpen(false)
                        setIsResetOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Reset project
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset this project?</DialogTitle>
                <DialogDescription>
                  This clears the current conversation, layout, and stored snapshot. You can&apos;t undo this action.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => setIsResetOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    resetConversation()
                    clearSnapshot()
                    setIsResetOpen(false)
                  }}
                >
                  Reset project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (!file) return
            try {
              const data = await readJsonFile(file)
              loadConversation(data)
            } catch (error) {
              console.error("Failed to import JSON", error)
            } finally {
              event.target.value = ""
            }
          }}
        />
      </div>
    </TooltipProvider>
  )
}
