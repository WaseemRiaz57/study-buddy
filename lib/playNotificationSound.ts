"use client";

export function playNotificationSound() {
  if (typeof window === "undefined") return;

  const audio = new Audio("/sounds/notification.mp3");
  audio.volume = 0.45;
  audio.play().catch((error) => {
    console.warn("Audio blocked by browser", error);
  });
}
