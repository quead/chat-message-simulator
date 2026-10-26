import {
  ArrowDownToLine,
  ArrowUpToLine,
  Download,
  Eye,
  Loader2,
  Maximize,
  Minus,
  Moon,
  PanelTop,
  Plus,
  Sun,
} from "lucide-react"
import type { ChatPreview } from "@/hooks/useChatPreview"
import { getLayoutConfig } from "@/constants/layouts"
import { useConversationStore } from "@/store/conversationStore"
import type { ExportCaptureMode } from "@/store/conversationStore"
import { ChatLayout } from "@/components/layout/ChatLayout"
import { LayoutSelector } from "@/components/layout/LayoutSelector"
import { Button } from "@/components/ui/button"
import { Segmented } from "@/components/ui/segmented"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/utils/cn"
import { clamp } from "@/utils/helpers"
import { describeExport } from "@/utils/export"

interface PreviewPaneProps {
  preview: ChatPreview
  className?: string
}

export const PreviewPane = ({ preview, className }: PreviewPaneProps) => {
  const conversation = useConversationStore((state) => state.conversation)
  const layoutId = useConversationStore((state) => state.layoutId)
  const themeId = useConversationStore((state) => state.themeId)
  const activeParticipantId = useConversationStore((state) => state.activeParticipantId)
  const backgroundImageUrl = useConversationStore((state) => state.backgroundImageUrl)
  const backgroundImageOpacity = useConversationStore((state) => state.backgroundImageOpacity)
  const backgroundColor = useConversationStore((state) => state.backgroundColor)
  const ui = useConversationStore((state) => state.ui)
  const setUi = useConversationStore((state) => state.setUi)
  const setTheme = useConversationStore((state) => state.setTheme)
  const exportSettings = useConversationStore((state) => state.exportSettings)
  const setExportSettings = useConversationStore((state) => state.setExportSettings)

  const { appliedScale, metrics, resolvedHeight, screenCount, exporter } = preview
  const {
    containerRef,
    scrollRef,
    exportRef,
    fullExportRef,
    conversationRef,
    conversationContentRef,
  } = preview.refs
  const layout = getLayoutConfig(layoutId)
  const theme = layout.themes.find((entry) => entry.id === themeId) ?? layout.themes[0]
  const hasDark = layout.themes.some((entry) => entry.id === "dark")
  const visibleMessageCount = conversation.messages.filter((message) => !message.isHidden).length
  const sharedLayoutProps = {
    conversation,
    layout,
    theme,
    showChrome: ui.showChrome,
    activeParticipantId,
    backgroundImageUrl,
    backgroundImageOpacity,
    backgroundColor,
  }
  const setZoom = (zoom: number) => setUi({ zoom: clamp(zoom, 0.25, 2) })

  return (
    <section className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col", className)}>
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white/80 px-3 py-2 backdrop-blur sm:px-4">
        <LayoutSelector className="w-[150px] sm:w-[170px]" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!hasDark}
              onClick={() => setTheme(themeId === "dark" ? "light" : "dark")}
              aria-label={themeId === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {themeId === "dark" ? <Moon /> : <Sun />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{themeId === "dark" ? "Dark theme" : "Light theme"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              aria-pressed={ui.showChrome}
              className={cn(!ui.showChrome && "bg-slate-100 text-slate-400")}
              onClick={() => setUi({ showChrome: !ui.showChrome })}
              aria-label={ui.showChrome ? "Hide header and input bar" : "Show header and input bar"}
            >
              <PanelTop />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{ui.showChrome ? "Hide app header & input bar" : "Show app header & input bar"}</TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          <Button variant="ghost" size="icon-sm" className="hidden h-7 w-7 sm:inline-flex" onClick={() => setZoom(ui.zoom - 0.1)} aria-label="Zoom out">
            <Minus />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="h-7 min-w-14 rounded-md px-1.5 text-xs font-semibold text-slate-700 tabular-nums transition hover:bg-slate-100"
                onClick={() => setUi({ zoom: 1, autoFit: true })}
              >
                {Math.round(appliedScale * 100)}%
              </button>
            </TooltipTrigger>
            <TooltipContent>Reset to fit</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon-sm" className="hidden h-7 w-7 sm:inline-flex" onClick={() => setZoom(ui.zoom + 0.1)} aria-label="Zoom in">
            <Plus />
          </Button>
          <div className="mx-0.5 hidden h-4 w-px bg-slate-200 sm:block" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn("h-7 w-7", ui.autoFit && "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700")}
                aria-pressed={ui.autoFit}
                onClick={() => setUi({ autoFit: !ui.autoFit })}
                aria-label="Fit to screen"
              >
                <Maximize />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{ui.autoFit ? "Fit to screen: on" : "Fit to screen: off (actual size)"}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn("canvas-dots relative min-h-0 flex-1 p-4 sm:p-8", metrics.hasOverflow && "pb-14 sm:pb-16")}
      >
        <div ref={scrollRef} className="hide-scrollbar flex h-full w-full overflow-auto">
          <div
            className="relative m-auto shrink-0 overflow-hidden rounded-[22px] shadow-2xl ring-1 shadow-slate-900/20 ring-slate-900/10"
            style={{
              width: exportSettings.width * appliedScale,
              height: exportSettings.height * appliedScale,
            }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{
                width: exportSettings.width,
                height: exportSettings.height,
                transform: `scale(${appliedScale})`,
              }}
            >
              <div
                ref={exportRef}
                style={{ width: exportSettings.width, height: exportSettings.height }}
              >
                <ChatLayout
                  {...sharedLayoutProps}
                  conversationMode="scroll"
                  conversationContainerRef={conversationRef}
                  conversationContentRef={conversationContentRef}
                />
              </div>
            </div>
          </div>
        </div>

        {metrics.hasOverflow ? (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-slate-900/90 py-1 pr-1 pl-3 text-xs text-white shadow-lg backdrop-blur">
            <span className="mr-1 whitespace-nowrap text-white/80">
              {visibleMessageCount} messages · scroll inside the phone
            </span>
            <button
              type="button"
              className="rounded-full p-1.5 transition hover:bg-white/15"
              onClick={() => preview.scrollConversation("top")}
              aria-label="Jump to first message"
              title="Jump to first message"
            >
              <ArrowUpToLine className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded-full p-1.5 transition hover:bg-white/15"
              onClick={() => preview.scrollConversation("bottom")}
              aria-label="Jump to latest message"
              title="Jump to latest message"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {exportSettings.captureMode === "full" ? (
          <div aria-hidden="true" className="pointer-events-none fixed top-0 left-[-10000px]">
            <div
              ref={fullExportRef}
              style={{ width: exportSettings.width, height: resolvedHeight }}
            >
              <ChatLayout {...sharedLayoutProps} conversationMode="expanded" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-200 bg-white px-3 py-2.5 sm:px-4">
        <Segmented<ExportCaptureMode>
          label="Capture"
          size="sm"
          value={exportSettings.captureMode}
          onChange={(captureMode) => setExportSettings({ captureMode })}
          options={[
            { value: "viewport", label: "Current view", title: "Exactly what the phone shows now" },
            { value: "full", label: "Full chat", title: "One tall image with every visible message" },
            {
              value: "screens",
              label: `${screenCount} ${screenCount === 1 ? "screen" : "screens"}`,
              title: "Consecutive phone-sized screenshots",
            },
          ]}
        />
        <button
          type="button"
          className="hidden text-xs text-slate-500 tabular-nums transition hover:text-slate-900 md:inline"
          onClick={() => setUi({ activePanel: "export", activeView: "editor" })}
          title="Change export settings"
        >
          {describeExport(exportSettings, resolvedHeight, screenCount)}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={exporter.isExporting}
            onClick={() => exporter.run("preview")}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button size="sm" disabled={exporter.isExporting} onClick={() => exporter.run("download")}>
            {exporter.isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
        </div>
      </div>
    </section>
  )
}
