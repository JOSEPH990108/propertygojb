// src\components\layout\MobileNavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart2,
  MessageSquare,
  FileText,
  User,
} from "lucide-react";

const MOBILE_NAV_ITEMS = [
  { id: "home", icon: Home, href: "/" },
  { id: "stats", icon: BarChart2, href: "/tools" },
  { id: "chat", icon: MessageSquare, href: "/contact" },
  { id: "docs", icon: FileText, href: "/projects" },
  { id: "profile", icon: User, href: "/profile" },
];

export function MobileNavBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[360px]">
      <div
        className="
          relative flex items-center justify-between px-6 py-4
          rounded-[2rem]
          bg-card/90 backdrop-blur-xl
          border border-border
          shadow-xl shadow-black/20 dark:shadow-black/50
        "
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.id}
              className="relative flex h-11 w-11 items-center justify-center"
            >
              {/* Active background */}
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-active"
                  className="
                    absolute inset-0 rounded-xl
                    bg-accent/15
                  "
                  transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                />
              )}

              <item.icon
                className={cn(
                  "relative z-10 h-6 w-6 transition-colors",
                  isActive
                    ? "text-accent"
                    : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Active indicator */}
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-indicator"
                  className="
                    absolute -bottom-1 h-1 w-4 rounded-full
                    bg-accent
                  "
                  transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
