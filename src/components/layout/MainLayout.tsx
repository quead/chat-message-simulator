import { useEffect, useMemo, useRef, useState } from "react"
import {
  Download,
  Eye,
  EyeOff,
  Image,
  MessagesSquare,
  Minus,
  Plus,
  ScreenShare,
  SlidersHorizontal,
  SquareStack,
  Users,
} from "lucide-react"
import { layoutConfigs } from "@/constants/layouts"
import { sizePresets, type SizePreset } from "@/constants/exportPresets"
import { useConversationStore } from "@/store/conversationStore"
import { ChatLayout } from "@/components/layout/ChatLayout"
import { Toolbar } from "@/components/layout/Toolbar"
import { ParticipantManager } from "@/components/editor/ParticipantManager"
import { ConversationBuilder } from "@/components/editor/ConversationBuilder"
import { ExportPanel } from "@/components/export/ExportPanel"
import { SettingsPanel } from "@/components/layout/SettingsPanel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LayoutSelector } from "@/components/layout/LayoutSelector"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/utils/cn"
import { clamp } from "@/utils/helpers"
import { exportNodeToImage } from "@/utils/export"

export const MainLayout = () => {
  const exportRef = useRef<HTMLDivElement | null>(null)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const previewScrollRef = useRef<HTMLDivElement | null>(null)
  const [fitScale, setFitScale] = useState(1)
  const conversation = useConversationStore((state) => state.conversation)
  const layoutId = useConversationStore((state) => state.layoutId)
  const themeId = useConversationStore((state) => state.themeId)
  const activeParticipantId = useConversationStore((state) => state.activeParticipantId)
  const backgroundImageUrl = useConversationStore((state) => state.backgroundImageUrl)
  const backgroundImageOpacity = useConversationStore((state) => state.backgroundImageOpacity)
  const backgroundColor = useConversationStore((state) => state.backgroundColor)
  const ui = useConversationStore((state) => state.ui)
  const setUi = useConversationStore((state) => state.setUi)
  const exportSettings = useConversationStore((state) => state.exportSettings)
  const setExportSettings = useConversationStore((state) => state.setExportSettings)
  const setTheme = useConversationStore((state) => state.setTheme)
  const [isQuickExporting, setIsQuickExporting] = useState(false)
  const [quickPreviewUrl, setQuickPreviewUrl] = useState<string | null>(null)
  const [quickPreviewError, setQuickPreviewError] = useState<string | null>(null)
  const [isQuickPreviewing, setIsQuickPreviewing] = useState(false)
  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState(false)

  const handleQuickExport = async (mode: "download" | "preview") => {
    if (!exportRef.current) return
    const filename = `chat-export.${exportSettings.format === "jpeg" ? "jpg" : "png"}`
    if (mode === "preview") {
      setQuickPreviewUrl(null)
      setQuickPreviewError(null)
      setIsQuickPreviewing(true)
      setIsQuickPreviewOpen(true)
    }
    setIsQuickExporting(true)
    try {
      const dataUrl = await exportNodeToImage(exportRef.current, exportSettings, getPreviewOffset())
      if (mode === "preview") {
        setQuickPreviewUrl(dataUrl)
        return
      }
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = filename
      link.click()
    } catch (error) {
      console.error("Quick export failed", error)
      if (mode === "preview") {
        const message = error instanceof Error ? error.message : "Unknown error"
        setQuickPreviewError(message)
      }
    } finally {
      setIsQuickExporting(false)
      if (mode === "preview") {
        setIsQuickPreviewing(false)
      }
    }
  }

  const layout = layoutConfigs.find((item) => item.id === layoutId) ?? layoutConfigs[0]
  const theme = useMemo(
    () => layout.themes.find((item) => item.id === themeId) ?? layout.themes[0],
    [layout, themeId],
  )
  const hasDark = layout.themes.some((themeEntry) => themeEntry.id === "dark")
  const isDark = themeId === "dark"

  useEffect(() => {
    if (typeof window === "undefined") return
    const isSmall = window.matchMedia("(max-width: 1023px)").matches
    if (isSmall) {
      setUi({ activeView: "preview", isSidebarOpen: false })
    }
  }, [setUi])

  useEffect(() => {
    const element = previewContainerRef.current
    if (!element) return

    const updateScale = () => {
      const rect = element.getBoundingClientRect()
      const styles = window.getComputedStyle(element)
      const paddingX =
        parseFloat(styles.paddingLeft || "0") + parseFloat(styles.paddingRight || "0")
      const paddingY =
        parseFloat(styles.paddingTop || "0") + parseFloat(styles.paddingBottom || "0")
      const width = rect.width - paddingX
      const height = rect.height - paddingY
      if (!width || !height) return
      const scaleX = width / exportSettings.width
      const scaleY = height / exportSettings.height
      const nextScale = Math.min(scaleX, scaleY, 1)
      setFitScale(nextScale > 0 ? nextScale : 1)
    }

    const raf = requestAnimationFrame(updateScale)
    const observer = new ResizeObserver(() => requestAnimationFrame(updateScale))
    observer.observe(element)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [exportSettings.width, exportSettings.height, ui.activeView, ui.autoFit])

  useEffect(() => {
    if (ui.activeView === "preview" || !ui.isSidebarOpen) {
      setUi({ activeView: "editor", isSidebarOpen: true })
    }
  }, [setUi, ui.activePanel])

  const appliedScale = clamp((ui.autoFit ? fitScale : 1) * ui.zoom, 0.1, 2)
  const scaledWidth = exportSettings.width * appliedScale
  const scaledHeight = exportSettings.height * appliedScale
  const getPreviewOffset = () => {
    const scrollElement = previewScrollRef.current
    const exportElement = exportRef.current
    if (!scrollElement || !exportElement || appliedScale === 0) {
      return { x: 0, y: 0 }
    }
    const scrollRect = scrollElement.getBoundingClientRect()
    const exportRect = exportElement.getBoundingClientRect()
    const deltaX = scrollRect.left - exportRect.left
    const deltaY = scrollRect.top - exportRect.top
    const rawX = deltaX / appliedScale
    const rawY = deltaY / appliedScale
    const viewWidth = scrollElement.clientWidth / appliedScale
    const viewHeight = scrollElement.clientHeight / appliedScale
    const maxX = Math.max(0, exportSettings.width - viewWidth)
    const maxY = Math.max(0, exportSettings.height - viewHeight)
    const offsetX = clamp(rawX, 0, maxX)
    const offsetY = clamp(rawY, 0, maxY)
    return {
      x: Number.isFinite(offsetX) ? offsetX : 0,
      y: Number.isFinite(offsetY) ? offsetY : 0,
    }
  }

  const panelTabs = [
    {
      id: "participants",
      label: "Participants",
      icon: Users,
      description: "Add people, avatars, and presence details.",
      meta: `${conversation.participants.length} people`,
    },
    {
      id: "messages",
      label: "Messages",
      icon: MessagesSquare,
      description: "Write, reorder, and time the chat flow.",
      meta: `${conversation.messages.length} messages`,
    },
    {
      id: "settings",
      label: "Appearance",
      icon: SlidersHorizontal,
      description: "Pick layout, theme, and background polish.",
      meta: `${layout.name} ${theme.name}`,
    },
    {
      id: "export",
      label: "Export",
      icon: Download,
      description: "Set size, format, and download exports.",
      meta: `${exportSettings.width} x ${exportSettings.height}`,
    },
  ] as const
  const activePanelIndex = panelTabs.findIndex((tab) => tab.id === ui.activePanel)
  const resolvedActivePanelIndex = activePanelIndex === -1 ? 0 : activePanelIndex
  const activePanel = panelTabs[resolvedActivePanelIndex] ?? panelTabs[0]

  const quickPresetIds = new Set(["iphone-14-pro", "ipad", "desktop"])
  const quickPresets: SizePreset[] = sizePresets.filter((preset) => quickPresetIds.has(preset.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
      <div className="mx-auto flex flex-col gap-6 px-4 pt-6 pb-24 lg:pb-6">
        <Toolbar />

        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Workflow
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  Step {resolvedActivePanelIndex + 1} of {panelTabs.length}: {activePanel.label}
                </div>
                <p className="text-xs text-slate-500">{activePanel.description}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {panelTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = ui.activePanel === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setUi({ activePanel: tab.id, activeView: "editor", isSidebarOpen: true })
                    }
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold",
                        isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <aside
            className={cn(
              "space-y-6",
              ui.isSidebarOpen && ui.activeView !== "preview" ? "block" : "hidden",
            )}
          >
            <Card>
              <CardContent className="space-y-6">
                {ui.activePanel === "participants" ? <ParticipantManager /> : null}
                {ui.activePanel === "messages" ? <ConversationBuilder /> : null}
                {ui.activePanel === "settings" ? <SettingsPanel /> : null}
                {ui.activePanel === "export" ? (
                  <ExportPanel targetRef={exportRef} getExportOffset={getPreviewOffset} />
                ) : null}
              </CardContent>
            </Card>
          </aside>

          <main className={cn("space-y-4", ui.activeView === "editor" && "hidden lg:block")}>
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Preview canvas</div>
                    <p className="text-xs text-slate-500">Live view of your layout and message flow.</p>
                  </div>
                  <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden lg:inline-flex"
                      onClick={() =>
                        setUi({
                          isSidebarOpen: !ui.isSidebarOpen,
                          activeView: ui.isSidebarOpen ? "preview" : "editor",
                        })
                      }
                    >
                      {ui.isSidebarOpen ? "Focus preview" : "Show editor"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUi({ showChrome: !ui.showChrome })}
                    >
                      {ui.showChrome ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      <span className="hidden sm:inline">
                        {ui.showChrome ? "Hide chrome" : "Show chrome"}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUi({ zoom: clamp(ui.zoom - 0.1, 0.5, 2) })}
                    >
                      <Minus className="h-4 w-4" />
                      <span className="hidden sm:inline">Zoom out</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUi({ zoom: clamp(ui.zoom + 0.1, 0.5, 2) })}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Zoom in</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setUi({ zoom: 1 })}>
                      <ScreenShare className="h-4 w-4" />
                      <span className="hidden sm:inline">Reset</span>
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <SquareStack className="h-4 w-4" />
                  Zoom {Math.round(appliedScale * 100)}%
                  {ui.autoFit ? " (auto-fit)" : ""} - Export size {exportSettings.width} x {exportSettings.height}
                </div>
              </CardHeader>
              <CardContent>
                <div
                  ref={previewContainerRef}
                  className="flex h-[60vh] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 lg:h-[70vh]"
                >
                  <div
                    ref={previewScrollRef}
                    className="hide-scrollbar flex h-full w-full items-start justify-start overflow-auto"
                  >
                    <div
                      className="relative m-auto"
                      style={{
                        width: scaledWidth,
                        height: scaledHeight,
                      }}
                    >
                      <div
                        className="absolute left-0 top-0"
                        style={{
                          width: exportSettings.width,
                          height: exportSettings.height,
                          transform: `scale(${appliedScale})`,
                          transformOrigin: "top left",
                        }}
                      >
                        <div
                          ref={exportRef}
                          className="h-full w-full"
                          style={{ width: exportSettings.width, height: exportSettings.height }}
                        >
                          <ChatLayout
                            conversation={conversation}
                            layout={layout}
                            theme={theme}
                            showChrome={ui.showChrome}
                            activeParticipantId={activeParticipantId}
                            backgroundImageUrl={backgroundImageUrl}
                            backgroundImageOpacity={backgroundImageOpacity}
                            backgroundColor={backgroundColor}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Layout
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="w-full sm:w-auto">
                        <LayoutSelector />
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-full bg-slate-100 px-3 py-1 sm:justify-start">
                        <span className="text-xs font-semibold text-slate-600">Theme</span>
                        <Switch
                          checked={isDark}
                          onCheckedChange={(value) => setTheme(value && hasDark ? "dark" : "light")}
                          disabled={!hasDark}
                        />
                        <span className="text-xs text-slate-500">{isDark ? "Dark" : "Light"}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setUi({ activePanel: "settings", activeView: "editor", isSidebarOpen: true })
                    }
                  >
                    More settings
                  </Button>
                </div>
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Quick download
                    </div>
                    <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:px-0">
                      {quickPresets.map((preset) => (
                        <Button
                          key={preset.id}
                          variant={exportSettings.presetId === preset.id ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setExportSettings({
                              presetId: preset.id,
                              width: preset.width,
                              height: preset.height,
                            })
                          }
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2, 3].map((scale) => (
                      <Button
                        key={scale}
                        variant={exportSettings.scale === scale ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExportSettings({ scale })}
                      >
                        {scale}x
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      disabled={isQuickExporting}
                      onClick={() => handleQuickExport("preview")}
                    >
                      <Image className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button
                      size="lg"
                      className="gap-2"
                      disabled={isQuickExporting}
                      onClick={() => handleQuickExport("download")}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
                <Dialog
                  open={isQuickPreviewOpen}
                  onOpenChange={(open) => {
                    setIsQuickPreviewOpen(open)
                    if (!open) {
                      setQuickPreviewUrl(null)
                      setQuickPreviewError(null)
                      setIsQuickPreviewing(false)
                    }
                  }}
                >
                  <DialogContent className="w-[94vw] max-w-5xl">
                    <DialogHeader>
                      <DialogTitle>Export preview</DialogTitle>
                      <DialogDescription>
                        {exportSettings.width} x {exportSettings.height} - {exportSettings.scale}x -{" "}
                        {exportSettings.format.toUpperCase()}
                      </DialogDescription>
                    </DialogHeader>
                    {isQuickPreviewing ? (
                      <div className="text-sm text-slate-500">Rendering preview...</div>
                    ) : null}
                    {quickPreviewError ? (
                      <div className="text-sm text-red-600">Export failed: {quickPreviewError}</div>
                    ) : null}
                    {quickPreviewUrl ? (
                      <div className="space-y-2">
                        <img
                          src={quickPreviewUrl}
                          alt="Quick export preview"
                          className="max-h-[70vh] w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
                        />
                        <div className="text-xs text-slate-500">Right click the image to save.</div>
                      </div>
                    ) : null}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </main>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/quead/chat-message-simulator"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                Terms and Conditions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Terms and Conditions</DialogTitle>
                <DialogDescription>
                  By using this app, you agree to these terms.
                </DialogDescription>
                <div className="text-xs text-slate-500">Last updated: 2026-01-03 | Version: 2026-01-03</div>
              </DialogHeader>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">What this app does</div>
                  <p>
                    This app lets you compose chat mockups, preview layouts, and export images.
                    All processing happens in your browser.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Data handling and GDPR</div>
                  <p>
                    We do not collect, store, or process personal data on our servers. Your edits
                    and autosaves stay in your browser&apos;s local storage. You can delete them
                    using Clear or by clearing site data in your browser.
                  </p>
                  <p>
                    We do not run analytics or tracking cookies. Because your content does not
                    leave your device, there is no server-side data controller or processor for
                    your content. If you contact us, we will only use your email to respond.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Third-party resources</div>
                  <p>
                    The app may load fonts or default avatar images from third-party providers.
                    Those providers may receive standard request data such as IP address and user
                    agent. You can replace assets or block network requests if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Your content</div>
                  <p>
                    You are responsible for the content you enter and export. Do not include
                    sensitive data unless you are comfortable storing it locally. Only use content
                    and assets you have the rights to use.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">No warranties</div>
                  <p>
                    The app is provided &quot;as is&quot; and &quot;as available&quot; without any
                    warranties, express or implied, including accuracy, reliability, availability,
                    or fitness for a particular purpose. Use the app at your own risk.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Limitation of liability</div>
                  <p>
                    To the maximum extent permitted by law, we are not liable for any indirect,
                    incidental, special, consequential, or punitive damages, or any loss of data,
                    profits, or business interruption. Our total liability is limited to the
                    amount you paid for the app, which is zero.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Governing law</div>
                  <p>
                    These terms are governed by the laws of Romania. Any disputes are subject to
                    the exclusive jurisdiction of the courts in Romania.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Contact</div>
                  <p>
                    Questions about these terms or GDPR? Email: queadx@gmail.com
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Changes</div>
                  <p>
                    We may update these terms from time to time. Continued use means you accept
                    the updated terms.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                Privacy Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Privacy Policy</DialogTitle>
                <DialogDescription>
                  This policy explains how data is handled in the app.
                </DialogDescription>
                <div className="text-xs text-slate-500">Last updated: 2026-01-03 | Version: 2026-01-03</div>
              </DialogHeader>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Data we collect</div>
                  <p>
                    We do not collect or store your chat content on our servers. Everything you
                    create stays on your device.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Local storage</div>
                  <p>
                    The app uses your browser&apos;s local storage to keep autosaves and settings.
                    You can remove this data with Clear or by clearing site data in your browser.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Third-party requests</div>
                  <p>
                    Fonts and default avatar images may be loaded from third-party services. Those
                    providers may receive standard request data such as IP address and user agent.
                    You can block or replace these resources if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">GDPR readiness</div>
                  <p>
                    Because your content does not leave your device, there is no server-side
                    processing of personal data for the app. If you contact us, we only use your
                    email to respond and do not share it.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Contact</div>
                  <p>
                    Privacy questions? Email: queadx@gmail.com
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Changes</div>
                  <p>
                    We may update this policy from time to time. Continued use means you accept
                    the updated policy.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur lg:hidden">
        <span
          className={cn(
            "text-xs font-semibold",
            ui.activeView === "editor" ? "text-slate-900" : "text-slate-500",
          )}
        >
          Edit
        </span>
        <Switch
          checked={ui.activeView === "preview"}
          onCheckedChange={(checked) =>
            setUi({
              activeView: checked ? "preview" : "editor",
              isSidebarOpen: !checked,
            })
          }
          className="h-8 w-14 bg-slate-200 data-[state=checked]:bg-slate-900"
          thumbClassName="h-6 w-6 data-[state=checked]:translate-x-6"
        />
        <span
          className={cn(
            "text-xs font-semibold",
            ui.activeView === "preview" ? "text-slate-900" : "text-slate-500",
          )}
        >
          Live
        </span>
      </div>
    </div>
  )
}
