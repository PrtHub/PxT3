'use client';

import { useEffect } from 'react';

export function HydrationCleanup() {
  useEffect(() => {
    // Remove problematic attributes after hydration
    const cleanup = () => {
      document.querySelectorAll('[fdprocessedid]').forEach(el => {
        el.removeAttribute('fdprocessedid');
      });
      document.body.removeAttribute('data-new-gr-c-s-check-loaded');
      document.body.removeAttribute('data-gr-ext-installed');
    };

    // Run cleanup on mount and after a short delay to catch any dynamic additions
    cleanup();
    const timer = setTimeout(cleanup, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}