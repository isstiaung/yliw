import React from 'react';

/**
 * The yliw mark: a miniature life grid — lived weeks in ink, one ember
 * "you are here" square, unlived weeks outlined. Colours follow the
 * active theme via CSS variables.
 */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 49 49"
      className={className}
      role="img"
      aria-label="Your Life in Weeks"
    >
      <rect x="0" y="0" width="13" height="13" rx="2.5" fill="var(--ink)" />
      <rect x="18" y="0" width="13" height="13" rx="2.5" fill="var(--ink)" />
      <rect x="36" y="0" width="13" height="13" rx="2.5" fill="var(--ink)" />
      <rect x="0" y="18" width="13" height="13" rx="2.5" fill="var(--ink)" />
      <rect x="18" y="18" width="13" height="13" rx="2.5" fill="var(--ink)" />
      <rect x="36" y="18" width="13" height="13" rx="2.5" fill="var(--accent)" />
      <rect x="0.75" y="36.75" width="11.5" height="11.5" rx="2" fill="var(--week-future)" stroke="var(--week-future-border)" strokeWidth="1.5" />
      <rect x="18.75" y="36.75" width="11.5" height="11.5" rx="2" fill="var(--week-future)" stroke="var(--week-future-border)" strokeWidth="1.5" />
      <rect x="36.75" y="36.75" width="11.5" height="11.5" rx="2" fill="var(--week-future)" stroke="var(--week-future-border)" strokeWidth="1.5" />
    </svg>
  );
}
