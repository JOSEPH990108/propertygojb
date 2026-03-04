import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "tech-input file:text-foreground placeholder:text-muted-foreground selection:bg-accent/30 selection:text-foreground h-10 w-full min-w-0 px-4 py-2 text-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus:border-accent focus:shadow-[0_0_0_3px] focus:shadow-accent/20",
        "aria-invalid:border-destructive aria-invalid:focus:shadow-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
