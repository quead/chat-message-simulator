import { toJpeg, toPng } from "html-to-image"
import type { ExportSettings } from "../store/conversationStore"

const IMAGE_LOAD_TIMEOUT_MS = 3000
const EXPORT_TIMEOUT_MS = 20000

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, message: string) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
    promise
      .then((value) => {
        window.clearTimeout(timeoutId)
        resolve(value)
      })
      .catch((error) => {
        window.clearTimeout(timeoutId)
        reject(error)
      })
  })

export const exportNodeToImage = async (
  node: HTMLElement,
  settings: ExportSettings,
  offset?: { x: number; y: number },
): Promise<string> => {
  const images = Array.from(node.querySelectorAll("img"))
  await Promise.all(
    images.map((image) => {
      if (image.loading === "lazy") {
        image.loading = "eager"
      }
      image.decoding = "async"
      if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve()
      }
      if (image.complete && !image.decode) {
        return Promise.resolve()
      }
      return new Promise<void>((resolve) => {
        let settled = false
        let timeoutId = 0
        const finish = () => {
          if (settled) return
          settled = true
          window.clearTimeout(timeoutId)
          image.removeEventListener("load", finish)
          image.removeEventListener("error", finish)
          resolve()
        }
        timeoutId = window.setTimeout(finish, IMAGE_LOAD_TIMEOUT_MS)
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
  const transform = offset
    ? `translate(${-offset.x}px, ${-offset.y}px) scale(1)`
    : "scale(1)"
  const commonOptions = {
    width: settings.width,
    height: settings.height,
    pixelRatio: settings.scale,
    cacheBust: true,
    useCORS: true,
    imagePlaceholder,
    style: {
      transform,
      transformOrigin: "top left",
      width: `${settings.width}px`,
      height: `${settings.height}px`,
      "--chat-radius": "0px",
    },
  }

  const exportPromise =
    settings.format === "jpeg"
      ? toJpeg(node, {
          ...commonOptions,
          quality: settings.quality,
        })
      : toPng(node, commonOptions)

  return withTimeout(exportPromise, EXPORT_TIMEOUT_MS, "Export timed out")
}
