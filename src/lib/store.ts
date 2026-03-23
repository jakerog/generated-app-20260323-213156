import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  userId: string | null;
  setUserId: (id: string | null) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      userId: null, // Start unauthenticated
      setUserId: (id) => set({ userId: id }),
      isAdmin: false, // Default to false for security
      setIsAdmin: (val) => set({ isAdmin: val }),
    }),
    {
      name: 'price-watch-storage',
    }
  )
);