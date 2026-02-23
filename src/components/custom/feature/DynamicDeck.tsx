// src\components\custom\feature\DynamicDeck.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { DeckItem } from '@/types';

interface DynamicDeckProps {
  items: DeckItem[];
}

export default function DynamicDeck({ items }: DynamicDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); 

  // Stable random rotations for the "messy" look.
  // We generate one rotation value per item index so it stays consistent.
  const [rotations, setRotations] = useState<number[]>([]);

  useEffect(() => {
    // Generate a random rotation between -12 and 12 degrees for every item
    setRotations(items.map(() => Math.random() * 24 - 12));
  }, [items]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  // We determine which cards to render:
  // 1. The Active Card (offset 0)
  // 2. The Next 3 Cards (offset 1, 2, 3) for the visible stack
  const visibleDepth = 4; // How many cards deep to visualize
  
  // Calculate the specific items to show in the stack based on current index
  const visibleItems = Array.from({ length: visibleDepth }).map((_, i) => {
    const itemIndex = (currentIndex + i) % items.length;
    return {
      ...items[itemIndex],
      offset: i, // 0 is active, 1 is next, etc.
      rotation: rotations[itemIndex] || 0,
    };
  });

  // Revert the list so the card at the *bottom* of the stack renders first 
  // (Standard HTML stacking order: later elements sit on top)
  // BUT we are using z-index, so we can render in any order. 
  // Let's keep strict order to help Framer Motion's layout prop.
  const renderList = [...visibleItems].reverse(); 

  return (
    <section className="grid min-h-[600px] w-full grid-cols-1 place-items-center gap-8 bg-background p-8 text-foreground md:grid-cols-[1fr_1fr] md:gap-16 font-sans overflow-hidden">
      
      {/* LEFT COLUMN: The Stack */}
      <div className="relative flex h-96 w-full max-w-sm items-center justify-center">
        
        {/* We use AnimatePresence to handle the "Flying Out" of the card that leaves */}
        <AnimatePresence mode='popLayout' custom={direction}>
          {renderList.map((item) => {
            const isTop = item.offset === 0;

            return (
              <motion.div
                key={item.id} // Important: Key tracks the item across position changes
                layout // This makes the card smoothly animate from "Stack" position to "Active" position
                custom={direction}
                
                // --- Initial / Animate / Exit states ---
                initial={isTop ? { opacity: 0, x: direction > 0 ? 100 : -100 } : false} // Only animate entry if it's the NEW active card appearing (edge case), otherwise it relies on layout
                
                animate={{
                  zIndex: 100 - item.offset, // Top card has highest Z
                  scale: 1 - item.offset * 0.05, // Items further back are slightly smaller
                  rotate: isTop ? 0 : item.rotation, // Top card is straight, others are messy
                  x: item.offset * 2, // Slight offset to right for depth (optional)
                  y: item.offset * -2, // Slight offset up for depth (optional)
                  opacity: 1 - item.offset * 0.1, // Fade out slightly as they go back
                }}

                exit={{
                  x: direction > 0 ? -400 : 400, // Fly off screen
                  opacity: 0,
                  rotate: direction > 0 ? -20 : 20,
                  transition: { duration: 0.4 }
                }}

                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}

                className="absolute top-0 left-0 flex h-full w-full items-center justify-center"
                style={{ 
                  // If it's not the top card, allow clicks to pass through? 
                  // Or let user click stack to advance?
                  pointerEvents: isTop ? 'auto' : 'none' 
                }}
              >
                {/* THE CARD CONTAINER */}
                <div 
                  className="relative h-full w-full overflow-hidden rounded-2xl bg-card border border-border shadow-xl"
                >
                  {/* Render the actual content (Tiger image, etc) */}
                  {item.cardContent}

                  {/* Optional: Dark overlay for stack items to add depth */}
                  {!isTop && (
                    <div className="absolute inset-0 bg-black/30 transition-colors" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* RIGHT COLUMN: Info & Controls */}
      <div className="flex w-full flex-col justify-center space-y-8 md:max-w-md z-10">
        
        {/* Counter */}
        <div className="text-right text-4xl font-bold text-muted-foreground">
           <span className="text-accent">{currentIndex + 1}</span>
           <span className="text-2xl text-muted-foreground mx-2">/</span>
           <span>{items.length}</span>
        </div>

        {/* Dynamic Text Content */}
        <div className="min-h-[150px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={items[currentIndex].id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {items[currentIndex].infoContent}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 pt-4">
          <button
            onClick={handlePrev}
            className="group flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:border-transparent active:scale-95"
            aria-label="Previous"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={handleNext}
            className="group flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:border-transparent active:scale-95"
            aria-label="Next"
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>

      </div>
    </section>
  );
}