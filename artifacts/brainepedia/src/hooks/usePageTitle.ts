import { useEffect } from "react";

const BASE = "Brainepedia";

/**
 * Sets the browser tab title for the current page.
 * Usage: usePageTitle("Dashboard") → "Dashboard | Brainepedia"
 *        usePageTitle() → "Brainepedia"
 */
export function usePageTitle(pageTitle?: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = pageTitle ? `${pageTitle} | ${BASE}` : BASE;
    return () => {
      document.title = prev;
    };
  }, [pageTitle]);
}
