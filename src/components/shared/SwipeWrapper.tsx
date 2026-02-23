// src\components\shared\SwipeWrapper.tsx
'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SwipeWrapperProps {
  children: React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  className?: string;
  enableVertical?: boolean;
  sensitivity?: 'low' | 'medium' | 'high';
}

export function SwipeWrapper({
  children,
  onNext,
  onPrev,
  className,
  enableVertical = false,
  sensitivity = 'medium'
}: SwipeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastInteractionTime = useRef(0);

  // Physics State
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const getThreshold = () => {
    switch (sensitivity) {
      case 'low': return 100;
      case 'high': return 30;
      default: return 60;
    }
  };

  const resetPosition = () => {
    const options = { type: "spring" as const, stiffness: 400, damping: 25 };
    animate(x, 0, options);
    animate(y, 0, options);
  };

  const handleInteraction = useCallback((type: 'next' | 'prev') => {
    const now = Date.now();
    // Debounce
    if (now - lastInteractionTime.current < 300) return;
    lastInteractionTime.current = now;

    if (type === 'next') onNext?.();
    else onPrev?.();
  }, [onNext, onPrev]);

  // Wheel Logic
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
       e.preventDefault();
       e.stopPropagation();

       const now = Date.now();
       if (now - lastInteractionTime.current < 300) return;

       if (e.deltaY > 0) {
         handleInteraction('next');
       } else if (e.deltaY < 0) {
         handleInteraction('prev');
       }
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [handleInteraction]);

  // Pan Logic
  const onPan = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Direct 1:1 movement feedback
        x.set(info.offset.x);
      if (enableVertical) {
        y.set(info.offset.y);
      }
  };

  const onPanEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = getThreshold();
    const { x: finalX, y: finalY } = info.offset;
    const absX = Math.abs(finalX);
    const absY = Math.abs(finalY);

      // Prioritize larger axis
    if (absX > absY) {
      if (absX > threshold) {
        // Horizontal
        if (finalX < 0) {
            handleInteraction('next'); // Swipe Left -> Next
        } else {
            handleInteraction('prev'); // Swipe Right -> Prev
        }
      }
    } else {
      if (enableVertical && absY > threshold) {
        // Vertical
        if (finalY < 0) {
             handleInteraction('next'); // Swipe Up -> Next
        } else {
             handleInteraction('prev'); // Swipe Down -> Prev
        }
      }
    }

    // Always spring back to center after release
    // The parent component will handle the actual content change/transition
    resetPosition();
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "relative touch-none overscroll-contain outline-none cursor-grab active:cursor-grabbing",
        className
      )}
      style={{
          touchAction: 'none',
          x,
          y: enableVertical ? y : 0
      }}
      onPan={onPan}
      onPanEnd={onPanEnd}
      tabIndex={0}
    >
      {children}
    </motion.div>
  );
}
