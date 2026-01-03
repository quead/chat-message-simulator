import { useMemo, useState } from "react"
import { Copy, Download, Image, Loader2, Palette, StretchHorizontal, StretchVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SizePresets } from "@/components/export/SizePresets"
import { sizePresets } from "@/constants/exportPresets"
import { exportNodeToImage } from "@/utils/export"
import { useConversationStore } from "@/store/conversationStore"
import { cn } from "@/utils/cn"

interface ExportPanelProps {
  targetRef: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement>
}

export const ExportPanel = ({ targetRef }: ExportPanelProps) => {
  const exportSettings = useConversationStore((state) => state.exportSettings)
  const setExportSettings = useConversationStore((state) => state.setExportSettings)
  const [isExporting, setIsExporting] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(true)

  const preset = useMemo(
    () => sizePresets.find((item) => item.id === exportSettings.presetId),
    [exportSettings.presetId],
  )

  const handleExport = async () => {
    if (!targetRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await exportNodeToImage(targetRef.current, exportSettings)
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `chat-export.${exportSettings.format === "jpeg" ? "jpg" : "png"}`
      link.click()
    } catch (error) {
      console.error("Export failed", error)
    } finally {
      setIsExporting(false)
    }
  }

  const settingsSummary = `${exportSettings.width} x ${exportSettings.height} • ${exportSettings.scale}x • ${exportSettings.format.toUpperCase()}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Download Options</h3>
          <p className="text-xs text-slate-500">Craft export-ready dimensions and quality.</p>
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
            onClick={() => setExportSettings({ format: "png", transparent: exportSettings.transparent })}
          >
            PNG
          </Button>
          <Button
            variant={exportSettings.format === "jpeg" ? "default" : "outline"}
            onClick={() => setExportSettings({ format: "jpeg", transparent: false })}
          >
            JPEG
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Background</Label>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Palette className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              value={exportSettings.background}
              onChange={(event) => setExportSettings({ background: event.target.value })}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
            <Switch
              checked={exportSettings.transparent}
              onCheckedChange={(value) => setExportSettings({ transparent: value })}
              disabled={exportSettings.format === "jpeg"}
            />
            <span className={cn("text-xs", exportSettings.format === "jpeg" && "opacity-50")}>
              Transparent
            </span>
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={handleExport} disabled={isExporting}>
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download Export
      </Button>

      {preset ? (
        <p className="text-xs text-slate-500">
          Preset: {preset.label} • {preset.width} x {preset.height}
        </p>
      ) : (
        <p className="text-xs text-slate-500">Custom size active.</p>
      )}
    </div>
  )
}
