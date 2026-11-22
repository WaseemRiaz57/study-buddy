import Link from "next/link";
import { PRICING_PLANS, type PricingPlanConfig } from "@/lib/pricingConfig";

const blurb: Record<PricingPlanConfig["id"], string> = {
  free: "Everything you need for a normal week of studying.",
  pro: "For exam season: more AI, bigger rooms and faster matching.",
  elite: "No limits, for heavy users and mentors who teach in rooms.",
};

export default function Plans() {
  return (
    <section id="plans" className="lamp-section scroll-mt-16 border-t border-[var(--lamp-rule)]" aria-labelledby="plans-title">
      <div className="lamp-wrap">
        <div className="grid gap-6 lg:grid-cols-12">
          <h2 id="plans-title" className="lamp-h2 lg:col-span-7">
            Free to start. More when exams hit.
          </h2>
          <p className="lamp-lead max-w-[30rem] self-end lg:col-span-5">
            Every plan includes study rooms, the focus room, the forum and the resource hub. Upgrade
            from your dashboard whenever you need more.
          </p>
        </div>

        <div className="mt-16 grid gap-4 lg:mt-24 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const featured = Boolean(plan.featured);
            const href =
              plan.id === "free"
                ? "/register"
                : `/login?callbackUrl=${encodeURIComponent(`/dashboard/upgrade?plan=${plan.id}`)}`;
            return (
              <article
                key={plan.id}
                className={`flex flex-col rounded-[14px] border p-7 sm:p-8 ${
                  featured
                    ? "border-[var(--lamp-marker)]/70 bg-[var(--lamp-desk)]"
                    : "border-[var(--lamp-rule)]"
                }`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="lamp-serif text-[2.25rem] leading-none tracking-[-0.02em]">{plan.name}</h3>
                  {featured && <span className="text-sm text-[var(--lamp-marker)]">Most students pick this</span>}
                </div>
                <p className="mt-4 text-[var(--lamp-graphite)]">{blurb[plan.id]}</p>

                <dl className="mt-8 grid grid-cols-3 gap-x-4 border-y border-[var(--lamp-rule)] py-6">
                  <div>
                    <dt className="text-[0.8rem] text-[var(--lamp-graphite)]">AI notes</dt>
                    <dd className="lamp-serif mt-1 text-xl">
                      {plan.limits.aiGenerationsPerDay === null ? "Unlimited" : `${plan.limits.aiGenerationsPerDay}/day`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.8rem] text-[var(--lamp-graphite)]">Room size</dt>
                    <dd className="lamp-serif mt-1 text-xl">Up to {plan.limits.studyRoomCapacity}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.8rem] text-[var(--lamp-graphite)]">Uploads</dt>
                    <dd className="lamp-serif mt-1 text-xl">
                      {plan.limits.resourceUploadsPerMonth === null ? "Unlimited" : `${plan.limits.resourceUploadsPerMonth}/mo`}
                    </dd>
                  </div>
                </dl>

                <ul className="mt-6 space-y-2.5 text-[0.95rem] text-[var(--lamp-paper)]/85">
                  {plan.features
                    .filter((f) => !/generation|active study rooms|participants|uploads per month/i.test(f))
                    .map((f) => (
                      <li key={f} className="flex gap-3">
                        <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-[var(--lamp-marker)]" />
                        {f}
                      </li>
                    ))}
                </ul>

                <div className="mt-auto pt-10">
                  <Link href={href} className={`lamp-btn w-full ${featured ? "lamp-btn-primary" : "lamp-btn-ghost"}`}>
                    {plan.id === "free" ? "Create a free account" : `Get ${plan.name}`}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
