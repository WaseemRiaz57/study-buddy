import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-20 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <header className="mb-10">
          <Link
            href="/"
            prefetch={true}
            className="mb-8 inline-flex items-center gap-2"
            aria-label="Go to StudyBuddy home"
          >
            <BrandLogo size="mark" className="h-12 w-12" />
            <span className="text-2xl font-bold text-[#7C3AED]">StudyBuddy</span>
          </Link>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#7C3AED]">
            Careers
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Build the future of learning with us.
          </h1>
        </header>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-lg leading-8 text-muted-foreground">
            Join our mission to revolutionize education. Open positions will be listed
            here soon.
          </p>
        </article>
      </section>
    </main>
  );
}
