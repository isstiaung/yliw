/**
 * Where the app is published, for metadata that needs absolute URLs: link
 * previews, the canonical URL, robots.txt and the sitemap.
 *
 * Defaults to the public instance. A fork deployed elsewhere should set
 * SITE_URL at build time, or its link previews will point at this one.
 */
export const SITE_URL = (process.env.SITE_URL ?? 'https://yliw.isstiaung.me').replace(/\/+$/, '');

export const SITE_NAME = 'Your Life In Weeks';

export const SITE_TITLE = 'Your Life In Weeks — a printable calendar of every week of your life';

export const SITE_DESCRIPTION =
  'One square for every week of your life. Mark the milestones that mattered, ' +
  'print it as a poster, and keep it on your device: no account, no server, no tracking.';

/**
 * The link-preview image, rendered by scripts/og-image.mjs. Listed explicitly
 * on every page that sets its own openGraph or twitter fields, because those
 * replace the inherited ones wholesale, image included.
 */
export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt:
    'Your Life In Weeks: a poster of 90 rows of 52 squares, the lived weeks filled in dark with ' +
    'coloured bands for school, work and other milestones, beside the title.',
};
