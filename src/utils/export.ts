import { toJpeg, toPng } from "html-to-image"
import type { ExportSettings } from "../store/conversationStore"

export const exportNodeToImage = async (
  node: HTMLElement,
  settings: ExportSettings,
): Promise<string> => {
  const images = Array.from(node.querySelectorAll("img"))
  await Promise.all(
    images.map((image) => {
      if (image.loading === "lazy") {
        image.loading = "eager"
      }
      if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve()
      }
      if (image.complete && !image.decode) {
        return Promise.resolve()
      }
      return new Promise<void>((resolve) => {
        let settled = false
        const finish = () => {
          if (settled) return
          settled = true
          image.removeEventListener("load", finish)
          image.removeEventListener("error", finish)
          resolve()
        }
        image.addEventListener("load", finish)
        image.addEventListener("error", finish)
        if (image.decode) {
          image.decode().then(finish).catch(finish)
        }
      })
    }),
  )
  const imagePlaceholder =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
  const commonOptions = {
    width: settings.width,
    height: settings.height,
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
