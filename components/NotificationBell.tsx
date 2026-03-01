"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, MailOpen } from "lucide-react";

// Mock Notifications (Jab backend banega toh ye database se aayenge)
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "Welcome to StudyBuddy! 🚀",
    message: "Explore our new AI Generator to create instant flashcards.",
    time: "2 mins ago",
    read: false,
    type: "system",
  },
  {
    id: 2,
    title: "Weekly Challenge Started",
    message: "Complete 5 Pomodoro sessions to earn 500 XP!",
    time: "2 hours ago",
    read: false,
    type: "gamification",
  },
  {
    id: 3,
    title: "Admin Alert",
    message: "System maintenance scheduled for tonight at 12 AM.",
    time: "1 day ago",
    read: true,
    type: "admin",
  },
];

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0f0a16]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1a1523] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-200 origin-top-right">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
              >
                <Check size={14} /> Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
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
                    className={`px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors relative ${
                      !notif.read ? "bg-purple-50/50 dark:bg-purple-900/10" : ""
                    }`}
                  >
                    {!notif.read && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 dark:bg-purple-400" />
                    )}
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm ${!notif.read ? "font-semibold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
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
          
          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-center">
            <button className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-medium">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}