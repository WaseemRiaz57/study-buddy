import Image from "next/image";

export function BrandLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`relative flex shrink-0 items-center ${
        compact ? "h-10 w-10" : "h-11 w-40"
      } ${className}`}
    >
      <Image
        src="/logo.png"
        alt="StudyBuddy Logo"
        width={compact ? 40 : 160}
        height={compact ? 40 : 44}
        priority
        className="h-full w-full object-contain"
        sizes={compact ? "40px" : "160px"}
      />
    </span>
  );
}
