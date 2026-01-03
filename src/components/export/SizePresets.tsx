import { sizePresets, type SizePreset } from "@/constants/exportPresets"
import { cn } from "@/utils/cn"
import { Button } from "@/components/ui/button"

interface SizePresetsProps {
  selectedId: string
  onSelect: (preset: SizePreset) => void
}

export const SizePresets = ({ selectedId, onSelect }: SizePresetsProps) => (
  <div className="grid gap-2 sm:grid-cols-2">
    {sizePresets.map((preset) => (
      <Button
        key={preset.id}
        variant={preset.id === selectedId ? "default" : "outline"}
        className={cn("flex h-auto items-start justify-between gap-2 px-3 py-2 text-left")}
        onClick={() => onSelect(preset)}
      >
        <div>
          <div className="text-sm font-semibold">{preset.label}</div>
          <div className="text-xs opacity-70">
            {preset.width} x {preset.height}
          </div>
        </div>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide">
          {preset.hint}
        </span>
      </Button>
    ))}
  </div>
)
