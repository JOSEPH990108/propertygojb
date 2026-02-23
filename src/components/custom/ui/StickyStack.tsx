// src\components\custom\ui\StickyStack.tsx
"use client";

import { cn } from "@/lib/utils";
import React from "react";

export type StickyStackItem = {
  id: string | number;
  content: React.ReactNode;
  className?: string;
};

interface StickyStackProps {
  items: StickyStackItem[];
  className?: string;
  offset?: number;
}

export function StickyStack({ items, className, offset = 0 }: StickyStackProps) {
  return (
    <div className={cn("relative w-full", className)}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="sticky w-full"
          style={{
            top: offset,
            zIndex: index + 1,
          }}
        >
          {/* Use item.className to allow overriding the default bg-card */}
          <div className={cn("bg-card", item.className)}>
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
}