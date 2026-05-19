"use client";

import { useEffect, useRef } from "react";
import { showRewardToast } from "@/components/gamification/RewardToast";
import { useGamificationStore } from "@/store/useGamificationStore";

const ACTIVE_REWARD_MS = 30 * 60 * 1000;

export function useActiveTimeReward() {
  const setStats = useGamificationStore((state) => state.setStats);
  const addReward = useGamificationStore((state) => state.addReward);
  const activeMsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    const tick = async () => {
      const now = Date.now();
      const lastTick = lastTickRef.current ?? now;
      lastTickRef.current = now;

      if (document.hidden || pendingRef.current) return;

      activeMsRef.current += now - lastTick;

      if (activeMsRef.current < ACTIVE_REWARD_MS) return;

      pendingRef.current = true;
      activeMsRef.current = 0;

      try {
        const response = await fetch("/api/gamification/time-reward", {
          method: "PATCH",
        });
        const data = await response.json().catch(() => null);

        if (response.ok && data?.awarded) {
          addReward(
            Number(data.reward?.xpAwarded || 10),
            Number(data.reward?.coinsAwarded || 0)
          );
          setStats(data.stats || data.reward?.profile || {});
          showRewardToast({
            title: "Active Study Reward!",
            xp: Number(data.reward?.xpAwarded || 10),
            coins: Number(data.reward?.coinsAwarded || 0),
          });
          window.dispatchEvent(new Event("gamification-stats-updated"));
        }
      } finally {
        pendingRef.current = false;
      }
    };

    const interval = window.setInterval(() => {
      void tick();
    }, 30_000);

    const resetTick = () => {
      lastTickRef.current = Date.now();
    };

    window.addEventListener("focus", resetTick);
    document.addEventListener("visibilitychange", resetTick);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", resetTick);
      document.removeEventListener("visibilitychange", resetTick);
    };
  }, [addReward, setStats]);
}
