import { useState, useEffect } from "react";

/**
 * Detects whether the viewport is below the given breakpoint.
 * Defaults to `false` on the server (assumes desktop) to avoid hydration mismatch.
 * On mobile, heavy animations / particles should be disabled.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
