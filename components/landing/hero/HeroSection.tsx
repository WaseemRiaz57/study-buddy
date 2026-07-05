import React from 'react';

const HeroSection = () => {
  return (
    // The semantic <section> tag and clear structure aid in AEO and SEO parsing.
    // toggle "dark" class on a parent element (like <html> or <body>) to switch themes.
    <section 
      className="flex items-center justify-center min-h-[80vh] px-4 py-20 bg-[#f9fafb] dark:bg-gray-900 transition-colors duration-300 font-sans"
      aria-label="StudyBuddy Platform Introduction"
    >
      <div className="max-w-4xl mx-auto text-center">
        
        {/* SEO-optimized H1 Header with optimized keyword visibility */}
        <h1 className="mb-6 text-6xl font-extrabold tracking-tight md:text-7xl lg:text-8xl">
          <span className="block text-[#111827] dark:text-white mb-2">
            Studying made social.
          </span>
          {/* Gradient text implementation */}
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#9333EA] to-[#D8B4FE] dark:from-[#A855F7] dark:to-[#E9D5FF]">
            Success made certain.
          </span>
        </h1>

        {/* Subheading: Semantic <p> tag with highly readable contrast in both themes */}
        <p className="max-w-2xl mx-auto mb-10 text-lg font-medium text-[#4B5563] dark:text-gray-300 md:text-xl leading-relaxed">
          Where learning meets innovation. Build knowledge, connect with teachers, 
          and achieve your goals in a community that never stops growing.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8 sm:flex-row">
          <button 
            className="flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all bg-[#8B5CF6] rounded-full hover:bg-[#7C3AED] dark:bg-[#9333EA] dark:hover:bg-[#A855F7] shadow-[0_4px_30px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_40px_rgba(139,92,246,0.6)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B5CF6] dark:focus:ring-offset-gray-900"
            aria-label="Begin a new study session"
          >
            Begin a session
            <svg 
              className="w-5 h-5 ml-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <button 
            className="flex items-center justify-center px-8 py-3.5 text-base font-semibold text-[#111827] transition-all bg-white border border-gray-200 rounded-full hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700 dark:focus:ring-offset-gray-900"
            aria-label="View your dashboard"
          >
            View dashboard
          </button>
        </div>

        {/* Footer Text */}
        <p className="text-sm font-semibold text-[#6B7280] dark:text-gray-400">
          No credit card required &bull; Free forever plan
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
