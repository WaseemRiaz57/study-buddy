import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/landing/PageIntro";

export const metadata: Metadata = {
  title: "Mentor application status",
  robots: { index: false },
};

const steps = [
  { title: "Application sent", body: "We have your profile, subjects and availability.", state: "done" },
  { title: "In review", body: "Our team checks your experience and subjects. This usually takes up to 48 hours.", state: "current" },
  { title: "Decision", body: "You'll get an email either way. Once approved, students can book you straight away.", state: "next" },
] as const;

export default function ApplicationStatusPage() {
  return (
    <>
      <PageIntro
        kicker="Mentor application"
        title="Your application is in review."
        lead="Thanks for applying to teach on StudyBuddy. You can keep studying as normal while we take a look."
      />

      <section className="lamp-section" aria-labelledby="progress-title">
        <div className="lamp-wrap grid gap-12 lg:grid-cols-12">
          <h2 id="progress-title" className="lamp-h2 lg:col-span-4">
            Where it&rsquo;s at.
          </h2>
          <div className="lg:col-span-7 lg:col-start-6">
            <ol>
              {steps.map((s, i) => (
                <li
                  key={s.title}
                  className="lamp-row grid grid-cols-[2rem_1fr] gap-4 py-7"
                  aria-current={s.state === "current" ? "step" : undefined}
                >
                  <span
                    className={`pt-1 text-sm tabular-nums ${
                      s.state === "next" ? "text-[var(--lamp-graphite)]" : "text-[var(--lamp-marker)]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className={`lamp-h3 ${s.state === "next" ? "text-[var(--lamp-graphite)]" : ""}`}>
                      {s.state === "current" ? <span className="lamp-hl is-on">{s.title}</span> : s.title}
                      {s.state === "done" && <span className="ml-3 align-middle text-sm text-[var(--lamp-graphite)]">Done</span>}
                    </p>
                    <p className="mt-2 max-w-[34rem] text-[var(--lamp-graphite)]">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/dashboard" className="lamp-btn lamp-btn-primary mt-10">
              Go to your dashboard
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
