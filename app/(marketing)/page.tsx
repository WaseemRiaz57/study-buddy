import Hero from "@/components/landing/Hero";
import SessionStory from "@/components/landing/SessionStory";
import Inside from "@/components/landing/Inside";
import Voices from "@/components/landing/Voices";
import Plans from "@/components/landing/Plans";
import Faq from "@/components/landing/Faq";
import Closing from "@/components/landing/Closing";

export default function Home() {
  return (
    <>
      <Hero />
      <SessionStory />
      <Inside />
      <Voices />
      <Plans />
      <Faq />
      <Closing />
    </>
  );
}
