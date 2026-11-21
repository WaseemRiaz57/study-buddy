const modules = [
  {
    name: "AI notes and quizzes",
    what: "Turn lectures, slides or a topic into notes, summaries and practice quizzes.",
    detail: "PDF, Word or plain text",
  },
  {
    name: "Live study rooms",
    what: "Video rooms with chat, a shared timer and a file vault for the group.",
    detail: "Public or invite-only",
  },
  {
    name: "Study with a buddy",
    what: "Get matched with a student on the same course who studies when you do.",
    detail: "Matched by subject and schedule",
  },
  {
    name: "Focus room",
    what: "A quiet solo space with a Pomodoro timer, ambient sound and a to-do list.",
    detail: "Tracks your deep-work hours",
  },
  {
    name: "Mentors",
    what: "Book one-to-one sessions with mentors, then leave a review afterwards.",
    detail: "Video sessions, paid per booking",
  },
  {
    name: "Community forum",
    what: "Ask a question at 2 am and get an answer from someone who sat the same exam.",
    detail: "Moderated",
  },
  {
    name: "Resource hub",
    what: "Shared notes, past papers and guides, rated by the students who used them.",
    detail: "Download or share your own",
  },
  {
    name: "Challenges and streaks",
    what: "XP, badges and weekly challenges that reward showing up, not cramming.",
    detail: "Leaderboards per course",
  },
  {
    name: "Progress",
    what: "See your study hours, quiz scores and weak topics over the term.",
    detail: "Updated after every session",
  },
];

export default function Inside() {
  return (
    <section id="inside" className="lamp-section scroll-mt-16 border-t border-[var(--lamp-rule)]" aria-labelledby="inside-title">
      <div className="lamp-wrap">
        <div className="grid gap-6 lg:grid-cols-12">
          <h2 id="inside-title" className="lamp-h2 lg:col-span-6">
            Everything an exam term needs.
          </h2>
          <p className="lamp-lead max-w-[30rem] self-end lg:col-span-5 lg:col-start-8">
            Nine tools that share one account, one set of notes and one streak, so nothing gets lost
            between apps.
          </p>
        </div>

        <ul className="mt-16 lg:mt-24">
          {modules.map((m) => (
            <li key={m.name} className="lamp-row grid gap-2 py-6 md:grid-cols-12 md:gap-8 md:py-7">
              <h3 className="lamp-h3 md:col-span-4">
                <span className="lamp-hl">{m.name}</span>
              </h3>
              <p className="max-w-[34rem] text-[var(--lamp-paper)]/85 md:col-span-5">{m.what}</p>
              <p className="text-sm text-[var(--lamp-graphite)] md:col-span-3 md:text-right">{m.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
