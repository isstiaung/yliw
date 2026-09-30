/**
 * Renders the PWA icons in public/icons/ from src/app/icon.svg.
 *
 *   npx playwright install chromium   # once
 *   node scripts/icons.mjs
 *
 * "any" icons are the tile as designed. The maskable icon is full-bleed paper
 * with the grid inside the central 80% safe zone, because Android crops
 * maskable icons to circles, squircles and so on — the rounded tile would
 * otherwise get its corners clipped or sit inside a second shape.
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../src/app/icon.svg', import.meta.url), 'utf8');
// Keep only the grid: strip the <svg> wrapper and the first (self-closing) <rect>, the rounded tile.
const inner = svg
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<rect[^>]*\/>/, '');
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#f7f0e1"/>
  <g transform="translate(6.4 6.4) scale(0.8)">${inner}</g>
</svg>`;

const jobs = [
  ['icon-192.png', 192, svg],
  ['icon-512.png', 512, svg],
  ['icon-maskable-512.png', 512, maskable],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, source] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${source}`
  );
  await page.locator('body > svg').screenshot({ path: `public/icons/${name}`, omitBackground: true });
}
await browser.close();
console.log(`rendered ${jobs.length} icons`);
