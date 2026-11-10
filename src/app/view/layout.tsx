import type { Metadata } from 'next';
import { OG_IMAGE, SITE_NAME } from '@/utils/site';

/**
 * Share links are what people paste into chats, so this is the preview most
 * people will see. The calendar itself is in the URL fragment, which is never
 * sent to a server — a link preview cannot show anyone's data, only this.
 */
const title = 'A shared life calendar';
const description =
  'Someone shared their life in weeks with you. It opens in your browser; nothing is uploaded.';

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  openGraph: { type: 'website', siteName: SITE_NAME, title, description, url: '/view', images: [OG_IMAGE] },
  twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
};

export default function ViewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
