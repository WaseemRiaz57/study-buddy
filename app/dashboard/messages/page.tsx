"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  PenSquare,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Mic,
  Send,
  Paperclip,
  FileText,
  CalendarPlus,
  Share2,
  ChevronLeft,
} from "lucide-react";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface Contact {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  online: boolean;
  unread: number;
  role: string;
}

interface ChatMessage {
  id: string;
  sender: "me" | "them";
  text?: string;
  time: string;
  attachment?: { name: string; size: string };
}

/* ────────────────────────────────────────────────
   Mock Data
   ──────────────────────────────────────────────── */

const CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Aria Chen",
    initials: "AC",
    lastMessage: "Thank you so much for the session!",
    time: "2m ago",
    online: true,
    unread: 2,
    role: "Scholar",
  },
  {
    id: "c2",
    name: "Marcus Lee",
    initials: "ML",
    lastMessage: "I'll review the notes tonight",
    time: "15m ago",
    online: true,
    unread: 0,
    role: "Rising Star",
  },
  {
    id: "c3",
    name: "Priya Patel",
    initials: "PP",
    lastMessage: "Can we reschedule to Thursday?",
    time: "1h ago",
    online: false,
    unread: 1,
    role: "Focus Champion",
  },
  {
    id: "c4",
    name: "Jake Rivera",
    initials: "JR",
    lastMessage: "Got it, thanks!",
    time: "3h ago",
    online: false,
    unread: 0,
    role: "Curious Mind",
  },
  {
    id: "c5",
    name: "Sophie Kim",
    initials: "SK",
    lastMessage: "The quiz was really helpful",
    time: "5h ago",
    online: true,
    unread: 0,
    role: "Knowledge Seeker",
  },
  {
    id: "c6",
    name: "David Nguyen",
    initials: "DN",
    lastMessage: "I finished the assignment early!",
    time: "1d ago",
    online: false,
    unread: 0,
    role: "Grind Master",
  },
];

const CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  c1: [
    { id: "m1", sender: "them", text: "Hi! I had a question about today's session topic.", time: "10:02 AM" },
    { id: "m2", sender: "me", text: "Of course, Aria! What's on your mind?", time: "10:03 AM" },
    { id: "m3", sender: "them", text: "I'm still confused about how to decompose a matrix into eigenvalues. Could you send me that derivation you mentioned?", time: "10:05 AM" },
    { id: "m4", sender: "me", text: "Absolutely. Here it is — I annotated the key steps for you.", time: "10:07 AM" },
    { id: "m5", sender: "me", text: "", time: "10:07 AM", attachment: { name: "Matrix_Derivation.pdf", size: "2.4 MB" } },
    { id: "m6", sender: "them", text: "This is perfect! The annotations really help. I'll work through it tonight.", time: "10:10 AM" },
    { id: "m7", sender: "me", text: "Great! Let me know if you get stuck on step 3, that's usually the tricky part.", time: "10:11 AM" },
    { id: "m8", sender: "them", text: "Thank you so much for the session!", time: "10:15 AM" },
  ],
  c2: [
    { id: "m1", sender: "me", text: "How did the practice problems go?", time: "9:00 AM" },
    { id: "m2", sender: "them", text: "Pretty good! Got stuck on problem 5 though.", time: "9:15 AM" },
    { id: "m3", sender: "me", text: "That one's tricky. We'll cover it in our next session.", time: "9:20 AM" },
    { id: "m4", sender: "them", text: "I'll review the notes tonight", time: "9:25 AM" },
  ],
  c3: [
    { id: "m1", sender: "them", text: "Hey! Something came up, can we reschedule?", time: "Yesterday" },
    { id: "m2", sender: "me", text: "Sure, what works for you?", time: "Yesterday" },
    { id: "m3", sender: "them", text: "Can we reschedule to Thursday?", time: "Yesterday" },
  ],
};

const QUICK_ACTIONS = [
  { label: "Schedule next session", icon: CalendarPlus },
  { label: "Share resource", icon: Share2 },
];

/* ────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────── */

