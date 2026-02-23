"use client";

import { useTheme } from "@/hooks/useTheme";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeTogglerTwo() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="size-14 rounded-full bg-muted animate-pulse"
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      className="
        group relative inline-flex size-14 items-center justify-center
        rounded-full border border-border
        bg-card text-foreground
        shadow-md shadow-black/10 dark:shadow-black/40
        transition-all duration-300
        hover:scale-[1.04]
        hover:shadow-lg
        active:scale-95
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-ring
        focus-visible:ring-offset-2
        focus-visible:ring-offset-background
      "
    >
      {/* ICON */}
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex items-center justify-center"
          >
            <Moon
              className="size-6 text-accent"
              aria-hidden
              strokeWidth={2}
            />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex items-center justify-center"
          >
            <Sun
              className="size-6 text-primary"
              aria-hidden
              strokeWidth={2}
            />
          </motion.span>
        )}
      </AnimatePresence>

      {/* GLOW / HALO */}
      <span
        aria-hidden
        className="
          pointer-events-none absolute inset-0 rounded-full
          bg-accent/20 opacity-0 blur-md
          transition-opacity duration-300
          group-hover:opacity-100
          dark:bg-accent/30
        "
      />

      {/* INNER RING (DEPTH) */}
      <span
        aria-hidden
        className="
          absolute inset-px rounded-full
          ring-1 ring-black/5 dark:ring-white/10
        "
      />
    </button>
  );
}
