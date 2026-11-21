import Link from "next/link";
import NotesSheet from "./NotesSheet";

const headline = ["Late-night study,", "with good", "company."];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-[4.5rem]" aria-labelledby="hero-title">
      {/* The desk lamp: one warm pool of light behind the notes. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[20vw] -top-[10vw] -z-10 h-[70vw] w-[70vw] max-w-[1100px] max-h-[1100px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, rgb(255 226 160 / 0.13), rgb(255 226 160 / 0.04) 55%, transparent)",
        }}
      />

      <div className="lamp-wrap grid min-h-[calc(100svh-4.5rem)] grid-cols-1 items-center gap-14 py-14 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="lg:col-span-7">
          <h1 id="hero-title" className="lamp-display">
            {headline.map((line, i) => (
              <span key={line} className="lamp-rise">
                <span style={{ "--d": `${80 + i * 110}ms` } as React.CSSProperties}>{line}</span>
              </span>
            ))}
          </h1>

          <p
            className="lamp-lead lamp-fade mt-8 max-w-[34rem]"
            style={{ "--d": "520ms" } as React.CSSProperties}
          >
            Turn a lecture PDF into notes and a quiz in under a minute, then work through it in a
            live room with students and mentors who keep you going.
          </p>

          <div
            className="lamp-fade mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            style={{ "--d": "640ms" } as React.CSSProperties}
          >
            <Link href="/register" className="lamp-btn lamp-btn-primary">
              Start studying free
            </Link>
            <Link href="#session" className="lamp-btn lamp-btn-ghost">
              See how a session works
            </Link>
          </div>

          <p
            className="lamp-fade mt-6 text-sm text-[var(--lamp-graphite)]"
            style={{ "--d": "760ms" } as React.CSSProperties}
          >
            Free plan, no card needed.
          </p>
        </div>

        <div className="lamp-fade lg:col-span-5" style={{ "--d": "300ms" } as React.CSSProperties}>
          <NotesSheet>
            <figure className="lamp-sheet mx-auto w-full max-w-[30rem] px-6 pb-8 pl-[3.5rem] pt-6 sm:pr-8">
              <figcaption className="h-[3.25rem]">
                <p className="lamp-serif text-[1.35rem] leading-tight">Cellular respiration</p>
                <p className="text-[0.78rem] text-[var(--lamp-graphite)]">
                  Notes from lecture-07.pdf, 18 pages
                </p>
              </figcaption>

              <ul className="text-[0.95rem] leading-[2rem] text-[var(--lamp-paper)]/90">
                <li>
                  Glycolysis runs in the cytoplasm and{" "}
                  <mark className="lamp-hl lamp-hl-load bg-transparent text-inherit" style={{ "--d": "1100ms" } as React.CSSProperties}>
                    doesn&rsquo;t need oxygen.
                  </mark>
                </li>
                <li>
                  Net gain per glucose:{" "}
                  <mark className="lamp-hl lamp-hl-load bg-transparent text-inherit" style={{ "--d": "1450ms" } as React.CSSProperties}>
                    2 ATP and 2 NADH.
                  </mark>
                </li>
                <li>The Krebs cycle happens in the mitochondrial matrix.</li>
                <li>
                  Most ATP comes from the{" "}
                  <mark className="lamp-hl lamp-hl-load bg-transparent text-inherit" style={{ "--d": "1800ms" } as React.CSSProperties}>
                    electron transport chain.
                  </mark>
                </li>
              </ul>

              <div className="mt-6 rounded-[10px] border border-[var(--lamp-rule)] bg-[var(--lamp-ink)]/60 p-4">
                <p className="text-[0.78rem] text-[var(--lamp-graphite)]">Quick check, 1 of 8</p>
                <p className="mt-1 text-[0.95rem]">Where does glycolysis take place?</p>
                <ol className="mt-3 grid gap-2 text-[0.88rem]">
                  <li
                    className="lamp-fade flex items-center justify-between rounded-md border border-[var(--lamp-marker)]/60 px-3 py-2"
                    style={{ "--d": "2200ms" } as React.CSSProperties}
                  >
                    Cytoplasm
                    <span className="text-[0.78rem] text-[var(--lamp-marker)]">Correct</span>
                  </li>
                  <li className="rounded-md border border-[var(--lamp-rule)] px-3 py-2 text-[var(--lamp-graphite)]">
                    Mitochondrial matrix
                  </li>
                  <li className="rounded-md border border-[var(--lamp-rule)] px-3 py-2 text-[var(--lamp-graphite)]">
                    Nucleus
                  </li>
                </ol>
              </div>
            </figure>
          </NotesSheet>
        </div>
      </div>
    </section>
  );
}
