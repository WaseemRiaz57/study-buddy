"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { Bell, Check, MailOpen, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { playNotificationSound } from "@/lib/playNotificationSound";
import { getStudyRoomSocketUrl } from "@/lib/socket-client";

interface UserNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  createdAt?: string;
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<UserNotification | null>(null);
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
            createdAt: notification.createdAt,
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
    });

    socket.on("notification:new", (notification: any) => {
      playNotificationSound();

      const nextNotification = {
        id: String(notification?._id || notification?.id || Date.now()),
        title: notification?.title || "Notification",
        message: notification?.message || "",
        time: formatNotificationTime(notification?.createdAt || new Date().toISOString()),
        createdAt: notification?.createdAt || new Date().toISOString(),
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

    socket.on("session:started", (payload: any) => {
      window.dispatchEvent(
        new CustomEvent("mentor-session-started", {
          detail: payload,
        })
      );
      router.refresh();
    });

    socket.on("mentor:session-invitation", (payload: any) => {
      playNotificationSound();
      
      const { sessionId, mentorName = "Your Mentor", subject = "Session" } = payload;
      
      window.dispatchEvent(
        new CustomEvent("student-session-invited", {
          detail: payload,
        })
      );
      router.refresh();
      
      toast.custom(
        (t) => (
          <div className="flex w-full min-w-[320px] flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-surface-dark">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Mentor session invitation
                </h3>
                <p className="text-sm text-slate-500">
                  {mentorName} invited you to join {subject}.
                </p>
              </div>
              <button onClick={() => toast.dismiss(t)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
            <Link 
              href={`/dashboard/study-rooms/${sessionId}`}
              onClick={() => toast.dismiss(t)}
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
            >
              Join Room
            </Link>
          </div>
        ),
        { duration: 15000 }
      );
    });

    return () => {
      socket.off("notification:new");
      socket.off("session_completed");
      socket.off("session:started");
      socket.off("mentor:session-invitation");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [router, session?.user?.id]);

  const markAllAsRead = async () => {
    if (isMarkingAllRead || notifications.length === 0) return;

    try {
      setIsMarkingAllRead(true);
      const response = await fetch("/api/user/notifications/mark-all-read", {
        method: "PATCH",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to clear notifications.");
      }

      setNotifications([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const openAndRemoveNotification = async (notification: UserNotification) => {
    setSelectedNotification(notification);
    setNotifications((current) => current.filter((item) => item.id !== notification.id));

    try {
      await fetch(`/api/user/notifications/${notification.id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative min-h-[44px] min-w-[44px] rounded-full p-3 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
        aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : "Open notifications"}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
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
            {notifications.length > 0 && (
              <button
                onClick={() => void markAllAsRead()}
                disabled={isMarkingAllRead}
                className="flex min-h-[44px] items-center gap-1 text-xs font-medium text-[#7C3AED] transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check size={14} /> {isMarkingAllRead ? "Clearing..." : "Clear All"}
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
                  <button
                    type="button"
                    key={notif.id}
                    onClick={() => void openAndRemoveNotification(notif)}
                    className={`relative block min-h-[44px] w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
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
                  </button>
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

      {selectedNotification && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={selectedNotification.title}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#191121]"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                  Notification
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedNotification.title}
                </h2>
                {selectedNotification.time && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {selectedNotification.time}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close notification dialog"
              >
                <X size={18} />
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {selectedNotification.message}
            </p>
            <button
              type="button"
              onClick={() => setSelectedNotification(null)}
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700"
            >
              Done
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

