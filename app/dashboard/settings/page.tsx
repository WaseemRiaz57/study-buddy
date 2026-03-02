"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Pencil,
  Upload,
  Trash2,
  ChevronDown,
  Save,
  RotateCcw,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared input class                                                  */
/* ------------------------------------------------------------------ */
const inputCls = `
  w-full px-4 py-3 rounded-xl border text-sm
  border-slate-200 bg-white text-slate-900 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
  dark:border-white/10 dark:bg-white/[0.04] dark:text-white
  dark:placeholder:text-slate-500 dark:focus:border-purple-400 dark:focus:ring-purple-400/20
  transition-colors
`;

/* ------------------------------------------------------------------ */
/* Timezone options                                                    */
/* ------------------------------------------------------------------ */
const timezones = [
  { value: "Asia/Karachi", label: "(GMT+5:00) Pakistan Standard Time" },
  { value: "America/New_York", label: "(GMT-5:00) Eastern Time" },
  { value: "America/Chicago", label: "(GMT-6:00) Central Time" },
  { value: "America/Denver", label: "(GMT-7:00) Mountain Time" },
  { value: "America/Los_Angeles", label: "(GMT-8:00) Pacific Time" },
  { value: "Europe/London", label: "(GMT+0:00) London" },
  { value: "Europe/Berlin", label: "(GMT+1:00) Central European Time" },
  { value: "Asia/Dubai", label: "(GMT+4:00) Gulf Standard Time" },
  { value: "Asia/Kolkata", label: "(GMT+5:30) India Standard Time" },
  { value: "Asia/Shanghai", label: "(GMT+8:00) China Standard Time" },
  { value: "Asia/Tokyo", label: "(GMT+9:00) Japan Standard Time" },
  { value: "Australia/Sydney", label: "(GMT+11:00) Australian Eastern Time" },
];

