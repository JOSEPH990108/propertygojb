// src\components\custom\feature\FanCards.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SimpleCardCarousel } from "@/components/carousel/SimpleCardCarousel";

interface FanCardsProps<T> {
  items: T[];
  renderItem: (item: T, isHovered: boolean) => React.ReactNode;
  renderMobileItem?: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  className?: string;
}

export default function FanCards<T>({ 
  items, 
  renderItem, 
  renderMobileItem,
  keyExtractor,
  className 
}: FanCardsProps<T>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Constants for geometry
  const SPACING = 140; 
  const HOVER_SCALE = 1.1;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop View */}
      <div className="hidden md:flex justify-center items-center h-[550px] relative w-full perspective-[1000px]">
        {items.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isLeft = hoveredIndex !== null && index < hoveredIndex;
          const distance = hoveredIndex !== null ? Math.abs(hoveredIndex - index) : 0;

          // Physics Logic
          let x = (index - (items.length - 1) / 2) * SPACING;
          let rotate = (index - (items.length - 1) / 2) * 4;
          let scale = 1;
          let zIndex = index;
          let opacity = 1;

          if (hoveredIndex !== null) {
              if (isHovered) {
                  x = (index - (items.length - 1) / 2) * SPACING;
                  rotate = 0;
                  scale = HOVER_SCALE;
                  zIndex = 50;
              } else {
                  const pushDistance = 80;
                  const direction = isLeft ? -1 : 1;
                  x += direction * pushDistance;
                  rotate = isLeft ? -15 : 15;
                  scale = 1 - (distance * 0.05);
                  opacity = 1 - (distance * 0.15);
                  zIndex = 40 - distance;
              }
          }

          return (
            <motion.div
              key={keyExtractor(item)}
              className={cn(
                "absolute top-1/2 left-1/2 w-[280px] h-[450px] rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl flex flex-col overflow-hidden transition-colors duration-300",
                isHovered ? "border-amber-500 shadow-amber-500/20" : "hover:border-white/20"
              )}
              style={{
                marginLeft: -140, // Center origin (half width)
                marginTop: -225, // Center origin (half height)
                transformOrigin: "bottom center",
              }}
              animate={{ x, rotate, scale, zIndex, opacity }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
                {/* Render the Custom Content */}
                {renderItem(item, isHovered)}
            </motion.div>
          );
        })}
      </div>

       {/* Mobile View */}
       <div className="md:hidden">
         <SimpleCardCarousel
            items={items}
            renderItem={(item) => renderMobileItem ? renderMobileItem(item) : renderItem(item, true)}
         />
      </div>
    </div>
  );
}