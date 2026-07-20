import Image from "next/image";

type BrandLogoSize = "mark" | "lockup";

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
        isLockup ? "gap-2" : ""
      } ${className}`}
      aria-label={isLockup ? "StudyBuddy" : undefined}
    >
      <Image
        src="/logo.png"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 object-contain"
        aria-hidden="true"
      />

      {isLockup ? (
        <span className="whitespace-nowrap font-sans text-xl font-extrabold tracking-[-0.035em]">
          <span className="text-slate-900 dark:text-slate-50">Study</span>
          <span className="text-purple-600 dark:text-purple-400">Buddy</span>
        </span>
      ) : null}
    </span>
  );
}