/* ------------------------------------------------------------------ */
/* Public Profile Page                                                 */
/* ------------------------------------------------------------------ */
export default function PublicProfilePage() {
  const { data: session, status } = useSession();
  const [sessionDefaults, setSessionDefaults] = useState({
    firstName: "User",
    lastName: "",
    headline: "Full-Stack Developer & Mentor",
    timezone: "Asia/Karachi",
    about:
      "Passionate educator helping students master complex subjects through personalized mentorship. I specialize in web development, system design, and interview preparation.",
  });
  const [isHydratedFromSession, setIsHydratedFromSession] = useState(false);
  const [firstName, setFirstName] = useState(sessionDefaults.firstName);
  const [lastName, setLastName] = useState(sessionDefaults.lastName);
  const [headline, setHeadline] = useState("Full-Stack Developer & Mentor");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [about, setAbout] = useState(
    "Passionate educator helping students master complex subjects through personalized mentorship. I specialize in web development, system design, and interview preparation.",
  );
  const [dirty, setDirty] = useState(false);

  const fullName = session?.user?.name || `${firstName} ${lastName}`.trim() || "User";
  const userImage = session?.user?.image || "";
  const avatarInitials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";

  useEffect(() => {
    if (isHydratedFromSession || status === "loading") return;

    const sessionName = session?.user?.name?.trim() || "User";
    const [sessionFirstName, ...rest] = sessionName.split(" ");
    const sessionLastName = rest.join(" ");

    const nextDefaults = {
      ...sessionDefaults,
      firstName: sessionFirstName || "User",
      lastName: sessionLastName || "",
    };

    setSessionDefaults(nextDefaults);
    setFirstName(nextDefaults.firstName);
    setLastName(nextDefaults.lastName);
    setHeadline(nextDefaults.headline);
    setTimezone(nextDefaults.timezone);
    setAbout(nextDefaults.about);
    setDirty(false);
    setIsHydratedFromSession(true);
  }, [session, status, isHydratedFromSession]);

  const markDirty = () => {
    if (!dirty) setDirty(true);
  };

  return (
    <div className="relative pb-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-8"
      >
        {/* ── Header ── */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Public Profile
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            This is how others will see you across the platform.
          </p>
        </div>

        {/* ── Avatar Upload Section ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar with edit overlay */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2.5px] shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10">
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {userImage ? (
                    <img src={userImage} alt={fullName} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    avatarInitials
                  )}
                </div>
              </div>
              {/* Edit icon button overlapping avatar */}
              <button
                className="
                  absolute -bottom-1 -right-1 w-9 h-9 rounded-full
                  flex items-center justify-center
                  bg-purple-600 text-white shadow-lg shadow-purple-500/30
                  hover:bg-purple-700 dark:hover:bg-purple-500
                  border-[3px] border-white dark:border-slate-900
                  transition-colors
                "
                aria-label="Edit avatar"
              >
                <Pencil size={14} />
              </button>
            </div>

            {/* Upload / Remove buttons + hint */}
            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="flex items-center gap-3">
                <button
                  className="
                    flex items-center gap-2 px-5 py-2.5 rounded-xl
                    bg-purple-600 text-white text-sm font-semibold
                    hover:bg-purple-700 dark:hover:bg-purple-500
                    shadow-md shadow-purple-500/20
                    transition-colors
                  "
                >
                  <Upload size={15} />
                  Upload New
                </button>
                <button
                  className="
                    flex items-center gap-2 px-5 py-2.5 rounded-xl
                    border border-slate-200 text-sm font-medium
                    text-slate-600 hover:bg-slate-50
                    dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.04]
                    transition-colors
                  "
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                JPG, PNG or WebP — max 2 MB, at least 200×200 px
              </p>
            </div>
          </div>
        </div>

        {/* ── Form Grid ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03] space-y-6">
          {/* First / Last Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  markDirty();
                }}
                className={inputCls}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  markDirty();
                }}
                className={inputCls}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Professional Headline */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Professional Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => {
                setHeadline(e.target.value);
                markDirty();
              }}
              className={inputCls}
              placeholder="e.g. Full-Stack Developer & Mentor"
            />
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              A short tagline displayed under your name.
            </p>
          </div>

          {/* Timezone dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Timezone
            </label>
            <div className="relative">
              <select
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  markDirty();
                }}
                className={`${inputCls} appearance-none pr-10 cursor-pointer`}
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
            </div>
          </div>

          {/* About Me textarea */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              About Me
            </label>
            <textarea
              rows={5}
              value={about}
              onChange={(e) => {
                setAbout(e.target.value);
                markDirty();
              }}
              className={`${inputCls} resize-none`}
              placeholder="Tell others about yourself..."
            />
            <div className="flex justify-between mt-1.5">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Markdown is supported.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {about.length} / 500
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Floating Action Bar ── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 24 }}
        className="
          fixed bottom-0 left-0 right-0 lg:sticky lg:bottom-0
          z-30 px-4 pb-4 pt-3
          lg:px-0 lg:pb-0 lg:pt-0 lg:mt-8
        "
      >
        <div
          className="
            flex items-center justify-between gap-4
            px-6 py-4 rounded-2xl
            bg-white/80 border border-slate-200
            backdrop-blur-xl shadow-lg shadow-slate-200/40
            dark:bg-slate-900/80 dark:border-white/10
            dark:shadow-black/30
          "
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
            {dirty ? "You have unsaved changes" : "No unsaved changes"}
          </p>

          <div className="flex items-center gap-3 ml-auto">
            {/* Discard */}
            <button
              onClick={() => {
                setFirstName(sessionDefaults.firstName);
                setLastName(sessionDefaults.lastName);
                setHeadline(sessionDefaults.headline);
                setTimezone(sessionDefaults.timezone);
                setAbout(sessionDefaults.about);
                setDirty(false);
              }}
              className="
                flex items-center gap-2 px-5 py-2.5 rounded-xl
                border border-slate-200 text-sm font-medium
                text-slate-600 hover:bg-slate-50
                dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.06]
                transition-colors
              "
            >
              <RotateCcw size={15} />
              Discard Changes
            </button>

            {/* Save — glowing CTA */}
            <button
              className="
                relative flex items-center gap-2 px-6 py-2.5 rounded-xl
                bg-purple-600 text-white text-sm font-semibold
                hover:bg-purple-700 dark:hover:bg-purple-500
                shadow-lg shadow-purple-500/25
                transition-colors overflow-hidden
              "
            >
              {/* Glow sweep */}
              <span
                className="
                  pointer-events-none absolute inset-0
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  -translate-x-full animate-[shimmer-slide_3s_ease-in-out_infinite]
                "
              />
              <Save size={15} className="relative z-10" />
              <span className="relative z-10">Save Changes</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
