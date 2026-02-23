// src\app\(auth)\layout.tsx
import GridShape from "@/components/layout/GridShape";
import { Home } from "lucide-react";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        
        {/* ================= LEFT: FORM ================= */}
        <div className="relative flex w-full items-center justify-center lg:w-1/2">
          {/* subtle vignette */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 dark:to-black/30" />
          {children}
        </div>

        {/* ================= RIGHT: BRAND HERO ================= */}
        <div
          className="
            relative hidden w-1/2 overflow-hidden lg:flex
            items-center justify-center
            bg-gradient-to-br
            from-muted/40 via-background to-muted/60
            dark:from-background dark:via-card dark:to-card
          "
        >
          {/* Grid texture */}
          <GridShape />

          {/* Accent glow */}
          <div
            aria-hidden
            className="
              absolute inset-0
              bg-[radial-gradient(circle_at_30%_40%,hsl(var(--accent)/0.18)_0%,transparent_55%)]
              dark:bg-[radial-gradient(circle_at_30%_40%,hsl(var(--accent)/0.25)_0%,transparent_60%)]
            "
          />

          {/* Vertical accent divider */}
          <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-accent/40 to-transparent" />

          {/* Brand Content */}
          <div className="relative z-10 max-w-md px-10 text-left">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-lg">
                <Home className="h-7 w-7 text-accent" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight">
                  PROPERTY<span className="text-accent">GO</span>JB
                </h2>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Premium Property Platform
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Built for investors, homeowners, and professionals who expect more
              than listings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
