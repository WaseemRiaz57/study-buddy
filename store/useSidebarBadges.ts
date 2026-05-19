"use client";

import { create } from "zustand";

export type SidebarBadgeKey =
  | "reports"
  | "pendingMentors"
  | "resources"
  | "messages";

type SidebarBadgeState = {
  counts: Record<SidebarBadgeKey, number>;
  setBadge: (key: SidebarBadgeKey, count: number) => void;
  setBadges: (counts: Partial<Record<SidebarBadgeKey, number>>) => void;
  clearBadge: (key: SidebarBadgeKey) => void;
};

const initialCounts: Record<SidebarBadgeKey, number> = {
  reports: 0,
  pendingMentors: 0,
  resources: 0,
  messages: 0,
};

export const useSidebarBadges = create<SidebarBadgeState>((set) => ({
  counts: initialCounts,
  setBadge: (key, count) =>
    set((state) => ({
      counts: {
        ...state.counts,
        [key]: Math.max(0, Math.floor(Number(count) || 0)),
      },
    })),
  setBadges: (counts) =>
    set((state) => ({
      counts: {
        ...state.counts,
        ...Object.fromEntries(
          Object.entries(counts).map(([key, value]) => [
            key,
            Math.max(0, Math.floor(Number(value) || 0)),
          ])
        ),
      } as Record<SidebarBadgeKey, number>,
    })),
  clearBadge: (key) =>
    set((state) => ({
      counts: {
        ...state.counts,
        [key]: 0,
      },
    })),
}));
