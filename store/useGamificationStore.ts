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
  setInitialData: (xp: number, coins: number, stats?: Partial<GamificationStats>) => void;
  addReward: (xp: number, coins: number) => void;
  reset: () => void;
  refresh: () => Promise<void>;
}

function deriveLevelStats(xp: number) {
  const safeXp = Math.max(0, Number(xp || 0));
  const level = Math.floor(safeXp / 1000) + 1;

  return {
    xp: safeXp,
    level,
    nextLevelXp: level * 1000,
  };
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
  setInitialData: (xp, coins, stats = {}) =>
    set((state) => ({
      stats: {
        ...state.stats,
        ...stats,
        ...deriveLevelStats(xp),
        coins: Math.max(0, Number(coins || 0)),
      },
      isLoaded: true,
    })),
  addReward: (xp, coins) =>
    set((state) => {
      const nextXp = Math.max(0, state.stats.xp + Number(xp || 0));

      return {
        stats: {
          ...state.stats,
          ...deriveLevelStats(nextXp),
          coins: Math.max(0, state.stats.coins + Number(coins || 0)),
        },
        isLoaded: true,
      };
    }),
  reset: () =>
    set({
      stats: { ...EMPTY_GAMIFICATION_STATS },
      isLoaded: false,
    }),
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
