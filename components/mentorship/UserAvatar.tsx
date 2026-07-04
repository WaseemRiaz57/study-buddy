/**
 * UserAvatar — Global reusable avatar component for the StudyBuddy Mentorship module.
 *
 * Renders the user's actual profile picture via Next.js <Image> for optimized
 * loading and AEO/SEO performance. Falls back to an initials-based circle if
 * the image URL is absent or fails to load.
 *
 * Usage:
 *   <UserAvatar name="John Doe" imageUrl={user.image} size="md" />
 */

"use client";

import { useState } from "react";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface UserAvatarProps {
  /** The user's display name — used for initials fallback and semantic alt text. */
  name: string;
  /** The user's profile picture URL. If null/undefined the initials fallback is shown. */
  imageUrl?: string | null;
  /** Visual size of the avatar. Defaults to "md". */
  size?: UserAvatarSize;
  /** Additional Tailwind classes to apply to the outer wrapper. */
  className?: string;
  /** Whether this is a Mentor (true) or Student (false) — used for initials badge color. */
  isMentor?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??"
  );
}

const SIZE_CLASSES: Record<UserAvatarSize, { wrapper: string; text: string; px: number }> = {
  xs: { wrapper: "h-6 w-6",  text: "text-[9px]",  px: 24  },
  sm: { wrapper: "h-8 w-8",  text: "text-[10px]", px: 32  },
  md: { wrapper: "h-10 w-10", text: "text-xs",     px: 40  },
  lg: { wrapper: "h-12 w-12", text: "text-sm",     px: 48  },
  xl: { wrapper: "h-16 w-16", text: "text-base",   px: 64  },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * UserAvatar
 *
 * Globally reusable avatar component for Mentor/Student cards throughout
 * the StudyBuddy mentorship module. Uses Next.js <Image> for performance and
 * displays a graceful initials fallback when the profile picture is unavailable.
 */
export function UserAvatar({
  name,
  imageUrl,
  size = "md",
  className = "",
  isMentor = false,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { wrapper, text, px } = SIZE_CLASSES[size];
  const initials = getInitials(name);
  const showImage = Boolean(imageUrl) && !imgError;

  // Mentor badge uses blue tones; Student badge uses purple — both theme-aware.
  const fallbackBg = isMentor
    ? "bg-blue-600 dark:bg-blue-500"
    : "bg-[#7C3AED] dark:bg-[#7C3AED]";

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-full",
        wrapper,
        !showImage ? fallbackBg : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Profile picture of ${name}`}
      role="img"
    >
      {showImage ? (
        <Image
          src={imageUrl as string}
          alt={`Profile picture of ${name}`}
          width={px}
          height={px}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
          unoptimized={imageUrl?.startsWith("data:") ?? false}
        />
      ) : (
        <span
          className={[
            "flex h-full w-full select-none items-center justify-center font-bold text-white",
            text,
          ].join(" ")}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
    </div>
  );
}

export default UserAvatar;
