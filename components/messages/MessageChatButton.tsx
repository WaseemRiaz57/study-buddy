"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import { MessageCircle, X } from "lucide-react";
import { MessagesPanel } from "@/components/messages/MessagesPanel";
import { getStudyRoomSocketUrl } from "@/lib/socket-client";
import { useSidebarBadges } from "@/store/useSidebarBadges";

type ConversationSummary = {
  id: string;
};

export function MessageChatButton() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const conversationIdsRef = useRef<string[]>([]);
  const unreadCount = useSidebarBadges((state) => state.counts.messages);
  const setBadge = useSidebarBadges((state) => state.setBadge);
  const currentUserId = String(session?.user?.id || "").trim();

  const joinKnownConversations = useCallback(() => {
    if (!currentUserId || !socketRef.current?.connected) return;

    conversationIdsRef.current.forEach((conversationId) => {
      socketRef.current?.emit("join-conversation", {
        conversationId,
        userId: currentUserId,
      });
    });
  }, [currentUserId]);

  const refreshUnreadState = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const [unreadResponse, conversationsResponse] = await Promise.all([
        fetch("/api/messages/unread-count", { cache: "no-store" }),
        fetch("/api/messages", { cache: "no-store" }),
      ]);
      const unreadData = await unreadResponse.json().catch(() => null);
      const conversationsData = await conversationsResponse.json().catch(() => null);

      if (unreadResponse.ok) {
        setBadge("messages", Number(unreadData?.unreadConversations || 0));
      }

      if (conversationsResponse.ok && Array.isArray(conversationsData?.conversations)) {
        conversationIdsRef.current = conversationsData.conversations
          .map((conversation: ConversationSummary) => String(conversation.id || ""))
          .filter(Boolean);
        joinKnownConversations();
      }
    } catch {
      setBadge("messages", 0);
    }
  }, [joinKnownConversations, setBadge, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    void refreshUnreadState();
    const intervalId = window.setInterval(() => {
      void refreshUnreadState();
    }, 45000);
    window.addEventListener("messages:unread-updated", refreshUnreadState);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("messages:unread-updated", refreshUnreadState);
    };
  }, [refreshUnreadState, status]);

  useEffect(() => {
    if (!currentUserId) return;

    const socketUrl = getStudyRoomSocketUrl();
    if (!socketUrl) return;

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("study-buddy:identify", { userId: currentUserId });
      joinKnownConversations();
    });

    socket.on("receive-message", () => {
      void refreshUnreadState();
    });

    return () => {
      socket.off("receive-message");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, joinKnownConversations, refreshUnreadState]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative min-h-[44px] min-w-[44px] rounded-full p-3 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#7C3AED] dark:text-slate-400 dark:hover:bg-white/10"
        aria-label={
          unreadCount > 0
            ? `Open Messages chat, ${unreadCount} unread conversations`
            : "Open Messages chat"
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <MessageCircle size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0f0a16]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          role="dialog"
          aria-label="Messages chat"
          className="absolute right-0 top-full z-[80] mt-2 w-[calc(100vw-1.5rem)] max-w-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#191121]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Messages
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chat with students and Mentors.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close Messages chat"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <MessagesPanel variant="popover" />
        </section>
      )}
    </div>
  );
}
