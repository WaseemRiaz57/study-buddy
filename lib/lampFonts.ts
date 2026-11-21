import { Instrument_Sans, Newsreader } from "next/font/google";

// "Lamplight" public-site fonts (see DESIGN_SYSTEM.md). Only the public route
// group layouts import this, so dashboard/admin never download these files.
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

export const lampFontVars = `${serif.variable} ${sans.variable}`;
