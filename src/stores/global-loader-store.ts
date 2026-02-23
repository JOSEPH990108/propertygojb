// src\store\global-loader-store.ts
import { create } from 'zustand';

interface GlobalLoaderState {
  isVisible: boolean;
  title: string | null;
  message: string | null;
  // Actions
  show: (title?: string, message?: string) => void;
  hide: () => void;
  update: (title: string, message: string) => void; // Enhanced to update Title too
}

export const useGlobalLoaderStore = create<GlobalLoaderState>((set) => ({
  isVisible: false,
  title: null,
  message: null,
  
  show: (title = "Loading...", message = "Please wait a moment.") =>
    set({ isVisible: true, title, message }),
    
  hide: () => set({ isVisible: false }),
  
  // Allows changing the text smoothly while loader is already visible
  update: (title, message) => set({ title, message }),
}));