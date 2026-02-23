"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGlobalLoaderStore } from "@/stores/global-loader-store";
import { Building2 } from "lucide-react";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function GlobalLoaderContent() {
  const { isVisible, title, message, hide } = useGlobalLoaderStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Automatically hide loader when route changes
  useEffect(() => {
    hide();
  }, [pathname, searchParams, hide]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="
            fixed inset-0 z-[9999]
            flex flex-col items-center justify-center
            bg-background/90 dark:bg-background/95
            backdrop-blur-xl
          "
        >
          {/* Background: Radial Gradient for depth */}
          <div
            aria-hidden
            className="
              absolute inset-0 pointer-events-none
              bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.06)_0%,transparent_70%)]
              dark:bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.1)_0%,transparent_70%)]
            "
          />

          {/* --- LOADER WRAPPER --- */}
          <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
            
            {/* 1. OUTER SPINNER (Rotating) — DESIGN UNCHANGED */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="
                absolute inset-0 rounded-full
                border-t-4 border-accent
                shadow-[0_0_30px_hsl(var(--accent)/0.35)]
              "
            />

            {/* 2. CENTER ICON (Breathing Effect — UNCHANGED) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.1, 1], opacity: 1 }}
              transition={{
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                opacity: { duration: 0.3 },
              }}
              className="relative z-10 flex items-center justify-center"
            >
              <Building2
                className="size-10 text-accent"
                strokeWidth={1.5}
                aria-hidden
              />
            </motion.div>
          </div>

          {/* --- TEXT CONTENT --- */}
          <div className="z-10 flex min-h-[100px] max-w-lg flex-col items-center px-6 text-center">
            <AnimatePresence mode="wait">
              {title && (
                <motion.h3
                  key={title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="
                    text-3xl font-serif font-bold
                    tracking-tight text-foreground
                  "
                >
                  {title}
                </motion.h3>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {message && (
                <motion.p
                  key={message}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="
                    mt-3 text-sm font-medium uppercase tracking-widest
                    text-muted-foreground
                  "
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function GlobalLoader() {
  return (
    <Suspense fallback={null}>
      <GlobalLoaderContent />
    </Suspense>
  );
}
