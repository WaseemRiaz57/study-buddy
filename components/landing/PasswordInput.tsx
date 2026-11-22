"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { toggleLabel?: string };

/** Password field with a show/hide toggle (kept from the previous design). */
export default function PasswordInput({ toggleLabel = "password", className = "", ...rest }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...rest} type={show ? "text" : "password"} className={`lamp-input pr-12 ${className}`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? `Hide ${toggleLabel}` : `Show ${toggleLabel}`}
        aria-pressed={show}
        className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md text-[var(--lamp-graphite)] transition-colors hover:text-[var(--lamp-paper)]"
      >
        {show ? <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
      </button>
    </div>
  );
}
