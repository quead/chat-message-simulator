import { create } from "zustand"

export type ToastTone = "success" | "error" | "info"

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: number
  message: string
  tone: ToastTone
  action?: ToastAction
}

interface ToastStore {
  toasts: Toast[]
  dismiss: (id: number) => void
}

let nextToastId = 0

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))

export const toast = (message: string, tone: ToastTone = "success", action?: ToastAction) => {
  const id = ++nextToastId
  useToastStore.setState((state) => ({
    toasts: [...state.toasts.slice(-2), { id, message, tone, action }],
  }))
  window.setTimeout(
    () => useToastStore.getState().dismiss(id),
    tone === "error" || action ? 6000 : 3200,
  )
}
