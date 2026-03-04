import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-tech-sm hover:shadow-tech-md hover:brightness-110 active:scale-[0.98]",
        destructive:
          "bg-destructive text-white shadow-tech-sm hover:shadow-tech-md hover:brightness-110 active:scale-[0.98]",
        outline:
          "border border-border bg-background shadow-tech-sm hover:bg-secondary hover:border-accent hover:shadow-tech-md active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-tech-sm hover:shadow-tech-md hover:brightness-95 active:scale-[0.98]",
        ghost:
          "hover:bg-secondary hover:text-secondary-foreground active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline",
        tech:
          "tech-button text-foreground hover:text-accent active:scale-[0.98]",
        gradient:
          "gradient-button rounded-lg active:scale-[0.98]",
        glow:
          "bg-primary text-primary-foreground shadow-tech-sm glow-primary hover:shadow-tech-md active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-lg",
        sm: "h-9 rounded-md gap-1.5 px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-9 rounded-md",
        "icon-lg": "size-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
