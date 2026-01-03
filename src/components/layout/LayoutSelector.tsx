import { layoutConfigs } from "@/constants/layouts"
import type { LayoutId } from "@/types/layout"
import { useConversationStore } from "@/store/conversationStore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const LayoutSelector = () => {
  const layoutId = useConversationStore((state) => state.layoutId)
  const themeId = useConversationStore((state) => state.themeId)
  const setLayout = useConversationStore((state) => state.setLayout)
  const setTheme = useConversationStore((state) => state.setTheme)

  return (
    <Select
      value={layoutId}
      onValueChange={(value) => {
        const nextLayoutId = value as LayoutId
        setLayout(nextLayoutId)
        const nextLayout =
          layoutConfigs.find((layout) => layout.id === nextLayoutId) ?? layoutConfigs[0]
        const nextTheme =
          nextLayout.themes.find((theme) => theme.id === themeId)?.id ??
          nextLayout.themes[0]?.id ??
          "light"
        setTheme(nextTheme)
      }}
    >
      <SelectTrigger className="w-full sm:w-[200px]">
        <SelectValue placeholder="Select layout" />
      </SelectTrigger>
      <SelectContent>
        {layoutConfigs.map((layout) => (
          <SelectItem key={layout.id} value={layout.id}>
            {layout.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
