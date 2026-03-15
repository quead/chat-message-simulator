import { useMemo, useState } from "react"
import { Copy, Download, Image, Loader2, StretchHorizontal, StretchVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SizePresets } from "@/components/export/SizePresets"
import { sizePresets } from "@/constants/exportPresets"
import { exportNodeToImageSequence } from "@/utils/export"
import { useConversationStore } from "@/store/conversationStore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ExportPanelProps {
  targetRef: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement>
  getExportOffset?: () => { x: number; y: number }
  resolvedHeight?: number
  screenScrollTops?: number[]
}

const buildDownloadName = (format: "png" | "jpeg", index?: number) => {
  const extension = format === "jpeg" ? "jpg" : "png"
  if (index === undefined) {
    return `chat-export.${extension}`
  }
  return `chat-export-${String(index + 1).padStart(2, "0")}.${extension}`
}

export const ExportPanel = ({
  targetRef,
  getExportOffset,
  resolvedHeight,
  screenScrollTops = [0],
}: ExportPanelProps) => {
  const exportSettings = useConversationStore((state) => state.exportSettings)
  const setExportSettings = useConversationStore((state) => state.setExportSettings)
  const [isExporting, setIsExporting] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(true)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const effectiveHeight =
    exportSettings.captureMode === "full"
      ? Math.max(resolvedHeight ?? exportSettings.height, exportSettings.height)
      : exportSettings.height
  const effectiveExportSettings = {
    ...exportSettings,
    height: effectiveHeight,
  }

  const preset = useMemo(
    () => sizePresets.find((item) => item.id === exportSettings.presetId),
    [exportSettings.presetId],
  )
  const screenCount = Math.max(screenScrollTops.length, 1)

  const runExport = async (mode: "download" | "preview") => {
    if (!targetRef.current) return
    if (mode === "preview") {
      setPreviewUrls([])
      setPreviewError(null)
      setIsPreviewing(true)
      setIsPreviewOpen(true)
    }
    setIsExporting(true)
    try {
      const renderOptions =
        exportSettings.captureMode === "screens"
          ? screenScrollTops.map((top) => ({
              scrollRootOverrides: [{ top }],
            }))
          : [
              {
                offset: exportSettings.captureMode === "full" ? undefined : getExportOffset?.(),
              },
            ]
      const dataUrls = await exportNodeToImageSequence(
        targetRef.current,
        effectiveExportSettings,
        renderOptions,
      )
      if (mode === "preview") {
        setPreviewUrls(dataUrls)
        return
      }
      dataUrls.forEach((dataUrl, index) => {
        const link = document.createElement("a")
        link.href = dataUrl
        link.download =
          exportSettings.captureMode === "screens"
            ? buildDownloadName(exportSettings.format, index)
            : buildDownloadName(exportSettings.format)
        link.click()
      })
    } catch (error) {
      console.error("Export failed", error)
      if (mode === "preview") {
        const message = error instanceof Error ? error.message : "Unknown error"
        setPreviewError(message)
      }
    } finally {
      setIsExporting(false)
      if (mode === "preview") {
        setIsPreviewing(false)
      }
    }
  }

  const captureSummary =
    exportSettings.captureMode === "full"
      ? "All messages"
      : exportSettings.captureMode === "screens"
        ? `${screenCount} subsequent screens`
        : "Current viewport"
  const settingsSummary = `${exportSettings.width} x ${effectiveHeight} - ${exportSettings.scale}x - ${exportSettings.format.toUpperCase()} - ${captureSummary}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Export</h3>
          <p className="text-xs text-slate-500">Set size, format, and quality before exporting.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsSummaryOpen(!isSummaryOpen)}>
          {isSummaryOpen ? "Collapse" : "Expand"}
        </Button>
      </div>

      {isSummaryOpen ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-slate-500" />
              <span>{settingsSummary}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigator.clipboard.writeText(settingsSummary)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <Label>Device presets</Label>
        <SizePresets
          selectedId={exportSettings.presetId}
          onSelect={(presetItem) =>
            setExportSettings({
              presetId: presetItem.id,
              width: presetItem.width,
              height: presetItem.height,
            })
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Custom width</Label>
          <div className="relative">
            <StretchHorizontal className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="number"
              min={240}
              value={exportSettings.width}
              onChange={(event) =>
                setExportSettings({
                  presetId: "custom",
                  width: Number(event.target.value),
                })
              }
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Custom height</Label>
          <div className="relative">
            <StretchVertical className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="number"
              min={240}
              value={exportSettings.height}
              onChange={(event) =>
                setExportSettings({
                  presetId: "custom",
                  height: Number(event.target.value),
                })
              }
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Quality</Label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((scale) => (
            <Button
              key={scale}
              variant={exportSettings.scale === scale ? "default" : "outline"}
              onClick={() => setExportSettings({ scale })}
            >
              {scale}x
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Format</Label>
        <div className="flex gap-2">
          <Button
            variant={exportSettings.format === "png" ? "default" : "outline"}
            onClick={() => setExportSettings({ format: "png" })}
          >
            PNG
          </Button>
          <Button
            variant={exportSettings.format === "jpeg" ? "default" : "outline"}
            onClick={() => setExportSettings({ format: "jpeg" })}
          >
            JPEG
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Capture</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={exportSettings.captureMode === "viewport" ? "default" : "outline"}
            onClick={() => setExportSettings({ captureMode: "viewport" })}
          >
            Current viewport
          </Button>
          <Button
            variant={exportSettings.captureMode === "full" ? "default" : "outline"}
            onClick={() => setExportSettings({ captureMode: "full" })}
          >
            All messages
          </Button>
          <Button
            variant={exportSettings.captureMode === "screens" ? "default" : "outline"}
            onClick={() => setExportSettings({ captureMode: "screens" })}
          >
            Subsequent screens
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          {exportSettings.captureMode === "full"
            ? `Height expands automatically to ${effectiveHeight}px so every visible message is included.`
            : exportSettings.captureMode === "screens"
              ? `Automatically splits the thread into ${screenCount} device-sized screenshots based on the current export height.`
              : "Export exactly what is visible in the device frame right now."}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={() => runExport("preview")} disabled={isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
          Preview
        </Button>
        <Button onClick={() => runExport("download")} disabled={isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download
        </Button>
      </div>

      <Dialog
        open={isPreviewOpen}
        onOpenChange={(open) => {
          setIsPreviewOpen(open)
          if (!open) {
            setPreviewUrls([])
            setPreviewError(null)
            setIsPreviewing(false)
          }
        }}
      >
        <DialogContent className="w-[94vw] max-w-5xl">
          <DialogHeader>
            <DialogTitle>Export preview</DialogTitle>
            <DialogDescription>{settingsSummary}</DialogDescription>
          </DialogHeader>
          {isPreviewing ? (
            <div className="text-sm text-slate-500">Rendering preview...</div>
          ) : null}
          {previewError ? (
            <div className="text-sm text-red-600">Export failed: {previewError}</div>
          ) : null}
          {previewUrls.length ? (
            <div className="space-y-3">
              {previewUrls.map((previewUrl, index) => (
                <div key={previewUrl} className="space-y-2">
                  {previewUrls.length > 1 ? (
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Screen {index + 1}
                    </div>
                  ) : null}
                  <img
                    src={previewUrl}
                    alt={
                      previewUrls.length > 1
                        ? `Export preview screen ${index + 1}`
                        : "Export preview"
                    }
                    className="max-h-[70vh] w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
                  />
                </div>
              ))}
              <div className="text-xs text-slate-500">
                {previewUrls.length > 1
                  ? "Download saves one image per screen in order."
                  : "Right click the image to save."}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {preset ? (
        <p className="text-xs text-slate-500">
          Preset: {preset.label} - {preset.width} x {preset.height}
        </p>
      ) : (
        <p className="text-xs text-slate-500">Custom size active.</p>
      )}
    </div>
  )
}
