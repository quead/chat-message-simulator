import { Download, Loader2 } from "lucide-react"
import type { ChatExporter } from "@/hooks/useChatPreview"
import { useConversationStore } from "@/store/conversationStore"
import { buildDownloadName, downloadDataUrls } from "@/utils/export"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ExportPreviewDialogProps {
  exporter: ChatExporter
  summary: string
}

export const ExportPreviewDialog = ({ exporter, summary }: ExportPreviewDialogProps) => {
  const format = useConversationStore((state) => state.exportSettings.format)
  const { preview } = exporter
  const isSequence = preview.urls.length > 1

  return (
    <Dialog open={preview.open} onOpenChange={(open) => !open && exporter.closePreview()}>
      <DialogContent className="flex max-h-[90dvh] max-w-5xl flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Export preview</DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>
        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto bg-neutral-50 px-6 py-4">
          {preview.loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-neutral-500">
              <Loader2 className="h-6 w-6 animate-spin text-black" />
              Rendering image…
            </div>
          ) : null}
          {preview.error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Export failed: {preview.error}
            </div>
          ) : null}
          <div className={isSequence ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex justify-center"}>
            {preview.urls.map((url, index) => (
              <figure key={url} className="mx-auto w-fit space-y-2">
                <img
                  src={url}
                  alt={isSequence ? `Export preview screen ${index + 1}` : "Export preview"}
                  className="max-h-[62dvh] w-auto max-w-full rounded-lg border border-neutral-200 bg-white object-contain"
                />
                {isSequence ? (
                  <figcaption className="flex items-center justify-between text-xs text-neutral-500">
                    Screen {index + 1}
                    <a
                      href={url}
                      download={buildDownloadName(format, index)}
                      className="font-medium text-black hover:underline"
                    >
                      Download
                    </a>
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={exporter.closePreview}>
            Close
          </Button>
          <Button
            disabled={!preview.urls.length}
            onClick={() => downloadDataUrls(preview.urls, format)}
          >
            <Download className="h-4 w-4" />
            {isSequence ? `Download all ${preview.urls.length}` : "Download"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
