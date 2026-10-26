import { Monitor, RectangleVertical, Smartphone, Tablet } from "lucide-react"
import { sizePresets, type SizePreset } from "@/constants/exportPresets"
import { cn } from "@/utils/cn"

interface SizePresetsProps {
  selectedId: string
  onSelect: (preset: SizePreset) => void
}

const hintIcons: Record<string, typeof Smartphone> = {
  Tablet,
  Social: RectangleVertical,
  Wide: Monitor,
}

export const SizePresets = ({ selectedId, onSelect }: SizePresetsProps) => (
  <div className="grid grid-cols-2 gap-1.5">
    {sizePresets.map((preset) => {
      const Icon = hintIcons[preset.hint] ?? Smartphone
      const isActive = preset.id === selectedId
      return (
        <button
          key={preset.id}
          type="button"
          aria-pressed={isActive}
          onClick={() => onSelect(preset)}
          className={cn(
            "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none",
            isActive ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-300",
          )}
        >
          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-black" : "text-neutral-400")} />
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium text-neutral-900">{preset.label}</span>
            <span className="block text-[11px] text-neutral-500 tabular-nums">
              {preset.width} × {preset.height}
            </span>
          </span>
        </button>
      )
    })}
  </div>
)
