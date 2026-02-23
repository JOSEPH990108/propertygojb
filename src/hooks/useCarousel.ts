// src\hook\useCarousel.ts
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import React from 'react';

interface UseCarouselProps {
  children: React.ReactNode;
  autoScroll?: boolean;
  interval?: number;
}

export function useCarousel({ children, autoScroll = false, interval = 3000 }: UseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [interactionLoad, setInteractionLoad] = useState(0);
  const lastScrollTime = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const items = useMemo(() => React.Children.toArray(children), [children]);
  const itemCount = items.length;

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % itemCount);
    setInteractionLoad((prev) => prev + 1);
  }, [itemCount]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? itemCount - 1 : prev - 1));
    setInteractionLoad((prev) => prev + 1);
  }, [itemCount]);

  const goTo = (idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
    setInteractionLoad((prev) => prev + 1);
  };

  useEffect(() => {
    if (!autoScroll || isHovered) return;
    const timer = setInterval(() => handleNext(), interval);
    return () => clearInterval(timer);
  }, [autoScroll, interval, isHovered, handleNext, interactionLoad]);

  // Wheel Logic - Strict Locking & Direction
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const SCROLL_COOLDOWN = 600;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const now = Date.now();
      if (now - lastScrollTime.current < SCROLL_COOLDOWN) return;

      // Wheel Down (deltaY > 0) -> Next
      // Wheel Up (deltaY < 0) -> Prev
      if (e.deltaY > 0) {
        handleNext();
        lastScrollTime.current = now;
      } else if (e.deltaY < 0) {
        handlePrev();
        lastScrollTime.current = now;
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleNext, handlePrev]);

  // Gestures (Pointer/Touch)
  // Logic updated to match Natural direction: Swipe Left (diffX < 0) -> Next
  const onPointerDown = (e: React.PointerEvent) => {
    setIsHovered(true);
    touchStart.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!touchStart.current) return;
    const diffX = e.clientX - touchStart.current.x;
    const diffY = e.clientY - touchStart.current.y;
    touchStart.current = null;
    const MIN_SWIPE = 50;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) < MIN_SWIPE) return;
      // Horizontal Swipe
      // Swipe Left (diffX < 0) -> Next
      // Swipe Right (diffX > 0) -> Prev
      if (diffX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    } else {
       if (Math.abs(diffY) < MIN_SWIPE) return;
       // Vertical Swipe
       // Swipe Up (diffY < 0) -> Next
       // Swipe Down (diffY > 0) -> Prev
       if (diffY < 0) {
         handleNext();
       } else {
         handlePrev();
       }
    }
  };

  const onPointerLeave = () => {
    touchStart.current = null;
    setIsHovered(false);
  };

  return {
    items,
    currentIndex,
    direction,
    containerRef,
    handleNext,
    handlePrev,
    goTo,
    setIsHovered,
    onPointerDown,
    onPointerUp,
    onPointerLeave
  };
}
