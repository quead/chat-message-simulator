import { useEffect } from "react"
import { ImageDown, MessageSquareText, Palette, Upload, Users } from "lucide-react"
import { useConversationStore, type UiState } from "@/store/conversationStore"
import { handleDroppedFiles } from "@/store/fileActions"
import { useChatPreview } from "@/hooks/useChatPreview"
import { useFileDrop } from "@/hooks/useFileDrop"
import { Toolbar } from "@/components/layout/Toolbar"
import { PreviewPane } from "@/components/layout/PreviewPane"
import { SettingsPanel } from "@/components/layout/SettingsPanel"
import { ParticipantManager } from "@/components/editor/ParticipantManager"
import { ConversationBuilder } from "@/components/editor/ConversationBuilder"
import { ExportPanel } from "@/components/export/ExportPanel"
import { ExportPreviewDialog } from "@/components/export/ExportPreviewDialog"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/utils/cn"
import { describeExport } from "@/utils/export"

export const MainLayout = () => {
  const preview = useChatPreview()
  const activeView = useConversationStore((state) => state.ui.activeView)
  const activePanel = useConversationStore((state) => state.ui.activePanel)
  const messageCount = useConversationStore((state) => state.conversation.messages.length)
  const participantCount = useConversationStore((state) => state.conversation.participants.length)
  const exportSettings = useConversationStore((state) => state.exportSettings)
  const setUi = useConversationStore((state) => state.setUi)
  const { isOver, dropProps } = useFileDrop(handleDroppedFiles)

  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setUi({ activeView: "preview" })
    }
  }, [setUi])

  const tabs: Array<{
    id: UiState["activePanel"]
    label: string
    icon: typeof Users
    count?: number
  }> = [
    { id: "messages", label: "Messages", icon: MessageSquareText, count: messageCount },
    { id: "participants", label: "People", icon: Users, count: participantCount },
    { id: "settings", label: "Style", icon: Palette },
    { id: "export", label: "Export", icon: ImageDown },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="relative flex h-dvh flex-col overflow-hidden bg-slate-100 text-slate-900"
        {...dropProps}
      >
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <aside
            className={cn(
              "min-h-0 w-full flex-col border-r border-slate-200 bg-white lg:flex lg:w-[420px] lg:shrink-0 xl:w-[460px]",
              activeView === "editor" ? "flex" : "hidden",
            )}
          >
            <nav role="tablist" aria-label="Editor sections" className="grid shrink-0 grid-cols-4 gap-1 border-b border-slate-200 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activePanel === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setUi({ activePanel: tab.id })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none sm:text-sm",
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    <Icon className="hidden h-4 w-4 shrink-0 min-[400px]:block" />
                    {tab.label}
                    {tab.count !== undefined ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[10px] leading-4 font-semibold tabular-nums",
                          isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {tab.count}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </nav>
            {activePanel === "messages" ? (
              <ConversationBuilder />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {activePanel === "participants" ? <ParticipantManager /> : null}
                {activePanel === "settings" ? <SettingsPanel /> : null}
                {activePanel === "export" ? <ExportPanel preview={preview} /> : null}
              </div>
            )}
          </aside>

          <PreviewPane
            preview={preview}
            className={cn(activeView === "preview" ? "flex" : "hidden", "lg:flex")}
          />
        </div>

        {isOver ? (
          <div className="pointer-events-none fixed inset-2 z-50 flex items-start justify-center rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-500/5 pt-20">
            <div className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/30">
              <Upload className="h-4 w-4" />
              Drop images to add them as messages, or a .json file to open it
            </div>
          </div>
        ) : null}
        <ExportPreviewDialog
          exporter={preview.exporter}
          summary={describeExport(exportSettings, preview.resolvedHeight, preview.screenCount)}
        />
        <Toaster />
      </div>
    </TooltipProvider>
  )
}
