import NotFoundContent from "@/components/landing/NotFoundContent";
import { lampFontVars } from "@/lib/lampFonts";

// Fallback for notFound() outside the public route group. Unknown URLs are
// caught by app/(marketing)/[...missing] so they get the full public shell.
export default function NotFound() {
  return (
    <div className={`lamp ${lampFontVars} min-h-[100dvh]`}>
      <NotFoundContent />
    </div>
  );
}
