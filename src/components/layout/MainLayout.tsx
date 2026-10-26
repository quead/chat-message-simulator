import { useEffect } from "react"
import { Upload } from "lucide-react"
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

  const tabs: Array<{ id: UiState["activePanel"]; label: string; count?: number }> = [
    { id: "messages", label: "Messages", count: messageCount },
    { id: "participants", label: "People", count: participantCount },
    { id: "settings", label: "Style" },
    { id: "export", label: "Export" },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="relative flex h-dvh flex-col overflow-hidden bg-neutral-100 text-neutral-900"
        {...dropProps}
      >
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <aside
            className={cn(
              "min-h-0 w-full flex-col border-r border-neutral-200 bg-white lg:flex lg:w-[420px] lg:shrink-0 xl:w-[460px]",
              activeView === "editor" ? "flex" : "hidden",
            )}
          >
            <nav role="tablist" aria-label="Editor sections" className="flex shrink-0 gap-1 border-b border-neutral-200 px-3">
              {tabs.map((tab) => {
                const isActive = activePanel === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setUi({ activePanel: tab.id })}
                    className={cn(
                      "relative -mb-px flex items-center gap-1.5 border-b-2 px-2.5 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none",
                      isActive
                        ? "border-black text-black"
                        : "border-transparent text-neutral-500 hover:text-black",
                    )}
                  >
                    {tab.label}
                    {tab.count !== undefined ? (
                      <span className="text-xs font-normal text-neutral-400 tabular-nums">{tab.count}</span>
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
          <div className="pointer-events-none fixed inset-2 z-50 flex items-start justify-center rounded-lg border-2 border-dashed border-black bg-black/5 pt-20">
            <div className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
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
