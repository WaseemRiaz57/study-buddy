"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

type Step = { title: string; body: string; panel: () => React.ReactElement };

const steps: Step[] = [
  {
    title: "Drop in your lecture",
    body: "Upload a PDF or Word file, or paste a topic. StudyBuddy writes structured notes and a short summary you can edit.",
    panel: UploadPanel,
  },
  {
    title: "Quiz yourself",
    body: "Turn the same notes into a quiz. You see what you got wrong and which pages to reread.",
    panel: QuizPanel,
  },
  {
    title: "Study in a room",
    body: "Join a live room with video and chat. Everyone runs the same focus timer, so nobody drifts off.",
    panel: RoomPanel,
  },
  {
    title: "Ask a mentor",
    body: "Stuck on something the notes can't explain? Book a one-to-one session with a mentor who has taught it.",
    panel: MentorPanel,
  },
  {
    title: "Come back tomorrow",
    body: "Every session adds XP and keeps your streak alive. Weekly challenges give you a reason to open the books.",
    panel: StreakPanel,
  },
];

export default function SessionStory() {
  return (
    <section id="session" className="relative scroll-mt-16 border-t border-[var(--lamp-rule)]" aria-labelledby="session-title">
      <div className="lamp-wrap pt-[var(--lamp-section)]">
        <div className="grid gap-6 lg:grid-cols-12">
          <h2 id="session-title" className="lamp-h2 lg:col-span-7">
            One evening, start to finish.
          </h2>
          <p className="lamp-lead max-w-[30rem] self-end lg:col-span-5">
            Most students lose the night switching between five apps. Here&rsquo;s the same evening in one
            place.
          </p>
        </div>
      </div>

      <PinnedStory />
      <StackedStory />
    </section>
  );
}

