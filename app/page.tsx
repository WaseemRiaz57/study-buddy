import { Instrument_Sans, Newsreader } from "next/font/google";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import SessionStory from "@/components/landing/SessionStory";
import Inside from "@/components/landing/Inside";
import Voices from "@/components/landing/Voices";
import Plans from "@/components/landing/Plans";
import Faq from "@/components/landing/Faq";
import Closing from "@/components/landing/Closing";
import "./landing.css";

// Fonts are declared here (not in the root layout) so only the marketing page
// downloads them.
const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-lamp-serif",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-lamp-sans",
  display: "swap",
});

export default function Home() {
  return (
    <div className={`lamp ${serif.variable} ${sans.variable} min-h-screen`}>
      <a
        href="#main"
        className="lamp-btn lamp-btn-primary fixed left-4 top-4 z-[60] -translate-y-24 focus:translate-y-0"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <Hero />
        <SessionStory />
        <Inside />
        <Voices />
        <Plans />
        <Faq />
      </main>
      <Closing />
    </div>
  );
}
