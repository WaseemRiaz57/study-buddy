"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;
const ACTIVITY_WINDOW_MS = 2.5 * 60 * 1000;
const MIN_IMMEDIATE_PING_GAP_MS = 30 * 1000;

export function useUserHeartbeat() {
  const { status } = useSession();
  const lastActivityRef = useRef(Date.now());
  const lastPingRef = useRef(0);

  const ping = useCallback(async (force = false) => {
    if (status !== "authenticated") return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

    const now = Date.now();
    const isRecentlyActive = now - lastActivityRef.current <= ACTIVITY_WINDOW_MS;
    const canPing = force || now - lastPingRef.current >= MIN_IMMEDIATE_PING_GAP_MS;

    if (!isRecentlyActive || !canPing) return;

    lastPingRef.current = now;

    await fetch("/api/user/heartbeat", {
      method: "PATCH",
      keepalive: true,
    }).catch(() => {
      lastPingRef.current = 0;
    });
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const markActive = () => {
      lastActivityRef.current = Date.now();
      void ping();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActive();
      }
    };

    markActive();

    const activityEvents = ["pointerdown", "keydown", "focus", "scroll"];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActive, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = window.setInterval(() => {
      void ping(true);
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActive);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, [ping, status]);
}
