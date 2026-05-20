"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import { Bell, Check, MailOpen } from "lucide-react";

interface UserNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

function formatNotificationTime(value?: string) {
  if (!value) return "";

  const createdAt = new Date(value).getTime();
  const diff = Date.now() - createdAt;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)} mins ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hours ago`;

  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true);
        const response = await fetch("/api/user/notifications", {
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load notifications.");
        }

        const notificationArray = Array.isArray(data?.notifications)
          ? data.notifications
          : [];

        setNotifications(
          notificationArray.map((notification: any) => ({
            id: String(notification._id || notification.id),
            title: notification.title || "Notification",
            message: notification.message || "",
            time: formatNotificationTime(notification.createdAt),
            read: Boolean(notification.read),
          }))
        );
      } catch (error) {
        console.error(error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    let active = true;

    void fetchNotifications();
    const interval = window.setInterval(() => {
      if (active) void fetchNotifications(false);
    }, 45000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const currentUserId = String(session?.user?.id || "").trim();
    if (!currentUserId) return;

    const socket = io("/study-room", {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("study-buddy:identify", { userId: currentUserId });
    });

    socket.on("notification:new", (notification: any) => {
      const nextNotification = {
        id: String(notification?._id || notification?.id || Date.now()),
        title: notification?.title || "Notification",
        message: notification?.message || "",
        time: formatNotificationTime(notification?.createdAt || new Date().toISOString()),
        read: Boolean(notification?.read),
      };

      setNotifications((current) => [
        nextNotification,
        ...current.filter((item) => item.id !== nextNotification.id),
      ].slice(0, 20));
    });

    socket.on("session_completed", (payload: any) => {
      window.dispatchEvent(
        new CustomEvent("mentor-session-completed", {
          detail: payload,
        })
      );
    });

    return () => {
      socket.off("notification:new");
      socket.off("session_completed");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.user?.id]);

  const markAllAsRead = async () => {
    if (isMarkingAllRead || unreadCount === 0) return;

    try {
      setIsMarkingAllRead(true);
      const response = await fetch("/api/user/notifications/mark-all-read", {
        method: "PATCH",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to mark notifications read.");
      }

      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative min-h-[44px] min-w-[44px] rounded-full p-3 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0f0a16]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1a1523] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-200 origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllAsRead()}
                disabled={isMarkingAllRead}
                className="flex min-h-[44px] items-center gap-1 text-xs font-medium text-[#7C3AED] transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check size={14} /> {isMarkingAllRead ? "Clearing..." : "Mark all as read"}
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                <MailOpen size={32} className="opacity-20" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`relative min-h-[44px] cursor-pointer px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
                      !notif.read ? "bg-purple-50/50 dark:bg-purple-900/10" : ""
                    }`}
                  >
                    {!notif.read && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#7C3AED]" />
                    )}
                    <div className="flex justify-between items-start mb-1">
                      <h4
                        className={`text-sm ${
                          !notif.read
                            ? "font-semibold text-slate-900 dark:text-white"
                            : "font-medium text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-center">
            <button className="min-h-[44px] text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

