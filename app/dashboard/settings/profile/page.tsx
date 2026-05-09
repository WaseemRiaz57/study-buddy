"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

const inputCls = `
  block w-full rounded-lg border border-slate-300 bg-slate-50
  text-slate-900 placeholder:text-slate-400
  focus:border-primary focus:ring-primary
  dark:border-white/10 dark:bg-white/5 dark:text-white
  dark:placeholder:text-slate-500
  sm:text-sm h-12 px-4
  transition-colors
`;

const DEFAULTS = {
  firstName: "User",
  lastName: "",
  headline: "Senior Product Designer & Mentor",
  about: "",
  image: "",
};

const ABOUT_MAX = 500;

type ProfileResponse = {
  user?: {
    firstName?: string;
    lastName?: string;
    image?: string;
  };
  profile?: {
    headline?: string;
    bio?: string;
  } | null;
  studentProfile?: {
    headline?: string;
    bio?: string;
  } | null;
};

export default function PublicProfilePage() {
  const { update } = useSession();
  const [profileDefaults, setProfileDefaults] = useState(DEFAULTS);
  const [firstName, setFirstName] = useState(DEFAULTS.firstName);
  const [lastName, setLastName] = useState(DEFAULTS.lastName);
  const [headline, setHeadline] = useState(DEFAULTS.headline);
  const [userImage, setUserImage] = useState(DEFAULTS.image);
  const [dirty, setDirty] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const aboutRef = useRef<HTMLTextAreaElement>(null);
  const aboutCountRef = useRef<HTMLSpanElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fullName = `${firstName} ${lastName}`.trim() || "User";
  const avatarInitials =
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";

  const markDirty = useCallback(() => {
    setDirty((current) => current || true);
  }, []);

  const applyProfile = useCallback((profileData: ProfileResponse) => {
    const user = profileData?.user ?? {};
    const profile = profileData?.studentProfile ?? profileData?.profile ?? {};
    const nextDefaults = {
      ...DEFAULTS,
      firstName: user.firstName || "User",
      lastName: user.lastName || "",
      headline: profile?.headline || DEFAULTS.headline,
      about: profile?.bio || "",
      image: user.image || "",
    };

    setFirstName(nextDefaults.firstName);
    setLastName(nextDefaults.lastName);
    setHeadline(nextDefaults.headline);
    setUserImage(nextDefaults.image);
    setProfileDefaults(nextDefaults);
    if (aboutRef.current) {
      aboutRef.current.value = nextDefaults.about;
    }
    if (aboutCountRef.current) {
      aboutCountRef.current.textContent = String(nextDefaults.about.length);
    }
    setDirty(false);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function fetchProfile() {
      try {
        setIsLoadingProfile(true);
        const response = await fetch("/api/profile", { cache: "no-store" });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load profile.");
        }

        if (isActive) {
          applyProfile(data);
        }
      } catch (error) {
        if (isActive) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load profile."
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingProfile(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isActive = false;
    };
  }, [applyProfile]);

  const handleDiscard = () => {
    setFirstName(profileDefaults.firstName);
    setLastName(profileDefaults.lastName);
    setHeadline(profileDefaults.headline);
    setUserImage(profileDefaults.image);
    if (aboutRef.current) {
      aboutRef.current.value = profileDefaults.about;
    }
    if (aboutCountRef.current) {
      aboutCountRef.current.textContent = String(profileDefaults.about.length);
    }
    setDirty(false);
  };

  async function handleSave() {
    try {
      setIsSaving(true);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          headline,
          bio: aboutRef.current?.value ?? "",
          image: userImage,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update profile.");
      }

      applyProfile(data?.profile ?? data);
      await update();
      toast.success("Profile Updated Successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to upload profile photo.");
      }

      const nextImage = String(data?.secure_url || "");
      if (!nextImage) {
        throw new Error("Upload succeeded, but no image URL was returned.");
      }

      setUserImage(nextImage);
      markDirty();
      await update({
        user: {
          name: fullName,
          image: nextImage,
        },
      });
      toast.success("Photo uploaded! Don't forget to save changes");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload profile photo."
      );
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  return (
    <main className="relative pb-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <section
          className="mx-auto max-w-4xl px-6 py-8 lg:px-12"
          aria-labelledby="public-profile-heading"
        >
          <header className="mb-10">
            <h1
              id="public-profile-heading"
              className="mb-2 text-3xl font-extrabold text-slate-900 dark:text-white"
            >
              Public Profile
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage your public presence and how others see you on StudyBuddy.
            </p>
          </header>

          <section
            className="mb-8 flex flex-col items-center gap-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:flex-row sm:items-start"
            aria-labelledby="profile-photo-heading"
          >
            <div className="group relative shrink-0">
              <div className="flex size-32 select-none items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-4xl font-bold text-white ring-4 ring-slate-50 dark:ring-white/5">
                {userImage ? (
                  <Image
                    src={userImage}
                    alt="User profile picture"
                    width={128}
                    height={128}
                    priority
                    unoptimized
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  avatarInitials
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Edit profile picture"
              >
                {isUploadingImage ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Pencil size={16} />
                )}
              </button>
            </div>

            <article className="flex-1 text-center sm:text-left">
              <h2
                id="profile-photo-heading"
                className="mb-1 text-lg font-bold text-slate-900 dark:text-white"
              >
                Profile Photo
              </h2>
              <p className="mb-6 max-w-md text-sm text-slate-600 dark:text-slate-300">
                Update your photo. Recommended size is 400x400px.
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Upload profile photo"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  {isUploadingImage ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Upload size={15} />
                  )}
                  {isUploadingImage ? "Uploading..." : "Upload New"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserImage("");
                    markDirty();
                  }}
                  disabled={isUploadingImage}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              </div>
            </article>
          </section>

          <section
            className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900"
            aria-labelledby="profile-details-heading"
          >
            <h2 id="profile-details-heading" className="sr-only">
              Profile details
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  First Name
                </label>
                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    markDirty();
                  }}
                  className={inputCls}
                  placeholder="First name"
                  aria-label="First name"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="last-name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Last Name
                </label>
                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    markDirty();
                  }}
                  className={inputCls}
                  placeholder="Last name"
                  aria-label="Last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="professional-headline"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Professional Headline
              </label>
              <input
                id="professional-headline"
                type="text"
                value={headline}
                onChange={(event) => {
                  setHeadline(event.target.value);
                  markDirty();
                }}
                className={inputCls}
                placeholder="e.g. Senior Product Designer & Mentor"
                aria-label="Professional headline"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label
                  htmlFor="about-me"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  About Me
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  <span ref={aboutCountRef}>0</span>/{ABOUT_MAX}
                </span>
              </div>
              <textarea
                id="about-me"
                ref={aboutRef}
                rows={5}
                defaultValue={profileDefaults.about}
                maxLength={ABOUT_MAX}
                onChange={(event) => {
                  if (aboutCountRef.current) {
                    aboutCountRef.current.textContent = String(
                      event.currentTarget.value.length
                    );
                  }
                  markDirty();
                }}
                className="block w-full resize-none rounded-lg border border-slate-300 bg-slate-50 p-4 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary focus:ring-primary dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
                placeholder="Tell others about yourself..."
                aria-label="About me"
              />
            </div>
          </section>
        </section>
      </motion.div>

      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 24 }}
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-3 md:sticky md:bottom-0 md:mt-8 md:px-0 md:pb-0 md:pt-0"
      >
        <div className="mx-auto max-w-4xl px-6 lg:px-12">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 shadow-lg shadow-slate-200/40 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/30">
            <p className="hidden text-sm text-slate-600 dark:text-slate-300 sm:block">
              {dirty ? "You have unsaved changes" : "No unsaved changes"}
            </p>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={handleDiscard}
                disabled={isSaving || isLoadingProfile || isUploadingImage}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]"
              >
                <RotateCcw size={15} />
                Discard Changes
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || isLoadingProfile || isUploadingImage}
                className="relative flex items-center gap-2 overflow-hidden rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer-slide_3s_ease-in-out_infinite]" />
                {isSaving ? (
                  <Loader2 size={15} className="relative z-10 animate-spin" />
                ) : (
                  <Save size={15} className="relative z-10" />
                )}
                <span className="relative z-10">
                  {isSaving ? "Saving..." : "Save Changes"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
