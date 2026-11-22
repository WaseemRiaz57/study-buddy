import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/landing/PageIntro";

export const metadata: Metadata = {
  title: "About",
  description:
    "StudyBuddy brings AI notes, live study rooms, mentors and a student community into one place so studying feels less lonely.",
};

const beliefs = [
  {
    title: "Company beats willpower",
    body: "Most students don't fail for lack of discipline. They fail studying alone at midnight. Rooms, buddies and mentors exist so there's always someone at the next desk.",
  },
  {
    title: "AI should do the busywork",
    body: "Turning a 40-page PDF into notes is not learning. Answering questions about it is. StudyBuddy writes the notes and quizzes so your time goes into the second part.",
  },
  {
    title: "Reward showing up",
    body: "XP, streaks and challenges count sessions and quizzes, not hours of cramming. Small daily progress beats one heroic all-nighter.",
  },
  {
    title: "Safe by default",
    body: "Rooms, chats and forum posts can be reported, and a moderation team reviews every report. Suspended members can appeal the decision.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        kicker="About StudyBuddy"
        title="We're building the study desk next to yours."
        lead="StudyBuddy is one place for the whole study routine: AI notes and quizzes, live study rooms, a buddy who keeps you honest, mentors for the hard parts, and a community that has sat the same exams."
      />

      <section className="lamp-section" aria-labelledby="beliefs-title">
        <div className="lamp-wrap">
          <h2 id="beliefs-title" className="lamp-h2 max-w-[18ch]">
            What we believe about studying.
          </h2>
          <ul className="mt-16 lg:mt-20">
            {beliefs.map((b) => (
              <li key={b.title} className="lamp-row grid gap-3 py-8 md:grid-cols-12 md:gap-8">
                <h3 className="lamp-h3 md:col-span-5">
                  <span className="lamp-hl">{b.title}</span>
                </h3>
                <p className="max-w-[38rem] text-[var(--lamp-paper)]/85 md:col-span-7">{b.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lamp-section border-t border-[var(--lamp-rule)]" aria-labelledby="who-title">
        <div className="lamp-wrap grid gap-12 lg:grid-cols-12">
          <h2 id="who-title" className="lamp-h2 lg:col-span-5">
            Who it&rsquo;s for.
          </h2>
          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-7">
            <div>
              <h3 className="lamp-h3">Students</h3>
              <p className="mt-3 text-[var(--lamp-graphite)]">
                From first-years to final exams. Use the free plan for a normal week and upgrade when
                deadlines stack up.
              </p>
              <Link href="/register" className="lamp-link mt-5 inline-block">
                Create a student account
              </Link>
            </div>
            <div>
              <h3 className="lamp-h3">Mentors</h3>
              <p className="mt-3 text-[var(--lamp-graphite)]">
                Graduates and tutors who want to teach what they know, set their own hours and get
                paid per session.
              </p>
              <Link href="/register" className="lamp-link mt-5 inline-block">
                Apply as a mentor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
