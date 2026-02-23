// src\components\carousel\3DRotateCarousel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeWrapper } from '@/components/shared/SwipeWrapper';

interface CarouselProps {
  children: React.ReactNode;
  radius?: number;
  duration?: number;
  tilt?: number;
}

/**
 * 3D Rotating Carousel with "Draw Card" interaction.
 * - Rotates automatically (Y-axis for standard ring).
 * - Click item -> Rotation pauses, Item "draws" to center.
 * - Click outside -> Item returns, Rotation resumes.
 * - Uses Framer Motion for all physics.
 * - Wrapped with SwipeWrapper for manual control.
 */
export const Carousel: React.FC<CarouselProps> = ({
  children,
  radius = 400,
  duration = 20,
  tilt = 15
}) => {
  const [rotation, setRotation] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const count = React.Children.count(children);
  const childArray = React.Children.toArray(children);
  const stepAngle = 360 / count;

  // Auto-rotation loop
  useEffect(() => {
    let animationFrame: number;
    let startTimestamp: number;

    const animate = (timestamp: number) => {
      if (!isAutoRotating) return; // Exit if manual

      if (!startTimestamp) startTimestamp = timestamp;
      // const elapsed = timestamp - startTimestamp;
      const degPerMs = 360 / (duration * 1000);

      setRotation(prev => (prev + degPerMs * 16) % 360);

      animationFrame = requestAnimationFrame(animate);
    };

    if (isAutoRotating) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [isAutoRotating, duration]);

  const handleCardClick = (index: number) => {
    if (selectedIndex === index) return;
    setIsAutoRotating(false);
    setSelectedIndex(index);
  };

  const handleBackgroundClick = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(null);
      setIsAutoRotating(true);
    }
  };

  // Manual Control Handlers
  const handleManualNext = () => {
     setIsAutoRotating(false);
     setRotation(prev => prev + stepAngle);
  };

  const handleManualPrev = () => {
     setIsAutoRotating(false);
     setRotation(prev => prev - stepAngle);
  };

  return (
    <SwipeWrapper
      onNext={handleManualNext}
      onPrev={handleManualPrev}
      className="relative w-full h-full flex items-center justify-center overflow-hidden perspective-container"
    >
       <style>{`
        .perspective-container {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
       `}</style>

       {/* Background Click Handler (Only active when an item is selected) */}
       <AnimatePresence>
         {selectedIndex !== null && (
           <motion.div
             className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-pointer"
             onClick={handleBackgroundClick}
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
           />
         )}
       </AnimatePresence>

      {/* Rotating Ring */}
      <motion.div
        className="relative flex items-center justify-center preserve-3d"
        style={{
          rotateX: tilt,
          rotateY: rotation, // Fixed: Use rotateY for ring rotation
          width: 0,
          height: 0
        }}
        // Animate changes to rotation smoothly
        animate={{ rotateY: rotation }}
        transition={{
            type: "spring",
            stiffness: 50,
            damping: 20,
            // Only animate if not auto-rotating to avoid conflict?
            // Actually, if we update state rapidly in RAF, spring might be laggy.
            // But RAF updates `rotation` state.
            // If we use `animate`, it interpolates `rotation`.
            // For RAF (continuous), we might want `duration: 0` or `type: false`.
            // For Manual (step), we want Spring.
            duration: isAutoRotating ? 0 : undefined
        }}
      >
        {childArray.map((child, index) => {
            const angleStep = 360 / count;
            const angle = angleStep * index;
            const isSelected = selectedIndex === index;

            return (
              <CarouselItem
                key={index}
                index={index}
                angle={angle}
                radius={radius}
                child={child}
                onClick={() => handleCardClick(index)}
                isSelected={isSelected}
              />
            );
        })}
      </motion.div>

      {/* Selected Item Overlay */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
             <motion.div
               key={selectedIndex}
               layoutId={`card-${selectedIndex}`}
               className="relative pointer-events-auto cursor-default outline-none"
               animate={{
                 rotateX: 0,
                 rotateY: 0, // Reset Y rotation
                 rotateZ: 0,
                 scale: 1,
                 y: 0,
                 z: 500
               }}
               transition={{ type: "spring", stiffness: 40, damping: 20 }}
               onClick={(e) => e.stopPropagation()}
             >
                {childArray[selectedIndex]}
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SwipeWrapper>
  );
};

interface CarouselItemProps {
  index: number;
  angle: number;
  radius: number;
  child: React.ReactNode;
  onClick: () => void;
  isSelected: boolean;
}

const CarouselItem: React.FC<CarouselItemProps> = ({ index, angle, radius, child, onClick, isSelected }) => {
    return (
        <div
            className="absolute flex items-center justify-center preserve-3d cursor-pointer"
            style={{
                // Fixed: Rotate Y for ring position, X for tilt correction if needed?
                // Standard Ring: rotateY(angle) translateZ(radius).
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
        >
            <div className={`transition-opacity duration-300 ${isSelected ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-105'}`}>
               <motion.div layoutId={`card-${index}`}>
                  {child}
               </motion.div>
            </div>
        </div>
    );
};
