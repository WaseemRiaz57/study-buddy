import type { Metadata } from "next";
import { ConditionalNavbar } from "@/components/conditional-navbar";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "@/components/auth-provider";
import { Toaster } from "sonner"; // 👈 1. Sonner import kiya
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyBuddy",
  description: "Obsidian Zen study companion.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/logo.png", sizes: "64x64", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico", sizes: "48x48" }],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
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

