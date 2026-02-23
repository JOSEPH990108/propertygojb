// src\app\layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { Toaster } from "@/components/ui/sonner";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { GlobalLoader } from "@/components/shared/GlobalLoader";
import ThemeTogglerTwo from "@/components/layout/ThemeTogglerTwo";
import { ThemeProvider } from "@/hooks/useTheme";
import LoginModal from "@/components/auth/LoginModal";
import { ScrollLoginTrigger } from "@/components/shared/ScrollLoginTrigger";
import OnboardingModal from "@/components/auth/OnboardingModal";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PropertyGoJB - Premier Johor Real Estate",
  description: "Discover the finest properties in Johor Bahru.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          playfair.variable,
          inter.variable
        )}
      >
        <ThemeProvider>
          <SmoothScroll>
            <CustomCursor />
            <ScrollLoginTrigger />

            {children}
            
            <LoginModal />
            <OnboardingModal />
            <div className="fixed z-50 transition-all duration-300 bottom-32 right-6 md:bottom-6">
              <ThemeTogglerTwo />
            </div>
            <Toaster />
            <GlobalLoader />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}