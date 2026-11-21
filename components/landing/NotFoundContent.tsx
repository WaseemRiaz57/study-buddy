import Link from "next/link";

export default function NotFoundContent() {
  return (
    <section className="lamp-wrap flex min-h-[80dvh] flex-col justify-center pb-24 pt-[calc(4.5rem+4rem)]">
      <p className="text-[var(--lamp-graphite)]">Error 404</p>
      <h1 className="lamp-display mt-4 max-w-[12ch]">This page isn&rsquo;t in your notes.</h1>
      <p className="lamp-lead mt-8 max-w-[34rem]">
        The link may be old or mistyped. Head back to the homepage, or open your dashboard if you were
        in the middle of something.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="lamp-btn lamp-btn-primary">
          Go to homepage
        </Link>
        <Link href="/dashboard" className="lamp-btn lamp-btn-ghost">
          Open dashboard
        </Link>
      </div>
    </section>
  );
}
