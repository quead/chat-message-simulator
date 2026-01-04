import { useEffect, useRef, useState } from "react"
import { FileDown, FileUp, Github, MoreHorizontal, Redo2, Save, Trash2, Undo2 } from "lucide-react"
import { useConversationStore } from "@/store/conversationStore"
import { downloadJson, readJsonFile } from "@/utils/storage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

type StoreState = ReturnType<typeof useConversationStore.getState>

const hasPersistedChange = (state: StoreState, prevState: StoreState) =>
  state.conversation !== prevState.conversation ||
  state.layoutId !== prevState.layoutId ||
  state.themeId !== prevState.themeId ||
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
  const [showMobileActions, setShowMobileActions] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const conversation = useConversationStore((state) => state.conversation)
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
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
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
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/quead/chat-message-simulator"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>
            <Badge variant="secondary">{autosaveLabel}</Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => downloadJson(conversation, "conversation.json")}
                >
                  <FileDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Save JSON</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download conversation JSON</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Load JSON</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import conversation JSON</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    saveSnapshot()
                    setLastAutosaveAt(Date.now())
                  }}
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save Local</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manual save to localStorage</TooltipContent>
            </Tooltip>
          </div>

          <Separator className="hidden h-8 w-px bg-slate-200 md:block" />

          <Badge variant="secondary" className="flex sm:hidden">
            {autosaveLabel}
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetConversation()
                  clearSnapshot()
                }}
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset conversation and storage</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileActions((prev) => !prev)}
                className="sm:hidden"
              >
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </Button>
            </TooltipTrigger>
            <TooltipContent>More actions</TooltipContent>
          </Tooltip>

        </div>

        {showMobileActions ? (
          <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-3 sm:hidden">
            <Badge variant="secondary" className="w-full justify-center">
              {autosaveLabel}
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/quead/chat-message-simulator"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadJson(conversation, "conversation.json")}
            >
              <FileDown className="h-4 w-4" />
              Save JSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-4 w-4" />
              Load JSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                saveSnapshot()
                setLastAutosaveAt(Date.now())
              }}
            >
              <Save className="h-4 w-4" />
              Save Local
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetConversation()
                clearSnapshot()
                setShowMobileActions(false)
              }}
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        ) : null}

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
