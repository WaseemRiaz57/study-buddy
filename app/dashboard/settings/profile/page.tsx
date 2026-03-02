"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Upload, Trash2, Save, RotateCcw } from "lucide-react";
import { useSession } from "next-auth/react";

/* ------------------------------------------------------------------ */
/* Shared input class                                                  */
/* ------------------------------------------------------------------ */
const inputCls = `
  block w-full rounded-lg border border-slate-300 bg-slate-50
  text-slate-900 placeholder:text-slate-400
  focus:border-primary focus:ring-primary
  dark:border-white/10 dark:bg-white/5 dark:text-white
  dark:placeholder:text-slate-500
  sm:text-sm h-12 px-4
  transition-colors
`;

/* ------------------------------------------------------------------ */
/* Defaults (used for discard / reset)                                 */
/* ------------------------------------------------------------------ */
const DEFAULTS = {
  firstName: "User",
  lastName: "",
  headline: "Senior Product Designer & Mentor",
  about: "",
};

const ABOUT_MAX = 500;

/* ------------------------------------------------------------------ */
/* Public Profile Page                                                 */
/* ------------------------------------------------------------------ */
export default function PublicProfilePage() {
  const { data: session, status } = useSession();
  const [sessionDefaults, setSessionDefaults] = useState(DEFAULTS);
  const [isHydratedFromSession, setIsHydratedFromSession] = useState(false);
  const [firstName, setFirstName] = useState(DEFAULTS.firstName);
  const [lastName, setLastName] = useState(DEFAULTS.lastName);
  const [headline, setHeadline] = useState(DEFAULTS.headline);
  const [about, setAbout] = useState(DEFAULTS.about);
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
      ...DEFAULTS,
      firstName: sessionFirstName || "User",
      lastName: sessionLastName || "",
    };

    setSessionDefaults(nextDefaults);
    setFirstName(nextDefaults.firstName);
    setLastName(nextDefaults.lastName);
    setHeadline(nextDefaults.headline);
    setAbout(nextDefaults.about);
    setDirty(false);
    setIsHydratedFromSession(true);
  }, [session, status, isHydratedFromSession]);

  const markDirty = () => {
    if (!dirty) setDirty(true);
  };

  const handleDiscard = () => {
    setFirstName(sessionDefaults.firstName);
    setLastName(sessionDefaults.lastName);
    setHeadline(sessionDefaults.headline);
    setAbout(sessionDefaults.about);
    setDirty(false);
  };

  return (
    <div className="relative pb-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* ── Page Header ── */}
        <div className="max-w-4xl mx-auto py-8 px-6 lg:px-12">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Public Profile
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage your public presence and how others see you on StudyBuddy.
            </p>
          </div>

          {/* ── Avatar / Photo Section ── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-white/10 shadow-sm mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="size-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ring-4 ring-slate-50 dark:ring-white/5 flex items-center justify-center text-4xl font-bold text-white select-none">
                {userImage ? (
                  <img src={userImage} alt={fullName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  avatarInitials
                )}
              </div>
              <button
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-transform hover:scale-105"
                aria-label="Edit avatar"
              >
                <Pencil size={16} />
              </button>
            </div>

            {/* Photo info & actions */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Profile Photo
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                Update your photo. Recommended size is 400×400px.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                <button className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-sm font-semibold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-2">
                  <Upload size={15} />
                  Upload New
                </button>
                <button className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors inline-flex items-center gap-2">
                  <Trash2 size={15} />
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* ── Form Fields ── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
            {/* First / Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                placeholder="e.g. Senior Product Designer & Mentor"
              />
            </div>

            {/* About Me */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  About Me
                </label>
                <span className="text-xs text-slate-400">
                  {about.length}/{ABOUT_MAX}
                </span>
              </div>
              <textarea
                rows={5}
                value={about}
                maxLength={ABOUT_MAX}
                onChange={(e) => {
                  setAbout(e.target.value);
                  markDirty();
                }}
                className={`block w-full rounded-lg border border-slate-300 bg-slate-50
                  text-slate-900 placeholder:text-slate-400
                  focus:border-primary focus:ring-primary
                  dark:border-white/10 dark:bg-white/5 dark:text-white
                  dark:placeholder:text-slate-500
                  sm:text-sm p-4 resize-none transition-colors`}
                placeholder="Tell others about yourself..."
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Sticky Bottom Action Bar ── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 24 }}
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-3 md:sticky md:bottom-0 md:px-0 md:pb-0 md:pt-0 md:mt-8"
      >
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-white/80 border border-slate-200 backdrop-blur-xl shadow-lg shadow-slate-200/40 dark:bg-slate-900/80 dark:border-white/10 dark:shadow-black/30">
            <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              {dirty ? "You have unsaved changes" : "No unsaved changes"}
            </p>

            <div className="flex items-center gap-3 ml-auto">
              {/* Discard */}
              <button
                onClick={handleDiscard}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.06] transition-colors"
              >
                <RotateCcw size={15} />
                Discard Changes
              </button>

              {/* Save */}
              <button className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-lg shadow-primary/25 transition-colors overflow-hidden">
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer-slide_3s_ease-in-out_infinite]" />
                <Save size={15} className="relative z-10" />
                <span className="relative z-10">Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
