import React from 'react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section
      className="flex items-center justify-center min-h-[80vh] px-4 py-20 bg-white dark:bg-gray-900 transition-colors duration-300 font-sans"
      aria-label="StudyBuddy Platform Introduction"
    >
      <div className="max-w-6xl mx-auto text-center">
        {/* Headline */}
        <h1 className="mb-6 text-7xl font-extrabold tracking-tight whitespace-nowrap md:text-8xl lg:text-9xl">
          <span className="block text-[#111827] dark:text-white mb-2">
            Studying made social.
          </span>
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] to-[#C4B5FD] dark:from-[#A855F7] dark:to-[#E9D5FF]">
            Success made certain.
          </span>
        </h1>
        {/* Subheading */}
        <p className="max-w-2xl mx-auto mb-10 text-lg font-normal text-[#4B5563] dark:text-gray-300 md:text-xl leading-relaxed">
          Where learning meets innovation. Build knowledge, connect with mentors, and achieve your goals in a community that never stops growing.
        </p>
        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-10 py-3 text-base font-semibold text-white bg-[#9333EA] rounded-full hover:bg-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9333EA] shadow-[0_4px_30px_rgba(147,51,234,0.4)] transition-all"
            aria-label="Begin a new study session"
          >
            Begin a session &rarr;
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-10 py-3 text-base font-semibold text-[#111827] bg-white border border-gray-200 rounded-full hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700 dark:focus:ring-offset-gray-900"
            aria-label="View your dashboard"
          >
            View dashboard
          </Link>
        </div>
        {/* Footer */}
        <p className="text-sm font-semibold text-[#6B7280] dark:text-gray-400">
          No credit card required &bull; Free forever plan
        </p>
      </div>
    </section>
  );
}
