type BrandLogoSize = "mark" | "lockup";

const iconSizeClasses: Record<BrandLogoSize, string> = {
  mark: "h-9 w-9",
  lockup: "h-10 w-10",
};

export function BrandLogo({
  className = "",
  size = "lockup",
}: {
  className?: string;
  size?: BrandLogoSize;
}) {
  const isLockup = size === "lockup";

  return (
    <span
      className={`inline-flex shrink-0 items-center ${
        isLockup ? "gap-2.5" : ""
      } ${className}`}
      aria-label={isLockup ? "StudyBuddy" : undefined}
    >
      <svg
        viewBox="0 0 48 48"
        className={`${iconSizeClasses[size]} shrink-0 text-purple-600 dark:text-purple-400`}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4.5 8.8c7.1-1.8 13.6.3 19.5 6.2v27.2C18.1 36.3 11.6 34.3 4.5 36V8.8Z"
          fill="currentColor"
        />
        <path
          d="M43.5 8.8C36.4 7 29.9 9.1 24 15v27.2c5.9-5.9 12.4-7.9 19.5-6.2V8.8Z"
          fill="currentColor"
        />
        <path
          d="M8.5 14.1c4.2-.4 8.1 1 11.5 4.1v16.5c-3.5-2.3-7.3-3.4-11.5-3V14.1Z"
          fill="white"
          fillOpacity=".96"
        />
        <path
          d="M39.5 14.1c-4.2-.4-8.1 1-11.5 4.1v16.5c3.5-2.3 7.3-3.4 11.5-3V14.1Z"
          fill="white"
          fillOpacity=".96"
        />
        <circle cx="16" cy="17" r="2.3" fill="currentColor" />
        <circle cx="32" cy="17" r="2.3" fill="currentColor" />
        <path
          d="M11.7 25.5c.4-3.1 2-4.8 4.3-4.8s3.9 1.7 4.3 4.8c-1.7-1.1-3.1-1.6-4.3-1.6s-2.6.5-4.3 1.6ZM27.7 25.5c.4-3.1 2-4.8 4.3-4.8s3.9 1.7 4.3 4.8c-1.7-1.1-3.1-1.6-4.3-1.6s-2.6.5-4.3 1.6Z"
          fill="currentColor"
        />
      </svg>

      {isLockup ? (
        <span className="whitespace-nowrap font-sans text-xl font-extrabold tracking-[-0.035em]">
          <span className="text-slate-900 dark:text-slate-50">Study</span>
          <span className="text-purple-600 dark:text-purple-400">Buddy</span>
        </span>
      ) : null}
    </span>
  );
}
