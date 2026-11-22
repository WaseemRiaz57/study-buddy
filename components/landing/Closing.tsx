import Link from "next/link";

export default function Closing() {
  return (
    <section className="border-t border-[var(--lamp-rule)] py-[clamp(7rem,18vw,14rem)]" aria-labelledby="closing-title">
      <div className="lamp-wrap text-center">
        <h2 id="closing-title" className="lamp-display mx-auto max-w-[14ch]">
          Your next session starts tonight.
        </h2>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/register" className="lamp-btn lamp-btn-primary">
            Start studying free
          </Link>
          <Link href="/dashboard/study-rooms" className="lamp-btn lamp-btn-ghost">
            Browse open rooms
          </Link>
        </div>
      </div>
    </section>
  );
}
