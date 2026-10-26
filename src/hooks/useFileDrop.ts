import { useEffect, useRef, useState, type DragEvent } from "react"

const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes("Files")

// Props for a file drop target. Drops stop propagating, so a nested target wins over the app-wide one.
export const useFileDrop = (onFiles: (files: File[]) => void) => {
  const [isOver, setIsOver] = useState(false)
  const depthRef = useRef(0)

  useEffect(() => {
    // A drop handled by a nested target never bubbles here, so reset on any drop or cancelled drag.
    const reset = () => {
      depthRef.current = 0
      setIsOver(false)
    }
    window.addEventListener("drop", reset, true)
    window.addEventListener("dragend", reset, true)
    return () => {
      window.removeEventListener("drop", reset, true)
      window.removeEventListener("dragend", reset, true)
    }
  }, [])

  return {
    isOver,
    dropProps: {
      onDragEnter: (event: DragEvent) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        depthRef.current += 1
        setIsOver(true)
      },
      onDragOver: (event: DragEvent) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
      },
      onDragLeave: (event: DragEvent) => {
        if (!hasFiles(event)) return
        depthRef.current = Math.max(0, depthRef.current - 1)
        if (depthRef.current === 0) setIsOver(false)
      },
      onDrop: (event: DragEvent) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        event.stopPropagation()
        depthRef.current = 0
        setIsOver(false)
        onFiles(Array.from(event.dataTransfer.files))
      },
    },
  }
}
