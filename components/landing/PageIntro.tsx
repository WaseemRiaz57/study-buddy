/** Standard opening for inner public pages: large serif title + lead. */
export default function PageIntro({
  kicker,
  title,
  lead,
  children,
}: {
  kicker?: string;
  title: string;
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="pt-[calc(4.5rem+clamp(4rem,10vw,8rem))]">
      <div className="lamp-wrap">
        {kicker && <p className="lamp-fade text-[var(--lamp-graphite)]">{kicker}</p>}
        <h1 className="lamp-display mt-4 max-w-[16ch]">
          <span className="lamp-rise">
            <span>{title}</span>
          </span>
        </h1>
        {lead && (
          <p className="lamp-lead lamp-fade mt-8 max-w-[38rem]" style={{ "--d": "250ms" } as React.CSSProperties}>
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
