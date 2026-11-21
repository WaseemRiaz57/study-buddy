import { lampFontVars } from "@/lib/lampFonts";

// Auth and account-state pages: Lamplight styling without the marketing chrome.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={`lamp ${lampFontVars} min-h-[100dvh]`}>{children}</div>;
}
