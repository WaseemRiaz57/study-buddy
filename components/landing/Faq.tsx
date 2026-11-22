const faqs = [
  {
    q: "Is the free plan actually free?",
    a: "Yes. You get AI notes and quizzes every day, study rooms, the focus room, the forum and the resource hub without adding a card. You only pay if you upgrade or book a mentor.",
  },
  {
    q: "What files can I turn into notes?",
    a: "PDFs and Word documents, or you can paste text or just type a topic. Very long files are trimmed to the most relevant sections first.",
  },
  {
    q: "Do I need my camera on in study rooms?",
    a: "No. Many rooms are silent co-working with cameras optional. The room host sets the rules, and you can leave or mute at any time.",
  },
  {
    q: "Who are the mentors?",
    a: "Students and graduates who have applied, been reviewed and set their own subjects and hours. Every session can be reviewed afterwards, and reviews are public.",
  },
  {
    q: "What happens if someone is rude?",
    a: "Report them from the room, chat or forum post. Reports go to a moderation team who can warn, mute or suspend accounts.",
  },
];

export default function Faq() {
  return (
    <section className="lamp-section border-t border-[var(--lamp-rule)]" aria-labelledby="faq-title">
      <div className="lamp-wrap grid gap-12 lg:grid-cols-12">
        <h2 id="faq-title" className="lamp-h2 lg:col-span-4">
          Questions students ask first.
        </h2>
        <div className="lg:col-span-7 lg:col-start-6">
          {faqs.map((f) => (
            <details key={f.q} className="lamp-faq lamp-row group">
              <summary className="flex items-center justify-between gap-6 py-6">
                <span className="lamp-serif text-[1.35rem] leading-snug tracking-[-0.01em]">{f.q}</span>
                <span aria-hidden="true" className="lamp-faq-icon relative h-4 w-4 shrink-0">
                  <i className="absolute left-0 top-1/2 h-px w-4 bg-[var(--lamp-paper)]" />
                  <i className="absolute left-1/2 top-0 h-4 w-px bg-[var(--lamp-paper)]" />
                </span>
              </summary>
              <p className="max-w-[38rem] pb-7 pr-10 text-[var(--lamp-graphite)]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
