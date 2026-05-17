import Image from "next/image";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="StudyBuddy"
      width={32}
      height={32}
      priority
      className={`h-8 w-8 shrink-0 object-contain ${className}`}
      sizes="32px"
    />
  );
}
