"use client";

import { SessionProvider } from "next-auth/react";
import { useUserHeartbeat } from "@/hooks/useUserHeartbeat";

function HeartbeatBridge() {
  useUserHeartbeat();
  return null;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HeartbeatBridge />
      {children}
    </SessionProvider>
  );
}
