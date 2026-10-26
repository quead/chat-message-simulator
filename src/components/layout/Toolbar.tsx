import { useEffect, useRef, useState } from "react"
import {
  CircleAlert,
  CloudCheck,
  ExternalLink,
  FileDown,
  FileText,
  FileUp,
  MessagesSquare,
  MoreHorizontal,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Undo2,
} from "lucide-react"
import { useConversationStore, useSaveStatus } from "@/store/conversationStore"
import { importConversationFile, undoAction } from "@/store/fileActions"
import { toast } from "@/store/toastStore"
import { downloadJson } from "@/utils/storage"
import { Button } from "@/components/ui/button"
import { Segmented } from "@/components/ui/segmented"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LegalDialog, type LegalDoc } from "@/components/layout/LegalDialog"
import { cn } from "@/utils/cn"

const formatRelativeTime = (from: number, to: number) => {
  const diffSeconds = Math.max(0, Math.floor((to - from) / 1000))
  if (diffSeconds < 10) return "just now"
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)

const SaveIndicator = () => {
  const { savedAt, failed } = useSaveStatus()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 15000)
    return () => window.clearInterval(interval)
  }, [])

  const label = failed ? "Not saved" : "Saved"
  const detail = failed
    ? "Browser storage is full. Export JSON to keep a copy."
    : savedAt
      ? `Autosaved ${formatRelativeTime(savedAt, Math.max(now, savedAt))} in this browser`
      : "Changes are saved in this browser automatically"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
            failed ? "bg-rose-50 text-rose-600" : "text-slate-500",
          )}
        >
          {failed ? <CircleAlert className="h-3.5 w-3.5" /> : <CloudCheck className="h-3.5 w-3.5" />}
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{detail}</TooltipContent>
    </Tooltip>
  )
}

export const Toolbar = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null)
  const conversation = useConversationStore((state) => state.conversation)
  const activeView = useConversationStore((state) => state.ui.activeView)
  const setUi = useConversationStore((state) => state.setUi)
  const resetConversation = useConversationStore((state) => state.resetConversation)
  const undo = useConversationStore((state) => state.undo)
  const redo = useConversationStore((state) => state.redo)
  const canUndo = useConversationStore((state) => state.history.past.length > 0)
  const canRedo = useConversationStore((state) => state.history.future.length > 0)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || !(event.ctrlKey || event.metaKey)) return
      const key = event.key.toLowerCase()
      if (key === "z" && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [redo, undo])

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:gap-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
          <MessagesSquare className="h-[18px] w-[18px]" />
        </div>
        <div className="hidden min-w-0 leading-tight sm:block">
          <div className="truncate font-display text-[15px] font-semibold text-slate-900">
            Chat Message Simulator
          </div>
          <div className="truncate text-[11px] text-slate-500">Realistic chat mockups, ready to export</div>
        </div>
      </div>

      <Segmented
        label="View"
        size="sm"
        className="mx-auto lg:hidden"
        value={activeView}
        onChange={(view) => setUi({ activeView: view })}
        options={[
          { value: "editor", label: "Edit" },
          { value: "preview", label: "Preview" },
        ]}
      />

      <div className="flex items-center gap-1 lg:ml-auto">
        <SaveIndicator />
        <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!canUndo} aria-label="Undo">
              <Undo2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!canRedo} aria-label="Redo">
              <Redo2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Project menu">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
              <FileUp />
              Open conversation…
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                downloadJson(conversation, "conversation.json")
                toast("Conversation saved as JSON")
              }}
            >
              <FileDown />
              Save as JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => {
                resetConversation()
                toast("Project reset to the demo conversation", "info", undoAction)
              }}
            >
              <RotateCcw />
              Reset project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="https://github.com/quead/chat-message-simulator" target="_blank" rel="noreferrer">
                <ExternalLink />
                GitHub
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLegalDoc("terms")}>
              <FileText />
              Terms and Conditions
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLegalDoc("privacy")}>
              <ShieldCheck />
              Privacy Policy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LegalDialog doc={legalDoc} onClose={() => setLegalDoc(null)} />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) await importConversationFile(file)
        }}
      />
    </header>
  )
}
