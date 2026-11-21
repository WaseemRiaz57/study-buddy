import LandingNav from "@/components/landing/LandingNav";
import LampFooter from "@/components/landing/LampFooter";
import { lampFontVars } from "@/lib/lampFonts";

// Shared shell for every public page: Lamplight nav, content, footer.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`lamp ${lampFontVars} flex min-h-screen flex-col`}>
      <a
        href="#main"
        className="lamp-btn lamp-btn-primary fixed left-4 top-4 z-[60] -translate-y-24 focus:translate-y-0"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <LampFooter />
    </div>
  );
}
