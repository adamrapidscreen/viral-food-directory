'use client';

import { useEffect } from 'react';

/**
 * Fix for Next.js dev tools portal positioning issues
 * This component applies styles to nextjs-portal elements that are created by Next.js dev tools
 */
export default function PortalFix() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Function to fix portal elements
    const fixPortals = () => {
      const portals = document.querySelectorAll('script > nextjs-portal');
      portals.forEach((portal) => {
        const element = portal as HTMLElement;
        // Apply styles directly to fix the 0px issue
        element.style.cssText = `
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 1px !important;
          height: 1px !important;
          overflow: hidden !important;
          visibility: hidden !important;
          pointer-events: none !important;
          display: block !important;
        `;
      });
    };

    // Fix existing portals
    fixPortals();

    // Watch for new portals (Next.js dev tools might add them dynamically)
    // Use a debounced approach to avoid excessive calls
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver(() => {
      // Debounce to prevent excessive calls that might cause flashing
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fixPortals();
      }, 100);
    });

    // Only observe body, not head, to prevent head flashing
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        // Don't watch for attribute changes to reduce noise
      });
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return null;
}
