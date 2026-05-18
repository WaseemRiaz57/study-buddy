import { create } from "zustand";

export interface GamificationStats {
  xp: number;
  coins: number;
  streak: number;
  streakFreezes: number;
  level: number;
  nextLevelXp: number;
}

export const EMPTY_GAMIFICATION_STATS: GamificationStats = {
  xp: 0,
  coins: 0,
  streak: 0,
  streakFreezes: 0,
  level: 1,
  nextLevelXp: 1000,
};

interface GamificationState {
  stats: GamificationStats;
  isLoaded: boolean;
  setStats: (stats: Partial<GamificationStats>) => void;
  refresh: () => Promise<void>;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  stats: EMPTY_GAMIFICATION_STATS,
  isLoaded: false,
  setStats: (stats) =>
    set((state) => ({
      stats: {
        ...state.stats,
        ...stats,
      },
      isLoaded: true,
    })),
  refresh: async () => {
    const response = await fetch("/api/user/gamification-stats", {
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.stats) return;

    set({
      stats: {
        ...EMPTY_GAMIFICATION_STATS,
        ...data.stats,
      },
      isLoaded: true,
    });
  },
}));
