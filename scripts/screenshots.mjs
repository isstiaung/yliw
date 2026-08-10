/**
 * Regenerates the README screenshots in docs/screenshots/.
 *
 * Playwright is not a project dependency — it is a ~100MB browser download
 * that only matters when the UI changes enough to make the images stale. Set
 * it up once, then run:
 *
 *   npm install --no-save playwright && npx playwright install chromium
 *   npm run build
 *   npx serve out -l 4173          # or: python3 -m http.server 4173 -d out
 *   node scripts/screenshots.mjs
 *
 * It shoots the static export rather than the dev server so the Next.js dev
 * indicator stays out of the images.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.YLIW_BASE ?? 'http://127.0.0.1:4173';
const OUT = process.argv[2] ?? 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

/**
 * A deliberately fictional persona — these images ship in a public repo, so
 * nothing here belongs to a real person. Dates are fixed rather than relative
 * to today, so reruns differ only by the "lived" boundary advancing.
 */
const seed = {
  name: 'Alex Rivera',
  birthDate: new Date('1990-03-12T00:00:00.000Z').toISOString(),
  endAge: 90,
  quote: 'It is not that we have a short time to live, but that we waste a lot of it.',
  events: [
    ['Primary school',    '1994-09-05', '2001-07-20', '#5e7a8a', 'Book'],
    ['Secondary school',  '2001-09-03', '2008-06-27', '#51609b', 'Book'],
    ['University',        '2008-09-15', '2012-06-10', '#33718f', 'Graduation'],
    ['First job',         '2012-08-01', '2016-04-29', '#c9921e', 'Briefcase'],
    ['Moved to Lisbon',   '2016-05-16', '2016-06-10', '#8a5a3b', 'Home'],
    ['Met Sam',           '2017-02-13', '2017-02-19', '#b05a76', 'Love'],
    ['Built the company', '2018-01-08', '2021-11-26', '#c05a2e', 'Rocket'],
    ['Wedding',           '2019-06-17', '2019-06-23', '#a63d2f', 'Marriage'],
    ['Sabbatical',        '2022-01-10', '2022-08-26', '#5f8a4e', 'Mountain'],
    ['Walked the Camino', '2022-09-05', '2022-10-14', '#8a9042', 'Compass'],
    ['Maya born',         '2023-04-03', '2023-04-09', '#7c4d80', 'Baby'],
    ['Teaching again',    '2023-09-04', '2026-06-26', '#3f7d6a', 'Lightbulb'],
  ].map(([title, start, end, color, icon]) => ({
    id: `seed-${title.toLowerCase().replace(/\W+/g, '-')}`,
    title,
    startDate: new Date(`${start}T00:00:00.000Z`).toISOString(),
    endDate: new Date(`${end}T00:00:00.000Z`).toISOString(),
    color,
    icon,
    // loadUserData recomputes week numbers from the dates, so these are ignored.
    startWeekNumber: 0,
    endWeekNumber: 0,
  })),
};

const browser = await chromium.launch();
const shots = [];

async function shoot(name, { path: urlPath, theme, seeded, width = 1440, height = 940, fullPage = true, clipTo }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    colorScheme: 'light',
    reducedMotion: 'reduce', // the cards have a rise-in animation
  });
  const page = await ctx.newPage();

  // Seed before any app script runs, so the first paint is already correct
  // and the theme init script picks the theme up without a flash.
  await page.addInitScript(
    ({ data, theme, seeded }) => {
      if (seeded) localStorage.setItem('yliw-user-data', JSON.stringify(data));
      else localStorage.removeItem('yliw-user-data');
      if (theme) localStorage.setItem('yliw-theme', JSON.stringify({ theme, custom: {} }));
      else localStorage.removeItem('yliw-theme');
    },
    { data: seed, theme, seeded }
  );

  await page.goto(`${BASE}${urlPath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900); // let the webfonts settle before capture

  const file = `${OUT}/${name}.png`;
  if (clipTo) {
    // Scope to the poster card so the surrounding app chrome is excluded.
    await page.locator(clipTo).first().screenshot({ path: file });
  } else {
    await page.screenshot({ path: file, fullPage });
  }
  shots.push(name);
  await ctx.close();
}

// Narrower viewport for the first run, or the centred card swims in margin.
await shoot('setup', { path: '/', seeded: false, width: 1120, height: 1000 });
await shoot('events', { path: '/', seeded: true, fullPage: false });
await shoot('calendar', { path: '/calendar.html', seeded: true });
await shoot('poster', { path: '/calendar.html', seeded: true, clipTo: '.life-calendar-container' });
await shoot('poster-dark', { path: '/calendar.html', seeded: true, theme: 'dark', clipTo: '.life-calendar-container' });

await browser.close();
console.log(`captured ${shots.length}: ${shots.join(', ')}`);
