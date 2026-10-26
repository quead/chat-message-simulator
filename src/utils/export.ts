import { toJpeg, toPng } from "html-to-image"
import type { ExportFormat, ExportSettings } from "../store/conversationStore"
import { readFileAsDataUrl } from "./helpers"

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

// Keep in sync with the Roboto @import in index.css: it is the only webfont the preview renders with.
const PREVIEW_FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"

const inlineFontCss = async () => {
  const response = await fetch(PREVIEW_FONT_CSS_URL)
  if (!response.ok) throw new Error(`Font CSS request failed (${response.status})`)
  const css = await response.text()
  const urls = [...new Set(Array.from(css.matchAll(/url\((['"]?)(.+?)\1\)/g), (match) => match[2]))]
  const dataUrls = await Promise.all(
    urls.map(async (url) => {
      const fontResponse = await fetch(url)
      if (!fontResponse.ok) throw new Error(`Font request failed (${fontResponse.status})`)
      return readFileAsDataUrl(await fontResponse.blob())
    }),
  )
  return urls.reduce((result, url, index) => result.replaceAll(url, dataUrls[index]), css)
}

let fontEmbedCssPromise: Promise<string> | null = null

// html-to-image's own font discovery calls rule.style.fontFamily.trim(), which crashes in Firefox
// builds where CSSFontFaceDescriptors has no fontFamily (issue #5). Embedding fonts ourselves avoids
// that path and fetches the fonts once instead of once per exported screen.
const getFontEmbedCss = () => {
  fontEmbedCssPromise ??= inlineFontCss().catch((error) => {
    console.warn("Could not embed preview fonts, export falls back to system fonts", error)
    fontEmbedCssPromise = null
    return ""
  })
  return fontEmbedCssPromise
}

export const buildDownloadName = (format: ExportFormat, index?: number) => {
  const extension = format === "jpeg" ? "jpg" : "png"
  if (index === undefined) {
    return `chat-export.${extension}`
  }
  return `chat-export-${String(index + 1).padStart(2, "0")}.${extension}`
}

export const downloadDataUrls = (dataUrls: string[], format: ExportFormat) => {
  dataUrls.forEach((dataUrl, index) => {
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = buildDownloadName(format, dataUrls.length > 1 ? index : undefined)
    link.click()
  })
}

interface ExportRenderOptions {
  offset?: { x: number; y: number }
  scrollRootOverrides?: Array<{
    index?: number
    top?: number
    left?: number
  }>
}

const waitForImages = async (node: HTMLElement) => {
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
}

const buildExportClone = (node: HTMLElement, options?: ExportRenderOptions) => {
  const wrapper = document.createElement("div")
  wrapper.setAttribute("aria-hidden", "true")
  Object.assign(wrapper.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
  })

  const clone = node.cloneNode(true) as HTMLElement
  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)

  const sourceScrollRoots = Array.from(
    node.querySelectorAll<HTMLElement>('[data-conversation-scroll-root="true"]'),
  )
  const cloneScrollRoots = Array.from(
    clone.querySelectorAll<HTMLElement>('[data-conversation-scroll-root="true"]'),
  )

  sourceScrollRoots.forEach((sourceRoot, index) => {
    const cloneRoot = cloneScrollRoots[index]
    if (!cloneRoot) return

    const sourceContent = sourceRoot.querySelector<HTMLElement>('[data-conversation-content="true"]')
    const cloneContent = cloneRoot.querySelector<HTMLElement>('[data-conversation-content="true"]')
    if (!sourceContent || !cloneContent) return

    const override = options?.scrollRootOverrides?.find((entry) => (entry.index ?? 0) === index)
    const scrollTop = override?.top ?? sourceRoot.scrollTop
    const scrollLeft = override?.left ?? sourceRoot.scrollLeft
    if (!scrollTop && !scrollLeft) return

    cloneRoot.style.overflow = "hidden"
    cloneContent.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`
    cloneContent.style.transformOrigin = "top left"
  })

  return {
    clone,
    cleanup: () => wrapper.remove(),
  }
}

export const exportNodeToImage = async (
  node: HTMLElement,
  settings: ExportSettings,
  options?: ExportRenderOptions,
): Promise<string> => {
  const { clone, cleanup } = buildExportClone(node, options)
  const imagePlaceholder =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
  const transform = options?.offset
    ? `translate(${-options.offset.x}px, ${-options.offset.y}px) scale(1)`
    : "scale(1)"
  try {
    const [fontEmbedCSS] = await Promise.all([getFontEmbedCss(), waitForImages(clone)])

    const commonOptions = {
      fontEmbedCSS,
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
        ? toJpeg(clone, {
            ...commonOptions,
            quality: settings.quality,
          })
        : toPng(clone, commonOptions)

    return await withTimeout(exportPromise, EXPORT_TIMEOUT_MS, "Export timed out")
  } finally {
    cleanup()
  }
}

export const exportNodeToImageSequence = async (
  node: HTMLElement,
  settings: ExportSettings,
  renders: ExportRenderOptions[],
): Promise<string[]> => {
  const jobs = renders.length ? renders : [{}]
  const dataUrls: string[] = []
  for (const renderOptions of jobs) {
    dataUrls.push(await exportNodeToImage(node, settings, renderOptions))
  }
  return dataUrls
}

export const captureModeLabels: Record<ExportSettings["captureMode"], string> = {
  viewport: "Current view",
  full: "Full conversation",
  screens: "Screen by screen",
}

export const describeExport = (settings: ExportSettings, height: number, screenCount: number) =>
  [
    `${settings.width} × ${height}`,
    `${settings.scale}x`,
    settings.format.toUpperCase(),
    settings.captureMode === "screens" ? `${screenCount} screens` : captureModeLabels[settings.captureMode],
  ].join(" · ")
