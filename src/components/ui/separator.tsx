import * as React from "react"
import { cn } from "@/utils/cn"

const Separator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("h-px w-full bg-slate-200", className)} {...props} />
  ),
)
Separator.displayName = "Separator"

export { Separator }