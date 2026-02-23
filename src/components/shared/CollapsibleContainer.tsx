"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { DraggableScrollArea } from "./DraggableScrollArea"

interface CollapsibleContainerProps {
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  width?: string | number
  height?: string | number

  /** New controls */
  withBorder?: boolean
  withShadow?: boolean
  variant?: "default" | "ghost"
}

export function CollapsibleContainer({
  title,
  children,
  defaultOpen = false,
  className,
  width,
  height,
  withBorder = true,
  withShadow = true,
  variant = "default",
}: CollapsibleContainerProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const contentId = React.useId()

  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl",
        variant !== "ghost" && withBorder && "border border-border",
        variant !== "ghost" && withShadow && "shadow-sm",
        className
      )}
    >
      {/* HEADER */}
      <div
        className="
          flex items-center justify-between px-6 py-4
          cursor-pointer select-none
          transition-colors
          hover:bg-muted/40
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
          focus-visible:ring-offset-2
          focus-visible:ring-offset-background
          rounded-t-xl
        "
        role="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        tabIndex={0}
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setIsOpen((v) => !v)
          }
        }}
      >
        <h3 className="font-semibold leading-none tracking-tight">
          {title}
        </h3>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground",
            isOpen && "rotate-180 text-foreground"
          )}
          aria-hidden
        />
      </div>

      {/* CONTENT */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">
              <DraggableScrollArea width={width} height={height}>
                {children}
              </DraggableScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
