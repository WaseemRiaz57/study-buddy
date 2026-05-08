"use client";

import { useEffect } from "react";

const STATUS_ENDPOINT = "/api/study-buddy/status";

export function markStudyBuddyOffline() {
  const payload = JSON.stringify({ online: false });

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([payload], { type: "application/json" });

    if (navigator.sendBeacon(STATUS_ENDPOINT, blob)) {
      return;
    }
  }

  void fetch(STATUS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Presence cleanup should never interrupt navigation or logout.
  });
}

export function useOfflinePresence() {
  useEffect(() => {
    const handlePageHide = () => {
      markStudyBuddyOffline();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);
}
