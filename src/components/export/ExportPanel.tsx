import { Download, Eye, Loader2 } from "lucide-react"
import type { ChatPreview } from "@/hooks/useChatPreview"
import { useConversationStore, type ExportCaptureMode } from "@/store/conversationStore"
import { SizePresets } from "@/components/export/SizePresets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Segmented } from "@/components/ui/segmented"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/utils/cn"
import { captureModeLabels, describeExport } from "@/utils/export"

const MAX_EXPORT_SIDE = 4096

export const ExportPanel = ({ preview }: { preview: ChatPreview }) => {
  const exportSettings = useConversationStore((state) => state.exportSettings)
  const setExportSettings = useConversationStore((state) => state.setExportSettings)
  const { exporter, resolvedHeight, screenCount } = preview
  const fullHeight = Math.max(preview.metrics.fullExportHeight, exportSettings.height)

  const captureDescriptions: Record<ExportCaptureMode, string> = {
    viewport: "Exactly what the phone preview shows right now.",
    full: `One tall ${exportSettings.width} × ${fullHeight}px image with every visible message.`,
    screens: `${screenCount} consecutive phone-sized screenshots, top to bottom.`,
  }

  const setDimension = (key: "width" | "height", value: string) => {
    const size = Math.round(Number(value))
    if (size > 0) setExportSettings({ presetId: "custom", [key]: Math.min(size, MAX_EXPORT_SIDE) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-base font-semibold text-slate-900">Export</h2>
        <p className="text-xs text-slate-500">Choose a size and capture mode, then download.</p>
      </div>

      <div className="rounded-xl bg-slate-900 p-3.5 text-white shadow-sm">
        <div className="text-[11px] font-medium tracking-wide text-white/50 uppercase">Output</div>
        <div className="mt-0.5 text-sm font-medium tabular-nums">
          {describeExport(exportSettings, resolvedHeight, screenCount)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/10 text-white hover:bg-white/20"
            disabled={exporter.isExporting}
            onClick={() => exporter.run("preview")}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            size="sm"
            className="bg-white text-slate-900 hover:bg-slate-100"
            disabled={exporter.isExporting}
            onClick={() => exporter.run("download")}
          >
            {exporter.isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download
          </Button>
        </div>
      </div>

      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold text-slate-900">Capture</h3>
        <div className="space-y-1.5" role="radiogroup" aria-label="Capture mode">
          {(Object.keys(captureModeLabels) as ExportCaptureMode[]).map((mode) => {
            const isActive = exportSettings.captureMode === mode
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setExportSettings({ captureMode: mode })}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none",
                  isActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    isActive ? "border-indigo-600" : "border-slate-300",
                  )}
                >
                  {isActive ? <span className="h-2 w-2 rounded-full bg-indigo-600" /> : null}
                </span>
                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    {captureModeLabels[mode]}
                  </span>
                  <span className="block text-xs text-slate-500">{captureDescriptions[mode]}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold text-slate-900">Device size</h3>
        <SizePresets
          selectedId={exportSettings.presetId}
          onSelect={(preset) =>
            setExportSettings({ presetId: preset.id, width: preset.width, height: preset.height })
          }
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={120}
            max={MAX_EXPORT_SIDE}
            value={exportSettings.width}
            onChange={(event) => setDimension("width", event.target.value)}
            className="h-9 tabular-nums"
            aria-label="Width in pixels"
          />
          <span className="text-slate-400">×</span>
          <Input
            type="number"
            min={120}
            max={MAX_EXPORT_SIDE}
            value={exportSettings.height}
            onChange={(event) => setDimension("height", event.target.value)}
            className="h-9 tabular-nums"
            aria-label="Height in pixels"
          />
          <span className="text-xs text-slate-400">px</span>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Image</h3>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600">
            Resolution
            <span className="block text-xs text-slate-400 tabular-nums">
              {exportSettings.width * exportSettings.scale} × {resolvedHeight * exportSettings.scale}px
            </span>
          </span>
          <Segmented
            label="Resolution"
            size="sm"
            value={exportSettings.scale}
            onChange={(scale) => setExportSettings({ scale })}
            options={[1, 2, 3].map((scale) => ({ value: scale, label: `${scale}x` }))}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600">Format</span>
          <Segmented
            label="Format"
            size="sm"
            value={exportSettings.format}
            onChange={(format) => setExportSettings({ format })}
            options={[
              { value: "png", label: "PNG" },
              { value: "jpeg", label: "JPEG" },
            ]}
          />
        </div>
        {exportSettings.format === "jpeg" ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>JPEG quality</span>
              <span className="tabular-nums">{Math.round(exportSettings.quality * 100)}%</span>
            </div>
            <Slider
              min={50}
              max={100}
              step={1}
              value={[Math.round(exportSettings.quality * 100)]}
              onValueChange={(value) => setExportSettings({ quality: value[0] / 100 })}
              aria-label="JPEG quality"
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
