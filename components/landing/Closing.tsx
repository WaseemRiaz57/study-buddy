import Link from "next/link";
import { Wordmark } from "./LandingNav";

const columns = [
  {
    title: "Study",
    links: [
      { label: "AI notes", href: "/login" },
      { label: "Study rooms", href: "/study-rooms" },
      { label: "Resource hub", href: "/resource-hub" },
      { label: "Find a mentor", href: "/dashboard/mentorship/find" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Become a mentor", href: "/apply" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export default function Closing() {
  return (
    <>
      <section className="border-t border-[var(--lamp-rule)] py-[clamp(7rem,18vw,14rem)]" aria-labelledby="closing-title">
        <div className="lamp-wrap text-center">
          <h2 id="closing-title" className="lamp-display mx-auto max-w-[14ch]">
            Your next session starts tonight.
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/register" className="lamp-btn lamp-btn-primary">
              Start studying free
            </Link>
            <Link href="/study-rooms" className="lamp-btn lamp-btn-ghost">
              Browse open rooms
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--lamp-rule)] py-16">
        <div className="lamp-wrap grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" aria-label="StudyBuddy home">
              <Wordmark />
            </Link>
            <p className="mt-4 max-w-[22rem] text-[var(--lamp-graphite)]">
              Notes, rooms and mentors for students who study better with company.
            </p>
          </div>
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title} className="md:col-span-2">
              <h3 className="text-sm text-[var(--lamp-graphite)]">{c.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="lamp-link">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="lamp-wrap mt-16 text-sm text-[var(--lamp-graphite)]">
          &copy; {new Date().getFullYear()} StudyBuddy
        </div>
      </footer>
    </>
  );
}
