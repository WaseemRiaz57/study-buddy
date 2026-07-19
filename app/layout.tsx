import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { ConditionalNavbar } from "@/components/conditional-navbar";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "@/components/auth-provider";
import { Toaster } from "sonner"; // 👈 1. Sonner import kiya
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

const title = "StudyBuddy | The Future of Social Learning";
const description =
  "StudyBuddy connects students through collaborative study rooms, AI-powered learning tools, mentorship, and shared academic resources so learners can study smarter together.";
const heroImage = "/hero.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | StudyBuddy",
  },
  description,
  keywords: [
    "StudyBuddy",
    "EdTech",
    "education technology",
    "social learning",
    "student collaboration",
    "collaborative study rooms",
    "AI study tools",
    "online learning platform",
    "peer learning",
    "study groups",
    "student mentorship",
    "academic resources",
    "Next.js education app",
    "Next.js EdTech",
  ],
  applicationName: "StudyBuddy",
  authors: [{ name: "StudyBuddy" }],
  creator: "StudyBuddy",
  publisher: "StudyBuddy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "StudyBuddy",
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 630,
        alt: "StudyBuddy social learning platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [
      {
        url: heroImage,
        alt: "StudyBuddy social learning platform",
      },
    ],
    creator: "@studybuddy",
    site: "@studybuddy",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "256x256", type: "image/x-icon" },
      { url: "/logo.png?v=3", sizes: "192x192", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico?v=3", sizes: "256x256" }],
    apple: [{ url: "/logo.png?v=3", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b0764" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground antialiased`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <ConditionalNavbar />
            <main className="flex-1">{children}</main>
            <Footer />
            {/* 👇 2. Toaster component add kiya (theme aur colors ke sath) */}
            <Toaster richColors position="top-right" theme="system" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

