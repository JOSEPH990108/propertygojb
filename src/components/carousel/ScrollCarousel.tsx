// src\components\carousel\ScrollCarousel.tsx
"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useCarousel } from "@/hooks/useCarousel";

// --- ScrollCarousel Component ---

interface ScrollCarouselProps {
  children: React.ReactNode;
  className?: string;
  dotsClassName?: string;
  /**
   * Enable automatic sliding
   * @default false
   */
  autoScroll?: boolean;
  /**
   * Time in milliseconds between auto-scrolls
   * @default 3000
   */
  interval?: number;
}

export const ScrollCarousel = ({
  children,
  className,
  dotsClassName,
  autoScroll = false,
  interval = 3000,
}: ScrollCarouselProps) => {
  const {
      items,
      currentIndex,
      direction,
      containerRef,
      goTo,
      setIsHovered,
      onPointerDown,
      onPointerUp,
      onPointerLeave
  } = useCarousel({ children, autoScroll, interval });

  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 60 : -60,
      opacity: 0,
      filter: "blur(4px)",
    }),
    center: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      y: direction > 0 ? -60 : 60,
      opacity: 0,
      filter: "blur(4px)",
    }),
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      className={cn(
        "relative w-full max-w-md p-10 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col justify-between min-h-[340px] cursor-grab active:cursor-grabbing",
        // Scroll Locking CSS Fallback
        "overscroll-contain touch-none select-none",
        // Enhanced Hover Effect (Luxury Theme)
        "transition-all duration-500 ease-out",
        "hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-accent/40 hover:-translate-y-1",
        "dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] dark:hover:border-accent/30",
        className
      )}
    >
      {/* Top Navigation Row (Dots) */}
      <div className={cn("flex justify-end w-full mb-8 z-10", dotsClassName)}>
        <div className="flex gap-2.5">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-500 ease-out",
                currentIndex === idx
                  ? "w-8 bg-accent" // Use Accent color for active state
                  : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow flex flex-col justify-center relative perspective-1000">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              y: { type: "spring", stiffness: 100, damping: 20 },
              opacity: { duration: 0.4 },
            }}
            className="w-full absolute inset-0 flex flex-col justify-center"
          >
            {items[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
