import { Check } from "lucide-react"
import { layoutConfigs } from "@/constants/layouts"
import type { LayoutId } from "@/types/layout"
import { useConversationStore } from "@/store/conversationStore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/utils/cn"

export const LayoutSelector = ({ className }: { className?: string }) => {
  const layoutId = useConversationStore((state) => state.layoutId)
  const setLayout = useConversationStore((state) => state.setLayout)

  return (
    <Select value={layoutId} onValueChange={(value) => setLayout(value as LayoutId)}>
      <SelectTrigger className={cn("h-8 text-sm", className)} aria-label="Messaging app">
        <SelectValue placeholder="Select app" />
      </SelectTrigger>
      <SelectContent>
        {layoutConfigs.map((layout) => (
          <SelectItem key={layout.id} value={layout.id}>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: layout.themes[0].colors.accent }}
              />
              {layout.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Visual app picker: each card is a tiny mock of that app's header and bubbles.
export const LayoutPicker = () => {
  const layoutId = useConversationStore((state) => state.layoutId)
  const themeId = useConversationStore((state) => state.themeId)
  const setLayout = useConversationStore((state) => state.setLayout)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {layoutConfigs.map((layout) => {
        const colors = (layout.themes.find((theme) => theme.id === themeId) ?? layout.themes[0]).colors
        const isActive = layout.id === layoutId
        return (
          <button
            key={layout.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => setLayout(layout.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl border bg-white text-left transition focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none",
              isActive
                ? "border-indigo-500 ring-2 ring-indigo-500/20"
                : "border-slate-200 hover:border-slate-300 hover:shadow-sm",
            )}
          >
            <div className="flex h-[72px] flex-col" style={{ backgroundColor: colors.background }}>
              <div className="h-3 shrink-0" style={{ backgroundColor: colors.header }} />
              <div className="flex flex-1 flex-col justify-center gap-1 px-2">
                <span
                  className="h-2.5 w-3/5 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: colors.bubbleReceived }}
                />
                <span
                  className="ml-auto h-2.5 w-1/2 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: colors.bubbleSent }}
                />
                <span
                  className="h-2.5 w-2/5 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: colors.bubbleReceived }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-1 border-t border-slate-100 px-2.5 py-1.5">
              <span className="truncate text-xs font-medium text-slate-700">{layout.name}</span>
              {isActive ? <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600" /> : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}
