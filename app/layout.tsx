import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { ConditionalNavbar } from "@/components/conditional-navbar";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "@/components/auth-provider";
import { Toaster } from "sonner"; // 👈 1. Sonner import kiya
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "StudyBuddy",
  description: "Obsidian Zen study companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ConditionalNavbar />
            {children}
            <Footer />
            {/* 👇 2. Toaster component add kiya (theme aur colors ke sath) */}
            <Toaster richColors position="top-right" theme="system" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
