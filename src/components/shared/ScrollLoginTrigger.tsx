"use client";
import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";
import { authClient } from "@/lib/auth-client";
import { getKLDate } from "@/lib/utils";

interface ScrollLoginTriggerProps {
  /**
   * The percentage of the page scroll height (0.0 - 1.0) at which to trigger the modal.
   * Defaults to 0.25 (25%).
   */
  threshold?: number;
}

export function ScrollLoginTrigger({ threshold = 0.25 }: ScrollLoginTriggerProps) {
  const { setLoginOpen, isLoginOpen, dismissedDate } = useUIStore();
  const { data: session, isPending } = authClient.useSession();

  // Check if dismissed today (in KL time)
  const hasDismissedToday = dismissedDate === getKLDate();

  useEffect(() => {
    const handleScroll = () => {
      // 1. Fail silently if session is loading or user is already logged in
      if (isPending || session) return;

      // 2. Calculate scroll percentage
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Safety check to prevent division by zero or negative values
      if (scrollableHeight <= 0) return;

      const scrollPercent = window.scrollY / scrollableHeight;

      // 3. Trigger logic
      if (scrollPercent > threshold && !isLoginOpen && !hasDismissedToday) {
        setLoginOpen(true, "signin");
      }
    };

    // Initial check in case user is already scrolled when session loads
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setLoginOpen, isLoginOpen, hasDismissedToday, session, isPending, threshold]);

  return null;
}
