// src\components\carousel\SimpleCardCarousel.tsx
"use client";

import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

interface SimpleCardCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  viewportClassName?: string;
}

export function SimpleCardCarousel<T>({
  items,
  renderItem,
  className,
  itemClassName,
  viewportClassName,
}: SimpleCardCarouselProps<T>) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: true,
    containScroll: "trimSnaps",
    // --- CRITICAL FIX START ---
    // This function decides if Embla should start dragging the slides.
    watchDrag: (_emblaApi, event) => {
      // 1. If it's a MOUSE event (Desktop/Laptop)
      if (event.type === "mousedown") {
        const target = event.target as Element;
        // If user clicks inside our draggable scroll area, DO NOT drag the carousel.
        // Let our DraggableScrollArea component handle the vertical scroll instead.
        if (target.closest(".no-carousel-drag")) {
          return false;
        }
      }
      // 2. If it's TOUCH, return true. 
      // Embla is smart enough to respect 'touch-action: pan-y' which allows vertical scrolling.
      return true; 
    },
    // --- CRITICAL FIX END ---
  });

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn("overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y", viewportClassName)}
        ref={emblaRef}
      >
        <div className="flex gap-4 pl-4 pr-4 py-4">
          {items.map((item, index) => (
            <div
              key={index}
              className={cn("flex-[0_0_85%] min-w-0 sm:flex-[0_0_45%] md:flex-[0_0_30%]", itemClassName)}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}