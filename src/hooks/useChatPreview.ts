import { useEffect, useRef, useState } from "react"
import { useConversationStore } from "@/store/conversationStore"
import { toast } from "@/store/toastStore"
import { downloadDataUrls, exportNodeToImageSequence } from "@/utils/export"
import { clamp, getScreenScrollTops } from "@/utils/helpers"

interface ConversationMetrics {
  contentHeight: number
  viewportHeight: number
  fullExportHeight: number
  hasOverflow: boolean
}

interface ExportPreviewState {
  open: boolean
  loading: boolean
  urls: string[]
  error: string | null
}

const closedPreview: ExportPreviewState = { open: false, loading: false, urls: [], error: null }

// Owns the live preview DOM refs, its measurements, and image export of that DOM.
export const useChatPreview = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const exportRef = useRef<HTMLDivElement | null>(null)
  const fullExportRef = useRef<HTMLDivElement | null>(null)
  const conversationRef = useRef<HTMLDivElement | null>(null)
  const conversationContentRef = useRef<HTMLDivElement | null>(null)
  const exportSettings = useConversationStore((state) => state.exportSettings)
  const zoom = useConversationStore((state) => state.ui.zoom)
  const autoFit = useConversationStore((state) => state.ui.autoFit)
  const [fitScale, setFitScale] = useState(1)
  const [metrics, setMetrics] = useState<ConversationMetrics>({
    contentHeight: 0,
    viewportHeight: 0,
    fullExportHeight: 0,
    hasOverflow: false,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportPreview, setExportPreview] = useState<ExportPreviewState>(closedPreview)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const updateScale = () => {
      const styles = window.getComputedStyle(element)
      const width =
        element.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight)
      const height =
        element.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom)
      if (width <= 0 || height <= 0) return
      setFitScale(Math.min(width / exportSettings.width, height / exportSettings.height, 1))
    }
    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(element)
    return () => observer.disconnect()
  }, [exportSettings.width, exportSettings.height])

  useEffect(() => {
    const container = conversationRef.current
    const content = conversationContentRef.current
    const exportElement = exportRef.current
    if (!container || !content || !exportElement) return
    let frame = 0
    const measure = () => {
      frame = 0
      const viewportHeight = container.clientHeight
      if (!viewportHeight) return
      const contentHeight = Math.ceil(Math.max(content.scrollHeight, content.offsetHeight))
      const chromeHeight = Math.max(0, exportElement.clientHeight - viewportHeight)
      const next = {
        contentHeight,
        viewportHeight,
        fullExportHeight: Math.max(exportSettings.height, Math.ceil(chromeHeight + contentHeight)),
        hasOverflow: contentHeight > viewportHeight + 1,
      }
      setMetrics((previous) =>
        previous.contentHeight === next.contentHeight &&
        previous.viewportHeight === next.viewportHeight &&
        previous.fullExportHeight === next.fullExportHeight &&
        previous.hasOverflow === next.hasOverflow
          ? previous
          : next,
      )
    }
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    schedule()
    // Content size changes (new messages, images loading, layout switches) all surface here.
    const observer = new ResizeObserver(schedule)
    observer.observe(container)
    observer.observe(content)
    observer.observe(exportElement)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [exportSettings.height])

  const appliedScale = clamp((autoFit ? fitScale : 1) * zoom, 0.1, 2)
  const resolvedHeight =
    exportSettings.captureMode === "full"
      ? Math.max(metrics.fullExportHeight, exportSettings.height)
      : exportSettings.height
  const screenScrollTops = getScreenScrollTops(metrics.contentHeight, metrics.viewportHeight)

  // Where the visible part of the (possibly zoomed, scrolled) device sits, in unscaled pixels.
  const getPreviewOffset = () => {
    const scrollElement = scrollRef.current
    const exportElement = exportRef.current
    if (!scrollElement || !exportElement) return { x: 0, y: 0 }
    const scrollRect = scrollElement.getBoundingClientRect()
    const exportRect = exportElement.getBoundingClientRect()
    const viewWidth = scrollElement.clientWidth / appliedScale
    const viewHeight = scrollElement.clientHeight / appliedScale
    const x = clamp(
      (scrollRect.left - exportRect.left) / appliedScale,
      0,
      Math.max(0, exportSettings.width - viewWidth),
    )
    const y = clamp(
      (scrollRect.top - exportRect.top) / appliedScale,
      0,
      Math.max(0, exportSettings.height - viewHeight),
    )
    return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 }
  }

  const runExport = async (mode: "download" | "preview") => {
    const { captureMode, format } = exportSettings
    const target = captureMode === "full" ? fullExportRef.current : exportRef.current
    if (!target || isExporting) return
    if (mode === "preview") {
      setExportPreview({ open: true, loading: true, urls: [], error: null })
    }
    setIsExporting(true)
    try {
      const renders =
        captureMode === "screens"
          ? screenScrollTops.map((top) => ({ scrollRootOverrides: [{ top }] }))
          : [{ offset: captureMode === "full" ? undefined : getPreviewOffset() }]
      const urls = await exportNodeToImageSequence(
        target,
        { ...exportSettings, height: resolvedHeight },
        renders,
      )
      if (mode === "preview") {
        setExportPreview((previous) => ({ ...previous, loading: false, urls }))
      } else {
        downloadDataUrls(urls, format)
        toast(urls.length > 1 ? `Downloaded ${urls.length} screenshots` : "Image downloaded")
      }
    } catch (error) {
      console.error("Export failed", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      if (mode === "preview") {
        setExportPreview((previous) => ({ ...previous, loading: false, error: message }))
      } else {
        toast(`Export failed: ${message}`, "error")
      }
    } finally {
      setIsExporting(false)
    }
  }

  const scrollConversation = (position: "top" | "bottom") => {
    const container = conversationRef.current
    container?.scrollTo({ top: position === "top" ? 0 : container.scrollHeight, behavior: "smooth" })
  }

  return {
    refs: { containerRef, scrollRef, exportRef, fullExportRef, conversationRef, conversationContentRef },
    appliedScale,
    metrics,
    resolvedHeight,
    screenCount: screenScrollTops.length,
    scrollConversation,
    exporter: {
      isExporting,
      run: runExport,
      preview: exportPreview,
      closePreview: () => setExportPreview(closedPreview),
    },
  }
}

export type ChatPreview = ReturnType<typeof useChatPreview>
export type ChatExporter = ChatPreview["exporter"]
