import type { ReactNode } from "react"
import { cn } from "@/utils/cn"

interface SegmentedOption<T extends string | number> {
  value: T
  label: ReactNode
  title?: string
}

interface SegmentedProps<T extends string | number> {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  label: string
  size?: "sm" | "md"
  className?: string
}

export const Segmented = <T extends string | number>({
  value,
  options,
  onChange,
  label,
  size = "md",
  className,
}: SegmentedProps<T>) => (
  <div
    role="group"
    aria-label={label}
    className={cn("inline-flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5", className)}
  >
    {options.map((option) => {
      const isActive = option.value === value
      return (
        <button
          key={option.value}
          type="button"
          title={option.title}
          aria-pressed={isActive}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none [&_svg]:h-3.5 [&_svg]:w-3.5",
            size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
            isActive
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5"
              : "text-slate-500 hover:text-slate-900",
          )}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)
