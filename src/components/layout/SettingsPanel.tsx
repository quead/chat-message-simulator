import { useRef, type ReactNode } from "react"
import { ImagePlus, Moon, Sun, X } from "lucide-react"
import { getLayoutConfig } from "@/constants/layouts"
import { useConversationStore } from "@/store/conversationStore"
import { toast } from "@/store/toastStore"
import { useFileDrop } from "@/hooks/useFileDrop"
import { LayoutPicker } from "@/components/layout/LayoutSelector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Segmented } from "@/components/ui/segmented"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/utils/cn"
import { clamp, readImageFile } from "@/utils/helpers"

const BACKGROUND_MAX_SIZE = 1600

const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="space-y-2.5">
    <div>
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      {hint ? <p className="text-xs text-neutral-500">{hint}</p> : null}
    </div>
    {children}
  </section>
)

export const SettingsPanel = () => {
  const layoutId = useConversationStore((state) => state.layoutId)
  const themeId = useConversationStore((state) => state.themeId)
  const setTheme = useConversationStore((state) => state.setTheme)
  const showChrome = useConversationStore((state) => state.ui.showChrome)
  const setUi = useConversationStore((state) => state.setUi)
  const backgroundImageUrl = useConversationStore((state) => state.backgroundImageUrl)
  const backgroundImageOpacity = useConversationStore((state) => state.backgroundImageOpacity)
  const setBackgroundImageUrl = useConversationStore((state) => state.setBackgroundImageUrl)
  const setBackgroundImageOpacity = useConversationStore((state) => state.setBackgroundImageOpacity)
  const clearBackgroundImage = useConversationStore((state) => state.clearBackgroundImage)
  const backgroundColor = useConversationStore((state) => state.backgroundColor)
  const setBackgroundColor = useConversationStore((state) => state.setBackgroundColor)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const layout = getLayoutConfig(layoutId)
  const hasDark = layout.themes.some((theme) => theme.id === "dark")
  const themeBackground =
    (layout.themes.find((theme) => theme.id === themeId) ?? layout.themes[0]).colors.background
  const opacityPercent = Math.round(backgroundImageOpacity * 100)

  const uploadBackground = async (file: File) => {
    try {
      setBackgroundImageUrl(await readImageFile(file, BACKGROUND_MAX_SIZE))
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not read the image.", "error")
    }
  }
  const { isOver, dropProps } = useFileDrop((files) => {
    const image = files.find((file) => file.type.startsWith("image/"))
    if (image) void uploadBackground(image)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-base font-semibold text-neutral-900">Style</h2>
        <p className="text-xs text-neutral-500">Pick the messaging app and how its screen looks.</p>
      </div>

      <Section title="App">
        <LayoutPicker />
      </Section>

      <Section title="Appearance">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-600">Theme</span>
          <Segmented
            label="Theme"
            size="sm"
            value={themeId}
            onChange={(value) => setTheme(value === "dark" && hasDark ? "dark" : "light")}
            options={[
              { value: "light", label: <><Sun />Light</> },
              { value: "dark", label: <><Moon />Dark</> },
            ]}
          />
        </div>
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm text-neutral-600">App header &amp; input bar</span>
            <span className="block text-xs text-neutral-400">Turn off for a bubbles-only image.</span>
          </span>
          <Switch checked={showChrome} onCheckedChange={(value) => setUi({ showChrome: value })} />
        </label>
      </Section>

      <Section title="Wallpaper" hint="Drop an image below, or pick a solid color.">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border border-dashed border-neutral-300 p-2.5 transition",
            isOver && "border-black bg-neutral-50",
          )}
          {...dropProps}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400 transition hover:border-neutral-300 focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:outline-none"
            style={{ backgroundColor: backgroundColor || themeBackground }}
            aria-label="Upload wallpaper image"
          >
            {backgroundImageUrl ? (
              <img
                src={backgroundImageUrl}
                alt=""
                className="h-full w-full object-cover"
                style={{ opacity: backgroundImageOpacity }}
              />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <Button variant="outline" size="xs" onClick={() => fileInputRef.current?.click()}>
                {backgroundImageUrl ? "Replace image" : "Upload image"}
              </Button>
              {backgroundImageUrl ? (
                <Button variant="ghost" size="xs" onClick={clearBackgroundImage}>
                  <X className="h-3.5 w-3.5" />
                  Remove
                </Button>
              ) : null}
            </div>
            <div className={cn("space-y-1", !backgroundImageUrl && "opacity-50")}>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Image opacity</span>
                <span className="tabular-nums">{opacityPercent}%</span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[opacityPercent]}
                onValueChange={(value) => setBackgroundImageOpacity(clamp(value[0] / 100, 0, 1))}
                disabled={!backgroundImageUrl}
                aria-label="Wallpaper image opacity"
              />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) void uploadBackground(file)
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-neutral-200"
            style={{ backgroundColor: backgroundColor || themeBackground }}
          >
            <input
              type="color"
              value={backgroundColor || themeBackground}
              onChange={(event) => setBackgroundColor(event.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Wallpaper color"
            />
          </label>
          <Input
            value={backgroundColor}
            onChange={(event) => setBackgroundColor(event.target.value)}
            placeholder={`${themeBackground} (app default)`}
            className="h-9 font-mono text-xs"
            aria-label="Wallpaper color hex"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBackgroundColor("")}
            disabled={!backgroundColor}
          >
            Reset
          </Button>
        </div>
      </Section>
    </div>
  )
}
