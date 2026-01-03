import { toJpeg, toPng } from "html-to-image"
import type { ExportSettings } from "../store/conversationStore"

export const exportNodeToImage = async (
  node: HTMLElement,
  settings: ExportSettings,
): Promise<string> => {
  const imagePlaceholder =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
  const commonOptions = {
    width: settings.width,
    height: settings.height,
    backgroundColor: settings.transparent ? undefined : settings.background,
    pixelRatio: settings.scale,
    cacheBust: true,
    useCORS: true,
    imagePlaceholder,
    style: {
      transform: "scale(1)",
      transformOrigin: "top left",
      width: `${settings.width}px`,
      height: `${settings.height}px`,
      "--chat-radius": "0px",
    },
  }

  if (settings.format === "jpeg") {
    return toJpeg(node, {
      ...commonOptions,
      quality: settings.quality,
    })
  }

  return toPng(node, commonOptions)
}
