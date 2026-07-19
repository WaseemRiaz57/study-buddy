import { useState, useEffect } from "react";

/**
 * Detects whether the viewport is below the given breakpoint.
 * The optional safe initial value lets performance-sensitive surfaces render
 * their lightweight mobile path until the viewport has been measured.
 * On mobile, heavy animations / particles should be disabled.
 */
export function useIsMobile(breakpoint = 768, initialValue = false) {
  const [isMobile, setIsMobile] = useState(initialValue);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
