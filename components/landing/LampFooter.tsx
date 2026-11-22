import Link from "next/link";
import { Wordmark } from "./LandingNav";

const columns = [
  {
    title: "Study",
    links: [
      { label: "AI notes", href: "/dashboard/ai-generator" },
      { label: "Study rooms", href: "/dashboard/study-rooms" },
      { label: "Resource hub", href: "/dashboard/resources" },
      { label: "Find a mentor", href: "/dashboard/mentorship/find" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create account", href: "/register" },
      { label: "Reset password", href: "/forgot-password" },
    ],
  },
];

export default function LampFooter() {
  return (
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
            <h2 className="text-sm text-[var(--lamp-graphite)]">{c.title}</h2>
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
  );
}
