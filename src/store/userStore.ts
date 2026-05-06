import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENT = 10;

interface UserState {
  favorites: string[]; // tool ids
  recentTools: string[]; // tool ids, most recent first

  addFavorite: (toolId: string) => void;
  removeFavorite: (toolId: string) => void;
  toggleFavorite: (toolId: string) => void;
  isFavorite: (toolId: string) => boolean;

  addRecentTool: (toolId: string) => void;
  clearRecentTools: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentTools: [],

      addFavorite: (toolId) => {
        set((state) => ({
          favorites: state.favorites.includes(toolId)
            ? state.favorites
            : [...state.favorites, toolId],
        }));
      },

      removeFavorite: (toolId) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== toolId),
        }));
      },

      toggleFavorite: (toolId) => {
        const { favorites } = get();
        if (favorites.includes(toolId)) {
          get().removeFavorite(toolId);
        } else {
          get().addFavorite(toolId);
        }
      },

      isFavorite: (toolId) => get().favorites.includes(toolId),

      addRecentTool: (toolId) => {
        set((state) => {
          const filtered = state.recentTools.filter((id) => id !== toolId);
          return {
            recentTools: [toolId, ...filtered].slice(0, MAX_RECENT),
          };
        });
      },

      clearRecentTools: () => set({ recentTools: [] }),
    }),
    {
      name: "rk-user",
    }
  )
);
