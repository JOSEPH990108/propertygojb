// src\stores\property-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PropertyData, getInitialPropertyData } from '@/app/actions/property-actions';

interface PropertyState {
  data: PropertyData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchData: (force?: boolean) => Promise<void>;
  reset: () => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      data: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchData: async (force = false) => {
        const { data, isLoading } = get();

        // Prevent duplicate fetches if already loading
        if (isLoading) return;

        // If data exists and we aren't forcing a refresh, return early
        // The user said "store until close window", and sessionStorage persists on refresh.
        // So we only fetch if data is null.
        if (data && !force) return;

        set({ isLoading: true, error: null });

        try {
          const result = await getInitialPropertyData();
          set({
            data: result,
            isLoading: false,
            lastFetched: Date.now()
          });
        } catch (err) {
          console.error('Failed to fetch property data:', err);
          set({
            error: 'Failed to load property data',
            isLoading: false
          });
        }
      },

      reset: () => set({ data: null, isLoading: false, error: null, lastFetched: null }),
    }),
    {
      name: 'property-storage', // key in storage
      storage: createJSONStorage(() => sessionStorage), // Session Storage = cleared on tab close
      partialize: (state) => ({
        data: state.data,
        lastFetched: state.lastFetched
      }), // Only persist data and timestamp, not loading state
    }
  )
);
