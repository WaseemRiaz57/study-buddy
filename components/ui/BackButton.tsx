"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({
  href,
  label = "Go back",
  className = "",
  onClick,
}: {
  href?: string;
  label?: string;
  className?: string;
  onClick?: () => void;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }

        if (href) {
          router.push(href);
          return;
        }

        router.back();
      }}
      aria-label={label}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
    >
      <ArrowLeft size={20} aria-hidden="true" />
    </button>
  );
}

export default BackButton;
