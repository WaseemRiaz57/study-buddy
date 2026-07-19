import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-20 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <header className="mb-10">
          <Link
            href="/"
            prefetch={true}
            className="mb-8 inline-flex items-center"
            aria-label="Go to StudyBuddy home"
          >
            <BrandLogo size="mark" className="h-14 w-14" />
          </Link>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#7C3AED]">
            About Us
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            A complete learning ecosystem for ambitious scholars.
          </h1>
        </header>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-lg leading-8 text-muted-foreground">
            StudyBuddy is a comprehensive learning ecosystem designed to connect students
            with peers and mentors, gamify the learning experience, and provide AI-powered
            study tools to accelerate academic success.
          </p>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            The platform brings focus rooms, mentor guidance, community discussions,
            resource sharing, and progress rewards into one polished workspace so learners
            can build momentum and stay accountable.
          </p>
        </article>
      </section>
    </main>
  );
}
