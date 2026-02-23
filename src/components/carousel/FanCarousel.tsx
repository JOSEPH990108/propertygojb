// src\components\carousel\FanCarousel.tsx
'use client';

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils';

interface FanCarouselProps {
  children: React.ReactNode;
  className?: string;
}

export function FanCarousel({ children, className }: FanCarouselProps) {
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const state = useRef({
    progress: 50,
    startX: 0,
    startY: 0,
    active: 0,
    isDown: false,
    items: [] as Element[],
    speedWheel: 0.04, // Increased sensitivity slightly
    speedDrag: -0.15, // Horizontal drag speed (Negative: Swipe Left/Drag Left -> Content moves Left -> revealing Next Item?)
                      // Wait, let's verify visual logic.
                      // If I drag mouse Left (deltaX < 0), `deltaX * speedDrag` is Positive.
                      // Progress Increases.
                      // Progress 0 -> 100.
                      // If Index 0 is at Progress 0 (or similar mapping).
                      // Usually Start -> End = Next.
                      // So Positive Change = Next.
                      // Drag Left (deltaX < 0) -> Positive Change -> Next.
                      // This matches "Swipe Left = Next".

    speedDragY: -0.2, // Vertical drag speed.
                      // We want Swipe Up (deltaY < 0) -> Next (Positive Change).
                      // So `deltaY * speedDragY` should be Positive when deltaY is Negative.
                      // Negative * Negative = Positive.
                      // So speedDragY should be Negative.
  });

  const childrenArray = React.Children.toArray(children);
  const itemCount = childrenArray.length;

  useEffect(() => {
    // Initialize items array ref
    state.current.items = itemsRef.current.filter(Boolean) as Element[];
  }, [children]);

  // The Animate Function
  const animate = () => {
    const { progress, items } = state.current;

    // Clamp progress
    state.current.progress = Math.max(0, Math.min(progress, 100));

    // Calculate active index
    const active = Math.floor((state.current.progress / 100) * (itemCount - 1));
    state.current.active = active;

    items.forEach((item, index) => {
      if (item instanceof HTMLElement) {
        // Calculate Z-Index
        const zIndex = getZindex(items, active)[index];

        // Update CSS Variables
        item.style.setProperty('--zIndex', zIndex.toString());
        item.style.setProperty('--active', ((index - active) / itemCount).toString());
        item.style.setProperty('--items', itemCount.toString());
      }
    });
  };

  // Helper: Get Z Index
  const getZindex = (array: Element[], activeIndex: number) => {
    return array.map((_, i) =>
      activeIndex === i ? array.length : array.length - Math.abs(activeIndex - i)
    );
  };

  // Event Handlers
  const handleWheel = (e: WheelEvent) => {
    // Strict Scroll Locking
    e.preventDefault();
    e.stopPropagation();

    // Wheel Down (deltaY > 0) -> Next (Positive Progress)
    // Wheel Up (deltaY < 0) -> Prev (Negative Progress)
    const wheelProgress = e.deltaY * state.current.speedWheel;
    state.current.progress += wheelProgress;
    animate();
  };

  const handleMouseDown = (e: MouseEvent | TouchEvent) => {
    state.current.isDown = true;
    state.current.startX =
      (e instanceof MouseEvent ? e.clientX : e.touches[0].clientX) || 0;
    state.current.startY =
      (e instanceof MouseEvent ? e.clientY : e.touches[0].clientY) || 0;
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!state.current.isDown) return;

    const isTouch = e instanceof TouchEvent || 'touches' in e;
    const x = (isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX) || 0;
    const y = (isTouch ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY) || 0;

    const deltaX = x - state.current.startX;
    const deltaY = y - state.current.startY;

    // Strict Scroll Locking during interaction
    if (e.cancelable) e.preventDefault();

    if (isTouch) {
      // Calculate contribution from both axes
      const changeX = deltaX * state.current.speedDrag;
      const changeY = deltaY * state.current.speedDragY;

      // Combined influence
      const totalChange = changeX + changeY;

      state.current.progress += totalChange;

    } else {
      // Desktop Mouse Logic: Keep existing X-axis drag
      const mouseProgress = deltaX * state.current.speedDrag;
      state.current.progress += mouseProgress;
    }

    state.current.startX = x;
    state.current.startY = y;
    animate();
  };

  const handleMouseUp = () => {
    state.current.isDown = false;
  };

  // Click Handler for Items
  const handleItemClick = (index: number) => {
    state.current.progress = (index / itemCount) * 100 + 10;
    animate();
  };

  // Effect to bind events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial Animation
    animate();

    // Bind events
    // We bind wheel to container with passive: false to allow locking
    container.addEventListener('wheel', handleWheel, { passive: false });

    // We bind drag to container for start
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('touchstart', handleMouseDown, { passive: false });

    // Bind move/up to window to handle dragging outside container
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('touchstart', handleMouseDown);

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [itemCount]);

  return (
    <div
      ref={containerRef}
      className={cn(
          "fan-carousel relative h-[600px] w-full overflow-hidden touch-none overscroll-contain",
          className
      )}
      style={{ perspective: '1000px', touchAction: 'none' }} // Explicitly disable browser pan/zoom handling
    >
      <style jsx>{`
        .fan-carousel-item {
          --items: ${itemCount};
          --width: clamp(150px, 30vw, 300px);
          --height: clamp(200px, 40vw, 400px);
          --x: calc(var(--active) * 800%);
          --y: calc(var(--active) * 200%);
          --rot: calc(var(--active) * 120deg);
          --opacity: calc(var(--zIndex) / var(--items) * 3 - 2);

          overflow: hidden;
          position: absolute;
          z-index: var(--zIndex);
          width: var(--width);
          height: var(--height);
          margin: calc(var(--height) * -0.5) 0 0 calc(var(--width) * -0.5);
          border-radius: 10px;
          top: 50%;
          left: 50%;
          user-select: none;
          transform-origin: 0% 100%;
          box-shadow: 0 10px 50px 10px rgba(0, 0, 0, .5);
          background: black;
          pointer-events: all;

          /* Transform logic */
          transform: translate(var(--x), var(--y)) rotate(var(--rot));
          transition: transform .8s cubic-bezier(0, 0.02, 0, 1);
        }

        /* Inner Content Transition */
        .fan-carousel-item > div {
           transition: opacity .8s cubic-bezier(0, 0.02, 0, 1);
           opacity: var(--opacity);
        }
      `}</style>

      {childrenArray.map((child, i) => (
        <div
          key={i}
          ref={(el) => { itemsRef.current[i] = el; }}
          className="fan-carousel-item cursor-pointer"
          onClick={() => handleItemClick(i)}
          style={{
             // Initial vars to prevent flash of unstyled content
             '--zIndex': itemCount - i,
             '--active': (i - state.current.active) / itemCount,
          } as React.CSSProperties}
        >
          {/* Wrapper to handle opacity transition separately from transform */}
          <div className="w-full h-full relative">
            {child}

            {/* Optional Overlay/Gradient for better text readability */}
             <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
