// src\components\layout\NavBar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, User, Calendar, Bell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import StaggeredDropDown from "@/components/custom/ui/StaggeredDropdown";
import { MobileNavBar } from "./MobileNavBar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";

/* ================= CONFIG ================= */

const MENU_ITEMS = [
  {
    id: "projects",
    label: "Projects",
    href: "/projects",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop",
    description: "Curated collection of premier developments.",
  },
  {
    id: "tools",
    label: "Tools",
    href: "/tools",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2670&auto=format&fit=crop",
    description: "Financial calculators and property matchmaker.",
  },
  {
    id: "contact",
    label: "Contact Us",
    href: "/contact",
    image:
      "https://images.unsplash.com/photo-1516387938699-a93567ec168e?q=80&w=2671&auto=format&fit=crop",
    description: "Get in touch with our specialized agents.",
  },
];

/* ================= COMPONENT ================= */

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const session = authClient.useSession();

  /* Close on route change */
  useEffect(() => setIsOpen(false), [pathname]);

  /* Lock scroll when menu open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
  }, [isOpen]);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    useUIStore.getState().resetDismissed();
    router.push("/");
  };

  const profileOptions = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      onClick: () => router.push("/profile"),
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: Calendar,
      onClick: () => router.push("/appointments"),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      onClick: () => router.push("/notifications"),
    },
    {
      id: "signout",
      label: "Sign Out",
      icon: LogOut,
      onClick: handleSignOut,
    },
  ];

  return (
    <>
      {/* ================= HEADER ================= */}
      <header
        className={cn(
          "hidden md:block fixed inset-x-0 top-0 z-50 transition-all duration-300",
          isOpen
            ? "bg-transparent border-transparent"
            : "bg-background/80 backdrop-blur-xl border-b border-border"
        )}
      >
        <div className="container h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Home className="h-5 w-5" />
            </span>
            <span className="hidden sm:block font-serif tracking-[0.2em] text-foreground">
              PROPERTY<span className="text-accent">GO</span>JB
            </span>
          </Link>

          {/* Menu Toggle */}
          <button
            onClick={() => setIsOpen((v) => !v)}
            aria-label="Toggle menu"
            className="
              hidden md:flex items-center gap-3 px-6 py-2 rounded-full
              bg-card text-foreground
              border border-border
              shadow-sm shadow-black/20
              transition-all duration-300

              hover:bg-accent hover:text-accent-foreground
              hover:border-accent
              hover:shadow-md hover:shadow-black/30

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
              focus-visible:ring-offset-2
              focus-visible:ring-offset-background
            "
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.span key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }}>
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90 }} animate={{ rotate: 0 }}>
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>

            <span className="text-[10px] tracking-[0.25em] uppercase">
              {isOpen ? "Close" : "Menu"}
            </span>
          </button>

          {/* Profile */}
          <div className={cn(isOpen && "opacity-0 pointer-events-none")}>
             {session.data?.user ? (
                <StaggeredDropDown
                  variant="profile"
                  label={getInitials(session.data.user.name)}
                  userImage={session.data.user.image || undefined}
                  options={profileOptions}
                />
             ) : (
                 <Link
                   href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`}
                   className="text-sm font-medium hover:text-primary transition-colors"
                 >
                   Sign In
                 </Link>
             )}
          </div>
        </div>
      </header>

      {/* ================= MOBILE NAV ================= */}
      <MobileNavBar />

      {/* ================= FULLSCREEN OVERLAY ================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-40 hidden md:block
              bg-background
            "
          >
            {/* ===== Background Image Layer ===== */}
            <div className="absolute inset-0 z-0">
              {/* STRONG CONTRAST VEIL (KEY FIX) */}
              <div
                className="
                  absolute inset-0 z-10
                  bg-gradient-to-b
                  from-black/70
                  via-black/55
                  to-black/70
                  dark:from-black/90
                  dark:via-black/65
                  dark:to-black/90
                "
              />

              {/* Hover Images */}
              {MENU_ITEMS.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{
                    opacity: hoveredItem === item.id ? 0.6 : 0,
                    scale: hoveredItem === item.id ? 1 : 1.05,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    className="
                      object-cover
                      saturate-[0.85]
                      contrast-[1.1]
                      brightness-[0.6]
                      dark:brightness-[0.5]
                    "
                  />
                </motion.div>
              ))}
            </div>

            {/* ===== Menu Content ===== */}
            <div className="relative z-20 h-full container flex items-center">
              <nav className="flex flex-col gap-8 pl-20">
                {MENU_ITEMS.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ x: -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="group"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="relative block"
                    >
                      {/* MAIN LABEL */}
                      <span
                        className={cn(
                          `
                            block text-8xl font-serif font-light
                            transition-all duration-300
                          `,
                          hoveredItem === item.id
                            ? "text-accent translate-x-4 italic"
                            : "text-white/70 group-hover:text-white"
                        )}
                      >
                        {item.label}
                      </span>

                      {/* DESCRIPTION */}
                      {hoveredItem === item.id && (
                        <motion.p
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="
                            mt-2 max-w-md
                            text-sm tracking-wide
                            text-white/70
                          "
                        >
                          {item.description}
                        </motion.p>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
