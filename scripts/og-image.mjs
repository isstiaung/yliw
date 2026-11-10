/**
 * Renders public/og-image.png (1200 × 630), the link-preview image every
 * page points to (see OG_IMAGE in src/utils/site.ts).
 *
 *   npx playwright install chromium   # once
 *   node scripts/og-image.mjs
 *
 * The card is the poster in miniature: a full 52 × 90 grid for a fictional
 * life, beside the title. Fonts load from Google Fonts while the script runs;
 * the PNG it writes is committed, so the site itself makes no such request.
 */
import { chromium } from '@playwright/test';

const OUT = new URL('../public/og-image.png', import.meta.url).pathname;
// The domain printed on the card; a fork sets SITE_URL, as for the build.
const DOMAIN = new URL(process.env.SITE_URL ?? 'https://yliw.isstiaung.me').host;

// Warm preset, matching src/app/globals.css.
const C = {
  paper: '#f7f0e1', surface: '#fffcf4', ink: '#211a12', muted: '#83705c', line: '#e6dbc4',
  accent: '#b5501d', future: '#eadfc6', futureBorder: '#dcceae', past: '#2c2317',
};

// A fictional life, as week ranges: [first week, last week, colour].
const LIVED = 1900;
const MILESTONES = [
  [234, 591, '#5e7a8a'],   // primary school
  [598, 952, '#51609b'],   // secondary school
  [963, 1157, '#33718f'],  // university
  [1165, 1359, '#c9921e'], // first job
  [1448, 1650, '#c05a2e'], // built a company
  [1522, 1523, '#a63d2f'], // wedding
  [1656, 1688, '#5f8a4e'], // sabbatical
  [1742, 1888, '#3f7d6a'], // teaching
];

const cellColour = week => {
  if (week === LIVED + 1) return [C.accent, C.accent];
  const owners = MILESTONES.filter(([from, to]) => week >= from && week <= to);
  if (owners.length) {
    const [, , colour] = owners.reduce((a, b) => (b[1] - b[0] < a[1] - a[0] ? b : a));
    return [colour, colour];
  }
  return week <= LIVED ? [C.past, C.past] : [C.future, C.futureBorder];
};

const cells = Array.from({ length: 52 * 90 }, (_, i) => {
  const [fill, border] = cellColour(i + 1);
  return `<i style="background:${fill};border-color:${border}"></i>`;
}).join('');

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Geist:wght@400&family=Geist+Mono:wght@500&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden; display: flex; align-items: center;
    gap: 64px; padding: 0 80px; color: ${C.ink}; font-family: Geist, system-ui, sans-serif;
    background:
      radial-gradient(1100px 500px at 30% -160px, rgba(214, 156, 68, 0.16), transparent 70%),
      radial-gradient(circle at 1px 1px, rgba(72, 50, 25, 0.05) 1px, transparent 0) ${C.paper};
    background-size: 100% 100%, 22px 22px;
  }
  .copy { flex: 1; }
  .kicker { font: 500 18px 'Geist Mono', monospace; letter-spacing: 0.24em; color: ${C.accent}; }
  h1 { font: 500 96px/1.0 Fraunces, Georgia, serif; letter-spacing: -0.02em; margin: 22px 0 26px; }
  p { font-size: 27px; line-height: 1.4; color: ${C.muted}; max-width: 560px; }
  .domain { margin-top: 40px; font: 500 20px 'Geist Mono', monospace; color: ${C.ink}; }
  .card {
    background: ${C.surface}; border: 1px solid ${C.line}; border-radius: 14px; padding: 22px;
    box-shadow: 0 1px 2px rgba(92, 61, 26, 0.05), 0 18px 48px -18px rgba(92, 61, 26, 0.3);
  }
  .grid { display: grid; grid-template-columns: repeat(52, 4.6px); grid-auto-rows: 4.6px; gap: 1.2px; }
  .grid i { display: block; border: 0.6px solid; border-radius: 0.8px; }
</style></head>
<body>
  <div class="copy">
    <div class="kicker">MEMENTO MORI</div>
    <h1>Your Life<br>in Weeks</h1>
    <p>One square for every week of your life. Mark what mattered, print it for the wall — it never leaves your device.</p>
    <div class="domain">${DOMAIN}</div>
  </div>
  <div class="card"><div class="grid">${cells}</div></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT, type: 'png' });
await browser.close();
console.log(`wrote ${OUT}`);
