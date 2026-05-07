"use client";

import { Sparkles, Menu, X, Moon, Sun, User, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react"; // 👈 NextAuth import

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#community", label: "Community" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  
  // 👇 Auth Session Check
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const isDark = resolvedTheme === "dark";
  const profileImage = avatarFailed ? "" : session?.user?.image;
  const renderThemeIcon = () => {
    if (!mounted) {
      return null;
    }

    return isDark ? (
      <motion.div
        key="sun"
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Sun className="h-4 w-4 text-primary" strokeWidth={2.5} />
      </motion.div>
    ) : (
      <motion.div
        key="moon"
        initial={{ rotate: 90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: -90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Moon className="h-4 w-4 text-primary" strokeWidth={2.5} />
      </motion.div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 font-bold tracking-tight group"
        >
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Sparkles className="h-5 w-5 text-primary" strokeWidth={2.5} />
          </motion.div>
          <span className="text-lg">StudyBuddy</span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors"
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="hidden md:flex md:items-center md:gap-3">
          
          {/* 👇 Auth Conditional Render 👇 */}
          {isAuthenticated ? (
            // Logged In View: Settings & Profile
            <div className="flex items-center gap-4 border-r border-border/50 pr-4">
              <Link href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard/settings" className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Settings">
                <Settings className="w-5 h-5" />
              </Link>
              <Link href="/dashboard/settings" className="size-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center hover:scale-105 transition-transform" title="My Profile">
                 {/* Agar Google Image hai toh yahan image lag sakti hai, warna default user icon */}
                 {profileImage ? (
                   <img
                     src={profileImage}
                     alt="Profile"
                     className="size-full rounded-full object-cover"
                     referrerPolicy="no-referrer"
                     onError={() => setAvatarFailed(true)}
                   />
                 ) : (
                   <User className="w-4 h-4" />
                 )}
              </Link>
            </div>
          ) : (
            // Logged Out View: Login & Join Free
            <>
              <Link
                href="/login"
                className="rounded-full px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                Log in
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/register"
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
                >
                  Join Free
                </Link>
              </motion.div>
            </>
          )}
          
          {/* Desktop Theme Toggle */}
          <motion.button
            type="button"
            onClick={toggleTheme}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex size-9 items-center justify-center rounded-full bg-card border border-border hover:border-primary/50 transition-all"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {renderThemeIcon()}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Theme Toggle */}
        <motion.button
          type="button"
          onClick={toggleTheme}
          whileTap={{ scale: 0.9 }}
          className="md:hidden flex size-8 items-center justify-center rounded-full bg-card border border-border ml-2"
          aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
              {renderThemeIcon()}
            </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border/50 bg-card/50 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              
              {/* 👇 Mobile Auth Conditional Render 👇 */}
              <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-border/50">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-4 py-3 text-sm font-semibold text-center text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg bg-primary/10 text-primary px-4 py-3 text-sm font-bold text-center transition-all hover:bg-primary hover:text-white"
                    >
                      Settings & Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-4 py-3 text-sm font-semibold text-center text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-center text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
                    >
                      Join Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