export default function MessagesPage() {
  const [activeContact, setActiveContact] = useState<string>("c1");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const contact = CONTACTS.find((c) => c.id === activeContact)!;
  const messages = CHAT_MESSAGES[activeContact] ?? [];

  const filteredContacts = CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  /* auto-scroll to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeContact]);

  const selectContact = (id: string) => {
    setActiveContact(id);
    setShowSidebar(false);
  };

  return (
    <main className="relative h-screen bg-background dark:bg-[#191121] text-foreground overflow-hidden">
      {/* ── Decorative glowing orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-teal-500/5 blur-[80px]" />
      </div>

      <div className="relative z-10 flex h-full">
        {/* ════════════════════════════════════════════
            Contacts Sidebar
           ════════════════════════════════════════════ */}
        <aside
          className={`
            ${showSidebar ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
            fixed md:static inset-y-0 left-0 z-30
            w-80 shrink-0 flex flex-col
            border-r border-border
            bg-white/70 dark:bg-white/5 backdrop-blur-xl
            transition-transform duration-300 ease-in-out
          `}
        >
          {/* Sidebar Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Messages</h2>
              <button className="p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors">
                <PenSquare size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-white dark:bg-white/5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredContacts.map((c) => (
              <button
                key={c.id}
                onClick={() => selectContact(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  activeContact === c.id
                    ? "bg-primary/10 dark:bg-primary/15"
                    : "hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/80 to-purple-600/80 flex items-center justify-center text-white text-xs font-bold">
                    {c.initials}
                  </div>
                  {c.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#191121]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {c.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                      {c.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.lastMessage}
                  </p>
                </div>

                {/* Unread badge */}
                {c.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Sidebar overlay on mobile */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* ════════════════════════════════════════════
            Main Chat Area
           ════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-white/60 dark:bg-white/5 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile back button */}
              <button
                className="md:hidden p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                onClick={() => setShowSidebar(true)}
              >
                <ChevronLeft size={20} className="text-foreground" />
              </button>

              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-purple-600/80 flex items-center justify-center text-white text-sm font-bold">
                  {contact.initials}
                </div>
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#191121]" />
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {contact.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {contact.online ? (
                    <>
                      <span className="text-emerald-500">Online</span>
                      {" • "}
                      {contact.role} Rank
                    </>
                  ) : (
                    `Last seen ${contact.time}`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors hidden sm:flex">
                <Phone size={18} className="text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors">
                <Video size={18} className="text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors">
                <MoreVertical size={18} className="text-muted-foreground" />
              </button>
            </div>
          </header>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] md:max-w-[65%] ${
                    msg.sender === "me"
                      ? "bg-gradient-to-br from-primary to-purple-600 text-white rounded-2xl rounded-br-none"
                      : "bg-slate-100 dark:bg-white/10 text-foreground rounded-2xl rounded-bl-none"
                  } px-4 py-2.5 shadow-sm`}
                >
                  {/* Text */}
                  {msg.text && (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}

                  {/* Attachment */}
                  {msg.attachment && (
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl mt-1 ${
                        msg.sender === "me"
                          ? "bg-white/15"
                          : "bg-white dark:bg-white/5 border border-border"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          msg.sender === "me"
                            ? "bg-white/20 text-white"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            msg.sender === "me"
                              ? "text-white"
                              : "text-foreground"
                          }`}
                        >
                          {msg.attachment.name}
                        </p>
                        <p
                          className={`text-xs ${
                            msg.sender === "me"
                              ? "text-white/60"
                              : "text-muted-foreground"
                          }`}
                        >
                          {msg.attachment.size}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.sender === "me"
                        ? "text-white/50 text-right"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* ── Input Area ── */}
          <div className="shrink-0 border-t border-border bg-white/60 dark:bg-white/5 backdrop-blur-xl px-4 md:px-6 py-3 space-y-2.5">
            {/* Quick action chips */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-white dark:bg-white/5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <action.icon size={13} />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input container */}
            <div className="flex items-end gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors shrink-0 mb-0.5">
                <Paperclip size={18} className="text-muted-foreground" />
              </button>

              <div className="flex-1 flex items-end gap-2 px-4 py-2.5 rounded-2xl border border-border bg-white dark:bg-white/5 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none max-h-24"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      // send logic
                    }
                  }}
                />
                <button className="p-1 shrink-0">
                  <Smile size={18} className="text-muted-foreground hover:text-primary transition-colors" />
                </button>
                <button className="p-1 shrink-0">
                  <Mic size={18} className="text-muted-foreground hover:text-primary transition-colors" />
                </button>
              </div>

              {/* Send button */}
              <button className="p-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow shrink-0 mb-0.5">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
