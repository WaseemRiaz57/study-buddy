import Link from "next/link";
import { Wordmark } from "./LandingNav";

/**
 * Split auth layout: a quiet Lamplight panel on the left (desktop only) and the
 * form column on the right. Replaces the old full-bleed illustration panel.
 */
export default function AuthFrame({
  aside,
  backHref = "/",
  backLabel = "Back to home",
  children,
}: {
  aside: { quote: string; note: string };
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-[var(--lamp-rule)] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[15vw] -top-[15vw] h-[60vw] w-[60vw] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgb(255 226 160 / 0.12), rgb(255 226 160 / 0.03) 55%, transparent)",
          }}
        />
        <Link href="/" aria-label="StudyBuddy home" className="relative w-fit">
          <Wordmark />
        </Link>
        <div className="relative">
          <p className="lamp-serif max-w-[16ch] text-[clamp(2.5rem,4.4vw,4.25rem)] leading-[1.02] tracking-[-0.02em]">
            {aside.quote}
          </p>
          <p className="mt-6 max-w-[28rem] text-[var(--lamp-graphite)]">{aside.note}</p>
        </div>
        <p className="relative text-sm text-[var(--lamp-graphite)]">Notes, rooms and mentors in one place.</p>
      </aside>

      <div className="flex min-h-[100dvh] flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href={backHref} className="lamp-link text-sm text-[var(--lamp-graphite)] hover:text-[var(--lamp-paper)]">
            {backLabel}
          </Link>
          <Link href="/" aria-label="StudyBuddy home" className="lg:hidden">
            <Wordmark />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 text-sm text-[var(--lamp-graphite)]">
      <span className="h-px flex-1 bg-[var(--lamp-rule)]" />
      {label}
      <span className="h-px flex-1 bg-[var(--lamp-rule)]" />
    </div>
  );
}
