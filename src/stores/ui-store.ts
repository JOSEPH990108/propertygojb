import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getKLDate } from '@/lib/utils';

interface UIState {
  isLoginOpen: boolean;
  dismissedDate: string | null;
  authMode: "signin" | "signup";

  // Actions
  setLoginOpen: (open: boolean, mode?: "signin" | "signup") => void;
  setAuthMode: (mode: "signin" | "signup") => void;
  dismissModal: () => void;
  resetDismissed: () => void; // Optional helper
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isLoginOpen: false,
      dismissedDate: null,
      authMode: "signin",

      setLoginOpen: (open, mode) => set((state) => ({
        isLoginOpen: open,
        authMode: mode ?? state.authMode
      })),

      setAuthMode: (mode) => set({ authMode: mode }),

      dismissModal: () => set({
        isLoginOpen: false,
        dismissedDate: getKLDate()
      }),

      resetDismissed: () => set({ dismissedDate: null }),
    }),
    {
      name: 'ui-storage', // key in localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dismissedDate: state.dismissedDate
      }), // Only persist dismissedDate
    }
  )
);
