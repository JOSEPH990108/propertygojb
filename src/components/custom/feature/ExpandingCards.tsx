// src\components\custom\feature\ExpandingCards.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
// Assuming SimpleCardCarousel is already generic or you handle mobile similarly
import { SimpleCardCarousel } from "@/components/carousel/SimpleCardCarousel";

interface ExpandingCardsProps<T> {
  items: T[];
  /** Function to render the content of the card */
  renderItem: (item: T, isHovered: boolean) => React.ReactNode;
  /** Function to render the mobile view (optional, defaults to renderItem) */
  renderMobileItem?: (item: T) => React.ReactNode;
  className?: string;
  /** Unique key extractor for the list */
  keyExtractor: (item: T) => string | number;
}

export default function ExpandingCards<T>({ 
  items, 
  renderItem, 
  renderMobileItem,
  className,
  keyExtractor 
}: ExpandingCardsProps<T>) {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop View (md+) */}
      <div className="hidden md:flex w-full h-[500px] gap-2">
        {items.map((item) => {
          const id = keyExtractor(item);
          return (
            <AccordionItem
              key={id}
              isHovered={hoveredId === id}
              onHover={() => setHoveredId(id)}
              onLeave={() => setHoveredId(null)}
              anyHovered={hoveredId !== null}
            >
              {renderItem(item, hoveredId === id)}
            </AccordionItem>
          );
        })}
      </div>

      {/* Mobile View (< md) */}
      <div className="md:hidden">
         <SimpleCardCarousel
            items={items}
            // Use specific mobile render if provided, otherwise fallback to generic
            renderItem={(item) => renderMobileItem ? renderMobileItem(item) : renderItem(item, true)} 
         />
      </div>
    </div>
  );
}

function AccordionItem({
  children,
  isHovered,
  onHover,
  onLeave,
  anyHovered,
}: {
  children: React.ReactNode;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  anyHovered: boolean;
}) {
  return (
    <motion.div
      layout
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "relative h-full cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-colors duration-300",
        isHovered ? "border-accent/50 bg-muted" : "hover:bg-muted/50"
      )}
      initial={{ flex: 1 }}
      animate={{
        flex: isHovered ? 3.5 : 1,
        opacity: anyHovered && !isHovered ? 0.6 : 1,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      {/* Pass children through - styling is now handled by the consumer */}
      <div className="relative h-full w-full">
        {children}
      </div>
    </motion.div>
  );
}