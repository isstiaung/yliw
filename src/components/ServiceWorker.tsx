'use client';

import { useEffect } from 'react';

/**
 * Registers the offline service worker. Production only: in development it
 * would cache the dev server's HTML and hide your own changes.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is an enhancement; the app works without it.
    });
  }, []);
  return null;
}
