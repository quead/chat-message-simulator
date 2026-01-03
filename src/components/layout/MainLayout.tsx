import { useEffect, useMemo, useRef, useState } from "react"
import {
  Download,
  Eye,
  EyeOff,
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

  const appliedScale = clamp((ui.autoFit ? fitScale : 1) * ui.zoom, 0.1, 2)
  const scaledWidth = exportSettings.width * appliedScale
  const scaledHeight = exportSettings.height * appliedScale

  const panelTabs = [
    { id: "messages", label: "Messages", icon: MessagesSquare },
    { id: "participants", label: "Participants", icon: Users },
    { id: "settings", label: "Settings", icon: SlidersHorizontal },
    { id: "export", label: "Download", icon: Download },
  ] as const

  const quickPresetIds = new Set(["iphone-14-pro", "ipad", "desktop"])
  const quickPresets: SizePreset[] = sizePresets.filter((preset) => quickPresetIds.has(preset.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
      <div className="mx-auto flex flex-col gap-6 px-4 pt-6 pb-24 lg:pb-6">
        <Toolbar />

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <aside
            className={cn(
              "space-y-6",
              (!ui.isSidebarOpen || ui.activeView === "preview") && "hidden lg:block",
            )}
          >
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold text-slate-900">Panels</div>
                <p className="text-xs text-slate-500">Jump between messages, participants, settings, and export.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {panelTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = ui.activePanel === tab.id
                    return (
                      <Button
                        key={tab.id}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setUi({ activePanel: tab.id, activeView: "editor", isSidebarOpen: true })
                        }
                        className="justify-start gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </Button>
                    )
                  })}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {ui.activePanel === "participants" ? <ParticipantManager /> : null}
                {ui.activePanel === "messages" ? <ConversationBuilder /> : null}
                {ui.activePanel === "settings" ? <SettingsPanel /> : null}
                {ui.activePanel === "export" ? <ExportPanel targetRef={exportRef} /> : null}
              </CardContent>
            </Card>
          </aside>

          <main className={cn("space-y-4", ui.activeView === "editor" && "hidden lg:block")}>
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Live Preview</div>
                    <p className="text-xs text-slate-500">Real-time look at the selected layout.</p>
                  </div>
                  <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap">
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
                  <div className="flex h-full w-full items-start justify-start overflow-auto">
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
                    onClick={() => setUi({ activePanel: "settings", activeView: "editor", isSidebarOpen: true })}
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
                      size="lg"
                      className="gap-2"
                      disabled={isQuickExporting}
                      onClick={async () => {
                        if (!exportRef.current) return
                        setIsQuickExporting(true)
                        try {
                          const dataUrl = await exportNodeToImage(exportRef.current, exportSettings)
                          const link = document.createElement("a")
                          link.href = dataUrl
                          link.download = `chat-export.${exportSettings.format === "jpeg" ? "jpg" : "png"}`
                          link.click()
                        } catch (error) {
                          console.error("Quick export failed", error)
                        } finally {
                          setIsQuickExporting(false)
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
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
