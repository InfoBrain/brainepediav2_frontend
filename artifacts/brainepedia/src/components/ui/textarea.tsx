import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full rounded-[10px] border border-input bg-[#fafbfc] px-3 py-2 text-sm shadow-none placeholder:text-muted-foreground focus-visible:border-[#b89cdd] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f5f0fc] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-transparent dark:focus-visible:ring-primary/20",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
