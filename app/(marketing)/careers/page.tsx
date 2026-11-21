import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/landing/PageIntro";

export const metadata: Metadata = {
  title: "Careers",
  description: "Work on StudyBuddy, or teach on it as a mentor.",
};

export default function CareersPage() {
  return (
    <>
      <PageIntro
        kicker="Careers"
        title="Help more students study with company."
        lead="We build the tools students actually open at 11 pm. When we hire, roles will be posted on this page first."
      />

      <section className="lamp-section" aria-labelledby="roles-title">
        <div className="lamp-wrap grid gap-12 lg:grid-cols-12">
          <h2 id="roles-title" className="lamp-h2 lg:col-span-5">
            Open roles.
          </h2>
          <div className="lg:col-span-7">
            <div className="lamp-row py-8">
              <p className="lamp-h3">No open roles right now.</p>
              <p className="mt-3 max-w-[36rem] text-[var(--lamp-graphite)]">
                Check back here for engineering, design and community roles. In the meantime, the
                quickest way to work with us is to teach on StudyBuddy.
              </p>
            </div>
            <div className="lamp-row py-8">
              <p className="lamp-h3">
                <span className="lamp-hl is-on">Teach as a mentor</span>
              </p>
              <p className="mt-3 max-w-[36rem] text-[var(--lamp-graphite)]">
                Set your subjects and hours, run one-to-one video sessions and get paid for every
                booking. Applications are reviewed by our team.
              </p>
              <Link href="/register" className="lamp-btn lamp-btn-primary mt-7">
                Apply as a mentor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
