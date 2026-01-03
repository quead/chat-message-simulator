import { useRef, useState } from "react"
import { FileDown, FileUp, MoreHorizontal, Save, Trash2 } from "lucide-react"
import { useConversationStore } from "@/store/conversationStore"
import { downloadJson, readJsonFile } from "@/utils/storage"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

export const Toolbar = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showMobileActions, setShowMobileActions] = useState(false)
  const conversation = useConversationStore((state) => state.conversation)
  const loadConversation = useConversationStore((state) => state.loadConversation)
  const resetConversation = useConversationStore((state) => state.resetConversation)
  const saveSnapshot = useConversationStore((state) => state.saveSnapshot)
  const clearSnapshot = useConversationStore((state) => state.clearSnapshot)

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
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 md:flex">
              Storage
            </div>
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
                <Button variant="secondary" size="sm" onClick={saveSnapshot}>
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save Local</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manual save to localStorage</TooltipContent>
            </Tooltip>
          </div>

          <Separator className="hidden h-8 w-px bg-slate-200 md:block" />

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
            <Button variant="secondary" size="sm" onClick={saveSnapshot}>
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
