import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here. Every visitor's
// calendar is their own, read from their browser: nothing to index.
export const metadata: Metadata = {
  title: 'Your calendar',
  robots: { index: false },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
