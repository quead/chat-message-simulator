import { CircleAlert, CircleCheck, Info, X } from "lucide-react"
import { useToastStore } from "@/store/toastStore"
import { cn } from "@/utils/cn"

const toneIcon = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
}

export const Toaster = () => {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      role="status"
    >
      {toasts.map((toast) => {
        const Icon = toneIcon[toast.tone]
        return (
          <div
            key={toast.id}
            className="toast-enter pointer-events-auto flex max-w-md items-center gap-3 rounded-lg bg-black py-2.5 pr-2 pl-3.5 text-sm text-white"
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                toast.tone === "success" && "text-emerald-400",
                toast.tone === "error" && "text-rose-400",
                toast.tone === "info" && "text-sky-400",
              )}
            />
            <span className="min-w-0 flex-1">{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                onClick={() => {
                  toast.action?.onClick()
                  dismiss(toast.id)
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-md p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
