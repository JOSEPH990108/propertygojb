// src\components\shared\DraggableScrollArea.tsx
"use client";

import React, { useRef, useState, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface DraggableScrollAreaProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function DraggableScrollArea({
  children,
  className,
  width,
  height,
  style,
  ...props
}: DraggableScrollAreaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startX, setStartX] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e: MouseEvent) => {
    if (!ref.current) return;

    setIsDragging(true);
    setStartY(e.pageY - ref.current.offsetTop);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollTop(ref.current.scrollTop);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();

    const y = e.pageY - ref.current.offsetTop;
    const x = e.pageX - ref.current.offsetLeft;
    const walkY = (y - startY) * 1.5;
    const walkX = (x - startX) * 1.5;

    ref.current.scrollTop = scrollTop - walkY;
    ref.current.scrollLeft = scrollLeft - walkX;
  };

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseUp}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      className={cn(
        `
          overflow-auto
          cursor-grab active:cursor-grabbing
          touch-pan-x touch-pan-y
          no-carousel-drag
          rounded-md

          /* Subtle surface cue */
          bg-transparent
          hover:bg-muted/30
          dark:hover:bg-muted/20

          transition-colors duration-200
        `,
        isDragging && "select-none",
        className
      )}
      style={{
        ...style,
        width,
        height,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
