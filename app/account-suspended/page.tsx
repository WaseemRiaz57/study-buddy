import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccountSuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-foreground">
          Account Suspended
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your account is currently restricted by the moderation team. Check
          your email or notifications for the reason and appeal instructions.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
        >
          Return to Login
        </Link>
      </section>
    </main>
  );
}
