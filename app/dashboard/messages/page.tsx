"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import {
  CalendarPlus,
  ChevronLeft,
  Loader2,
  MessageSquare,
  MoreVertical,
  Paperclip,
  PenSquare,
  Phone,
  Search,
  Send,
  Share2,
  Smile,
  Video,
} from "lucide-react";

interface ChatUser {
  id: string;
  name: string;
  image: string;
  initials: string;
  role: string;
  lastActive: string | null;
}

interface Conversation {
  id: string;
  otherParticipant: ChatUser;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  isRead: boolean;
  createdAt: string | null;
  pending?: boolean;
}

const QUICK_ACTIONS = [
  { label: "Schedule next session", icon: CalendarPlus },
  { label: "Share resource", icon: Share2 },
];

function formatRelativeTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return "";

  const diffMs = Date.now() - date;
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMessageTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isRecentlyActive(value: string | null) {
  if (!value) return false;

  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return false;

  return Date.now() - date <= 5 * 60 * 1000;
}

function normalizeRole(role: string) {
  const normalized = String(role || "student").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function mergeConversation(list: Conversation[], conversation: Conversation) {
  const next = [
    conversation,
    ...list.filter((item) => item.id !== conversation.id),
  ];

  return next.sort(
    (a, b) =>
      new Date(b.lastMessageAt || 0).getTime() -
      new Date(a.lastMessageAt || 0).getTime()
  );
}

function mergeMessage(list: ChatMessage[], message: ChatMessage) {
  if (list.some((item) => item.id === message.id)) {
    return list.map((item) => (item.id === message.id ? message : item));
  }

  return [...list, message];
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const currentUserId = String(session?.user?.id || "");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<ChatUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [typingUserName, setTypingUserName] = useState("");
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeConversationRef = useRef("");
  const typingTimeoutRef = useRef<number | null>(null);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter((conversation) =>
      conversation.otherParticipant.name.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const loadConversations = useCallback(async () => {
    const response = await fetch("/api/messages", { cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Unable to load conversations.");
    }

    const nextConversations = Array.isArray(data?.conversations)
      ? data.conversations
      : [];

    setConversations(nextConversations);
    return nextConversations as Conversation[];
  }, []);

  const ensureConversation = useCallback(async (userId: string) => {
    const response = await fetch(
      `/api/messages?user=${encodeURIComponent(userId)}`,
      { cache: "no-store" }
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Unable to open conversation.");
    }

    return data?.conversation as Conversation;
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    let mounted = true;

    const bootstrap = async () => {
      try {
        setIsLoadingConversations(true);
        const params = new URLSearchParams(window.location.search);
        const targetUserId = String(params.get("user") || "").trim();
        const targetChatId = String(params.get("chatId") || "").trim();

        if (targetUserId) {
          const conversation = await ensureConversation(targetUserId);
          if (!mounted) return;

          setConversations((current) => mergeConversation(current, conversation));
          setActiveConversationId(conversation.id);
          await loadConversations();
          return;
        }

        const nextConversations = await loadConversations();
        if (!mounted) return;

        setActiveConversationId(
          (current) => current || targetChatId || nextConversations[0]?.id || ""
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load conversations."
        );
      } finally {
        if (mounted) setIsLoadingConversations(false);
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [ensureConversation, loadConversations, status]);

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2 || status !== "authenticated") {
      setUserSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`,
          { cache: "no-store" }
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Unable to search users.");
        }

        if (active) {
          setUserSearchResults(Array.isArray(data?.users) ? data.users : []);
        }
      } catch (error) {
        if (active) {
          console.error(error);
          setUserSearchResults([]);
        }
      } finally {
        if (active) setIsSearchingUsers(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, status]);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!currentUserId) return;

    const socket = io("/study-room", {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("study-buddy:identify", { userId: currentUserId });

      if (activeConversationRef.current) {
        socket.emit("join-conversation", {
          conversationId: activeConversationRef.current,
          userId: currentUserId,
        });
      }
    });

    socket.on(
      "study-buddy:identified",
      (payload: { onlineUserIds?: string[] }) => {
        setOnlineUserIds(Array.isArray(payload?.onlineUserIds) ? payload.onlineUserIds : []);
      }
    );

    socket.on(
      "user_online",
      (payload: { userId?: string; onlineUserIds?: string[] }) => {
        setOnlineUserIds((current) =>
          Array.isArray(payload?.onlineUserIds)
            ? payload.onlineUserIds
            : payload?.userId && !current.includes(payload.userId)
              ? [...current, payload.userId]
              : current
        );
      }
    );

    socket.on(
      "user_offline",
      (payload: { userId?: string; onlineUserIds?: string[] }) => {
        setOnlineUserIds((current) =>
          Array.isArray(payload?.onlineUserIds)
            ? payload.onlineUserIds
            : payload?.userId
              ? current.filter((userId) => userId !== payload.userId)
              : current
        );
      }
    );

    socket.on(
      "typing",
      (payload: { conversationId?: string; userId?: string; userName?: string }) => {
        if (
          payload?.conversationId === activeConversationRef.current &&
          payload?.userId !== currentUserId
        ) {
          setTypingUserName(payload.userName || "User");
        }
      }
    );

    socket.on(
      "stop_typing",
      (payload: { conversationId?: string; userId?: string }) => {
        if (
          payload?.conversationId === activeConversationRef.current &&
          payload?.userId !== currentUserId
        ) {
          setTypingUserName("");
        }
      }
    );

    socket.on(
      "receive-message",
      (payload: { conversationId?: string; message?: ChatMessage }) => {
        const conversationId = String(payload?.conversationId || "");
        const incomingMessage = payload?.message;

        if (!conversationId || !incomingMessage?.id) return;

        setConversations((current) => {
          const existing = current.find(
            (conversation) => conversation.id === conversationId
          );

          if (!existing) return current;

          return mergeConversation(current, {
            ...existing,
            lastMessage: incomingMessage.text,
            lastMessageAt: incomingMessage.createdAt,
            unreadCount:
              activeConversationRef.current === conversationId ||
              incomingMessage.senderId === currentUserId
                ? existing.unreadCount
                : existing.unreadCount + 1,
          });
        });

        if (activeConversationRef.current === conversationId) {
          setMessages((current) => mergeMessage(current, incomingMessage));
        }
      }
    );

    return () => {
      socket.off("receive-message");
      socket.off("study-buddy:identified");
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("typing");
      socket.off("stop_typing");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;

    socketRef.current?.emit("join-conversation", {
      conversationId: activeConversationId,
      userId: currentUserId,
    });

    let mounted = true;

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const response = await fetch(
          `/api/messages?conversationId=${encodeURIComponent(activeConversationId)}`,
          { cache: "no-store" }
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load messages.");
        }

        if (mounted) {
          setMessages(Array.isArray(data?.messages) ? data.messages : []);
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === activeConversationId
                ? { ...conversation, unreadCount: 0 }
                : conversation
            )
          );
          window.dispatchEvent(new Event("messages:unread-updated"));
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load messages."
        );
      } finally {
        if (mounted) setIsLoadingMessages(false);
      }
    };

    void loadMessages();

    return () => {
      socketRef.current?.emit("leave-conversation", {
        conversationId: activeConversationId,
        userId: currentUserId,
      });
      mounted = false;
    };
  }, [activeConversationId, currentUserId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeConversationId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    setTypingUserName("");
    setShowSidebar(false);
  };

  const openUserConversation = (userId: string) => {
    setSearchQuery("");
    setUserSearchResults([]);
    setShowSidebar(false);
    router.push(`/dashboard/messages/${userId}`);
  };

  const emitStopTyping = useCallback(() => {
    if (!activeConversationId || !currentUserId) return;

    socketRef.current?.emit("stop_typing", {
      conversationId: activeConversationId,
      userId: currentUserId,
    });
  }, [activeConversationId, currentUserId]);

  const handleMessageInputChange = (value: string) => {
    setMessageInput(value);

    if (!activeConversationId || !currentUserId) return;

    if (!value.trim()) {
      emitStopTyping();
      return;
    }

    socketRef.current?.emit("typing", {
      conversationId: activeConversationId,
      userId: currentUserId,
      userName: session?.user?.name || "User",
    });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      emitStopTyping();
    }, 1200);
  };

  const sendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !activeConversationId || !currentUserId || isSending) return;

    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUserId,
      text,
      isRead: false,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessageInput("");
    emitStopTyping();
    setMessages((current) => [...current, tempMessage]);

    try {
      setIsSending(true);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          text,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to send message.");
      }

      const savedMessage = data?.message as ChatMessage;
      const updatedConversation = data?.conversation as Conversation | null;

      setMessages((current) =>
        current.map((message) =>
          message.id === tempMessage.id ? savedMessage : message
        )
      );

      if (updatedConversation) {
        setConversations((current) =>
          mergeConversation(current, updatedConversation)
        );
      }

      socketRef.current?.emit("send-message", {
        conversationId: activeConversationId,
        message: savedMessage,
      });
      window.dispatchEvent(new Event("messages:unread-updated"));
    } catch (error) {
      setMessages((current) =>
        current.filter((message) => message.id !== tempMessage.id)
      );
      setMessageInput(text);
      toast.error(
        error instanceof Error ? error.message : "Unable to send message."
      );
    } finally {
      setIsSending(false);
    }
  };

  const renderAvatar = (user: ChatUser, sizeClass = "h-11 w-11") => (
    <div className="relative shrink-0">
      <div
        className={`${sizeClass} flex items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-xs font-bold text-white`}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="h-full w-full object-cover"
          />
        ) : (
          user.initials
        )}
      </div>
      {(onlineUserIds.includes(user.id) || isRecentlyActive(user.lastActive)) && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[#191121]" />
      )}
    </div>
  );

  return (
    <main className="relative h-screen overflow-hidden bg-background text-foreground dark:bg-[#191121]">
      <div className="flex h-full">
        <aside
          className={`
            ${showSidebar ? "translate-x-0" : "-translate-x-full"}
            fixed inset-y-0 left-0 z-30 flex w-80 shrink-0 flex-col
            border-r border-border bg-white/90 backdrop-blur-xl transition-transform
            duration-300 ease-in-out dark:bg-[#191121]/95 md:static md:translate-x-0
          `}
        >
          <div className="px-5 pb-3 pt-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Messages</h2>
              <button className="rounded-lg p-2 transition-colors hover:bg-slate-200/60 dark:hover:bg-white/10">
                <PenSquare size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search people or conversations..."
                aria-label="Search people or conversations"
                className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 dark:bg-white/5"
              />
              {searchQuery.trim().length >= 2 && (
                <div
                  role="listbox"
                  aria-label="User search results"
                  className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-border bg-white shadow-2xl dark:border-white/10 dark:bg-[#21172b]"
                >
                  {isSearchingUsers ? (
                    <div className="flex min-h-[64px] items-center justify-center">
                      <Loader2
                        size={18}
                        className="animate-spin text-[#7C3AED]"
                        aria-hidden="true"
                      />
                    </div>
                  ) : userSearchResults.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-muted-foreground">
                      No matching users found.
                    </p>
                  ) : (
                    userSearchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => openUserConversation(user.id)}
                        className="flex min-h-[56px] w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[#7C3AED]/10"
                      >
                        {renderAvatar(user, "h-9 w-9")}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {user.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {normalizeRole(user.role)}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {isLoadingConversations ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="animate-spin text-[#7C3AED]" size={24} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="mx-3 mt-8 rounded-2xl border border-dashed border-border p-5 text-center">
                <MessageSquare className="mx-auto mb-2 text-muted-foreground" size={24} />
                <p className="text-sm font-semibold text-foreground">
                  No conversations yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start from a mentor or student profile.
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const user = conversation.otherParticipant;
                const isActive = activeConversationId === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => selectConversation(conversation.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                      isActive
                        ? "border-[#7C3AED]/30 bg-[#7C3AED]/10"
                        : "border-transparent hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {renderAvatar(user)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {user.name}
                        </span>
                        <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">
                          {formatRelativeTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {conversation.lastMessage || normalizeRole(user.role)}
                      </p>
                    </div>

                    {conversation.unreadCount > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {showSidebar && (
          <button
            aria-label="Close conversations"
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between border-b border-border bg-white/80 px-4 py-3 backdrop-blur-xl dark:bg-white/5 md:px-6">
            {activeConversation ? (
              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg p-1.5 transition-colors hover:bg-slate-200/60 dark:hover:bg-white/10 md:hidden"
                  onClick={() => setShowSidebar(true)}
                >
                  <ChevronLeft size={20} className="text-foreground" />
                </button>

                {renderAvatar(activeConversation.otherParticipant, "h-10 w-10")}

                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {activeConversation.otherParticipant.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {onlineUserIds.includes(activeConversation.otherParticipant.id) ||
                    isRecentlyActive(activeConversation.otherParticipant.lastActive) ? (
                      <>
                        <span className="text-emerald-500">Online</span>
                        {" - "}
                        {normalizeRole(activeConversation.otherParticipant.role)}
                      </>
                    ) : (
                      normalizeRole(activeConversation.otherParticipant.role)
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg p-1.5 transition-colors hover:bg-slate-200/60 dark:hover:bg-white/10 md:hidden"
                  onClick={() => setShowSidebar(true)}
                >
                  <ChevronLeft size={20} className="text-foreground" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Select a conversation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Your messages will appear here.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1">
              <button className="hidden rounded-lg p-2 transition-colors hover:bg-slate-200/60 dark:hover:bg-white/10 sm:flex">
                <Phone size={18} className="text-muted-foreground" />
              </button>
              <button className="rounded-lg p-2 transition-colors hover:bg-slate-200/60 dark:hover:bg-white/10">
                <Video size={18} className="text-muted-foreground" />
              </button>
              <button className="rounded-lg p-2 transition-colors hover:bg-slate-200/60 dark:hover:bg-white/10">
                <MoreVertical size={18} className="text-muted-foreground" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6">
            {isLoadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-[#7C3AED]" size={26} />
              </div>
            ) : !activeConversation ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <MessageSquare className="mx-auto mb-3 text-[#7C3AED]" size={34} />
                  <p className="text-sm font-semibold text-foreground">
                    Choose a chat to begin
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Real-time delivery turns on once you open a conversation.
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <MessageSquare className="mx-auto mb-3 text-[#7C3AED]" size={34} />
                  <p className="text-sm font-semibold text-foreground">
                    Start the conversation
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Send a message to {activeConversation.otherParticipant.name}.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = message.senderId === currentUserId;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 shadow-sm md:max-w-[65%] ${
                        isMine
                          ? "rounded-2xl rounded-br-none bg-[#7C3AED] text-white"
                          : "rounded-2xl rounded-bl-none bg-slate-100 text-foreground dark:bg-white/10"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.text}
                      </p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isMine
                            ? "text-right text-white/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                        {message.pending ? " - Sending" : ""}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="shrink-0 space-y-2.5 border-t border-border bg-white/80 px-4 py-3 backdrop-blur-xl dark:bg-white/5 md:px-6">
            {typingUserName && activeConversation && (
              <p className="px-1 text-xs font-medium text-[#7C3AED]">
                {typingUserName} is typing...
              </p>
            )}
            <div className="flex gap-2 overflow-x-auto">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED] dark:bg-white/5"
                >
                  <action.icon size={13} />
                  {action.label}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2">
              <button className="mb-0.5 shrink-0 rounded-lg p-2 transition-colors hover:bg-slate-200/60 dark:hover:bg-white/10">
                <Paperclip size={18} className="text-muted-foreground" />
              </button>

              <div className="flex flex-1 items-end gap-2 rounded-2xl border border-border bg-white px-4 py-2.5 transition-shadow focus-within:ring-2 focus-within:ring-[#7C3AED]/50 dark:bg-white/5">
                <textarea
                  value={messageInput}
                  onChange={(event) => handleMessageInputChange(event.target.value)}
                  onBlur={emitStopTyping}
                  placeholder={
                    activeConversation
                      ? "Type a message..."
                      : "Select a conversation first..."
                  }
                  rows={1}
                  disabled={!activeConversation}
                  className="max-h-24 flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <button className="shrink-0 p-1">
                  <Smile
                    size={18}
                    className="text-muted-foreground transition-colors hover:text-[#7C3AED]"
                  />
                </button>
              </div>

              <button
                onClick={() => void sendMessage()}
                disabled={!messageInput.trim() || !activeConversation || isSending}
                className="mb-0.5 flex shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] p-2.5 text-white shadow-lg shadow-purple-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

