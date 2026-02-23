// src\components\shared\MotionSection.tsx
"use client";

import { motion, useInView, Variants } from "framer-motion"; // Import Variants type
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface MotionSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

export function MotionSection({
  children,
  className,
  delay = 0,
  direction = "up",
}: MotionSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Explicitly type the variants
  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 40 : direction === "down" ? -40 : 0,
      x: direction === "left" ? 40 : direction === "right" ? -40 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.8,
        // FIX: Cast as a tuple so TypeScript knows it is exactly 4 numbers
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        delay: delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={cn("relative", className)}
    >
      {children}
    </motion.div>
  );
}