/* Desktop: the steps pin while the panel changes with scroll. */
function PinnedStory() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(steps.length - 1, Math.floor(v * steps.length));
    setActive((cur) => (cur === next ? cur : next));
  });

  const jumpTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * ((i + 0.5) / steps.length), behavior: reduce ? "auto" : "smooth" });
  };

  const Panel = steps[active].panel;

  return (
    <div ref={ref} className="relative hidden lg:block" style={{ height: `${steps.length * 70 + 30}vh` }}>
      <div className="sticky top-0 flex h-[100svh] items-center">
        <div className="lamp-wrap grid grid-cols-12 items-center gap-8">
          <div className="col-span-5">
            <ol className="flex flex-col">
              {steps.map((s, i) => {
                const on = i === active;
                return (
                  <li key={s.title} className="border-t border-[var(--lamp-rule)] last:border-b">
                    <button
                      type="button"
                      onClick={() => jumpTo(i)}
                      aria-current={on ? "step" : undefined}
                      className="flex w-full items-baseline gap-5 py-4 text-left"
                    >
                      <span className={`w-6 text-sm tabular-nums transition-colors duration-300 ${on ? "text-[var(--lamp-marker)]" : "text-[var(--lamp-graphite)]"}`}>
                        {i + 1}
                      </span>
                      <span
                        className={`lamp-serif text-[1.75rem] leading-tight tracking-[-0.015em] transition-colors duration-300 ${
                          on ? "text-[var(--lamp-paper)]" : "text-[var(--lamp-graphite)] hover:text-[var(--lamp-paper)]/80"
                        }`}
                      >
                        {s.title}
                      </span>
                    </button>
                    <div
                      className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.2,0.7,0.1,1)]"
                      style={{ gridTemplateRows: on ? "1fr" : "0fr" }}
                    >
                      <p className="overflow-hidden pl-11 pr-4 text-[var(--lamp-graphite)]">
                        <span className="block pb-5">{s.body}</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-8 h-px w-full bg-[var(--lamp-rule)]" aria-hidden="true">
              <motion.div className="h-px bg-[var(--lamp-marker)]" style={{ width: bar }} />
            </div>
          </div>

          <div className="col-span-6 col-start-7">
            <div className="relative aspect-[5/4] w-full">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  className="absolute inset-0"
                  initial={reduce ? false : { opacity: 0, y: 24, rotateX: 8 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: [0.2, 0.7, 0.1, 1] }}
                  style={{ transformPerspective: 1200 }}
                >
                  <Panel />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Mobile/tablet: a plain stacked sequence. */
function StackedStory() {
  return (
    <ol className="lamp-wrap flex flex-col gap-16 pb-[var(--lamp-section)] pt-14 lg:hidden">
      {steps.map((s, i) => {
        const Panel = s.panel;
        return (
          <li key={s.title}>
            <div className="flex items-baseline gap-4 border-t border-[var(--lamp-rule)] pt-5">
              <span className="text-sm tabular-nums text-[var(--lamp-marker)]">{i + 1}</span>
              <h3 className="lamp-h3">{s.title}</h3>
            </div>
            <p className="mt-3 max-w-[34rem] pl-7 text-[var(--lamp-graphite)]">{s.body}</p>
            <div className="mt-6 w-full sm:aspect-[5/4]">
              <Panel />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* --- Panels: small, honest sketches of the real screens ------------------ */

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-[var(--lamp-rule)] bg-[var(--lamp-desk)]">
      <div className="flex items-center justify-between border-b border-[var(--lamp-rule)] px-5 py-3 text-[0.8rem] text-[var(--lamp-graphite)]">
        <span>{title}</span>
        <span aria-hidden="true" className="flex gap-1.5">
          <i className="h-2 w-2 rounded-full bg-[var(--lamp-rule-strong)]" />
          <i className="h-2 w-2 rounded-full bg-[var(--lamp-rule-strong)]" />
        </span>
      </div>
      <div className="flex-1 p-5 sm:p-7">{children}</div>
    </div>
  );
}

function UploadPanel() {
  return (
    <Frame title="AI notes">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center gap-4 rounded-[10px] border border-dashed border-[var(--lamp-rule-strong)] p-4">
          <div className="grid h-12 w-10 shrink-0 place-items-center rounded-[3px] bg-[var(--lamp-paper)] text-[0.65rem] font-semibold text-[var(--lamp-ink)]">
            PDF
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.95rem]">organic-chem-week-9.pdf</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--lamp-rule)]">
              <div className="h-full w-full bg-[var(--lamp-marker)]" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <p className="lamp-serif text-xl">Nucleophilic substitution</p>
          <p className="text-[0.9rem] text-[var(--lamp-graphite)]">
            <span className="lamp-hl is-on">SN1 goes through a carbocation</span>, so it prefers tertiary carbons
            and polar protic solvents.
          </p>
          <p className="text-[0.9rem] text-[var(--lamp-graphite)]">
            SN2 is one concerted step with backside attack and inverts the stereocentre.
          </p>
        </div>
        <p className="mt-auto text-[0.8rem] text-[var(--lamp-graphite)]">Notes, summary and quiz ready in 41 seconds</p>
      </div>
    </Frame>
  );
}

function QuizPanel() {
  const rows = [
    { q: "Rate law of SN2", ok: true },
    { q: "Solvent for SN1", ok: true },
    { q: "Stereochemistry of SN2", ok: false },
    { q: "Carbocation stability", ok: true },
    { q: "E1 vs SN1 conditions", ok: false },
  ];
  return (
    <Frame title="Quiz results">
      <div className="flex h-full flex-col">
        <p className="lamp-serif text-[3.5rem] leading-none">6/8</p>
        <p className="mt-2 text-[0.9rem] text-[var(--lamp-graphite)]">Two to revisit before Friday</p>
        <ul className="mt-6 divide-y divide-[var(--lamp-rule)] text-[0.92rem]">
          {rows.map((r) => (
            <li key={r.q} className="flex items-center justify-between py-2.5">
              <span className={r.ok ? "text-[var(--lamp-graphite)]" : ""}>{r.q}</span>
              <span className={`text-[0.8rem] ${r.ok ? "text-[var(--lamp-graphite)]" : "text-[var(--lamp-marker)]"}`}>
                {r.ok ? "Right" : "Reread p. 4"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

function RoomPanel() {
  const people = ["AK", "MR", "JS", "LT", "You", "PN"];
  return (
    <Frame title="Organic chemistry finals room">
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-3 gap-2.5">
          {people.map((p, i) => (
            <div
              key={p}
              className={`relative grid aspect-[4/3] place-items-center rounded-[8px] text-[0.85rem] ${
                p === "You" ? "bg-[var(--lamp-desk-2)] ring-1 ring-[var(--lamp-marker)]/70" : "bg-[var(--lamp-desk-2)]"
              }`}
            >
              <span className="lamp-serif text-lg">{p}</span>
              {i % 2 === 0 && (
                <span className="absolute bottom-1.5 left-2 h-1.5 w-1.5 rounded-full bg-[var(--lamp-marker)]" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pt-6">
          <div>
            <p className="text-[0.8rem] text-[var(--lamp-graphite)]">Focus block 2 of 4</p>
            <p className="lamp-serif text-[3rem] leading-none tabular-nums">18:42</p>
          </div>
          <p className="text-right text-[0.85rem] text-[var(--lamp-graphite)]">
            Break in 18 min
            <br />6 studying
          </p>
        </div>
      </div>
    </Frame>
  );
}

function MentorPanel() {
  const slots = ["Tue 7:00 pm", "Tue 8:30 pm", "Wed 6:00 pm", "Thu 9:00 pm"];
  return (
    <Frame title="Book a mentor">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--lamp-paper)] text-[var(--lamp-ink)]">
            <span className="lamp-serif text-xl">SH</span>
          </div>
          <div>
            <p className="lamp-serif text-xl">Sara H.</p>
            <p className="text-[0.85rem] text-[var(--lamp-graphite)]">Chemistry, 4 years tutoring first-years</p>
          </div>
        </div>
        <p className="mt-6 text-[0.85rem] text-[var(--lamp-graphite)]">45-minute session, video</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {slots.map((s, i) => (
            <span
              key={s}
              className={`rounded-full border px-4 py-2.5 text-center text-[0.88rem] ${
                i === 1
                  ? "border-[var(--lamp-marker)] bg-[var(--lamp-marker)] text-[var(--lamp-ink)]"
                  : "border-[var(--lamp-rule-strong)]"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
        <p className="mt-auto pt-6 text-[0.85rem] text-[var(--lamp-graphite)]">
          &ldquo;Bring the two questions you got wrong.&rdquo;
        </p>
      </div>
    </Frame>
  );
}

function StreakPanel() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <Frame title="Your week">
      <div className="flex h-full flex-col">
        <p className="lamp-serif text-[3.5rem] leading-none">12 days</p>
        <p className="mt-2 text-[0.9rem] text-[var(--lamp-graphite)]">Longest streak this term</p>
        <div className="mt-7 grid grid-cols-7 gap-2">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span
                className={`h-12 w-full rounded-[6px] ${
                  i < 5 ? "bg-[var(--lamp-marker)]" : "border border-dashed border-[var(--lamp-rule-strong)]"
                }`}
                style={i < 5 ? { opacity: 0.45 + i * 0.13 } : undefined}
              />
              <span className="text-[0.75rem] text-[var(--lamp-graphite)]">{d}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex justify-between border-t border-[var(--lamp-rule)] pt-4 text-[0.9rem]">
          <span className="text-[var(--lamp-graphite)]">This week</span>
          <span>+340 XP, 1 badge</span>
        </div>
      </div>
    </Frame>
  );
}
