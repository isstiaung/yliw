import { UserData, WeekData } from '@/types';
import { getAgeFromWeek } from './dateCalculations';

/**
 * Poster export.
 *
 * The SVG is built from the week data rather than by screenshotting the DOM.
 * That keeps it a real vector — crisp at any print size, and a fraction of the
 * bytes of a bitmap — and avoids pulling in a rasteriser like html2canvas,
 * which would be a large dependency for something the data can already
 * describe. PNG is produced by rasterising that same SVG on a canvas, so the
 * two exports can never drift apart.
 */

const WEEKS_PER_ROW = 52;

interface Geometry {
  box: number;
  gap: number;
  padding: number;
  labelGutter: number;
}

const GEOMETRY: Geometry = { box: 14, gap: 4, padding: 64, labelGutter: 44 };

/** Theme colours live in CSS variables; the export has to resolve them. */
export interface PosterPalette {
  paper: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  weekFuture: string;
  weekFutureBorder: string;
  weekPast: string;
  weekPastBorder: string;
  weekCurrent: string;
}

const FALLBACK: PosterPalette = {
  paper: '#f7f0e1', ink: '#211a12', muted: '#6f6353', line: '#e0d5bf', accent: '#b5501d',
  weekFuture: '#efe6d2', weekFutureBorder: '#d9cdb4', weekPast: '#211a12',
  weekPastBorder: '#211a12', weekCurrent: '#b5501d',
};

export function readPalette(): PosterPalette {
  if (typeof document === 'undefined') return FALLBACK;
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    paper: read('--paper', FALLBACK.paper),
    ink: read('--ink', FALLBACK.ink),
    muted: read('--muted', FALLBACK.muted),
    line: read('--line', FALLBACK.line),
    accent: read('--accent', FALLBACK.accent),
    weekFuture: read('--week-future', FALLBACK.weekFuture),
    weekFutureBorder: read('--week-future-border', FALLBACK.weekFutureBorder),
    weekPast: read('--week-past', FALLBACK.weekPast),
    weekPastBorder: read('--week-past-border', FALLBACK.weekPastBorder),
    weekCurrent: read('--week-current', FALLBACK.weekCurrent),
  };
}

const escapeXml = (value: string): string =>
  value.replace(/[<>&'"]/g, ch =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[ch]!)
  );

function weekFill(week: WeekData, palette: PosterPalette): [string, string] {
  if (week.event) return [week.event.color, week.event.color];
  if (week.isCurrent) return [palette.weekCurrent, palette.weekCurrent];
  if (week.isPast) return [palette.weekPast, palette.weekPastBorder];
  return [palette.weekFuture, palette.weekFutureBorder];
}

export interface PosterOptions {
  userData: UserData;
  weekData: WeekData[];
  palette?: PosterPalette;
}

export function buildPosterSvg({ userData, weekData, palette = FALLBACK }: PosterOptions): string {
  const { box, gap, padding, labelGutter } = GEOMETRY;
  const step = box + gap;
  const rows = Math.ceil(weekData.length / WEEKS_PER_ROW);

  const gridWidth = WEEKS_PER_ROW * step - gap;
  const gridLeft = padding + labelGutter;

  const headerHeight = 132;
  const legendRows = Math.ceil((userData.events.length + 3) / 4);
  const legendHeight = legendRows * 26 + 16;
  const gridTop = padding + headerHeight + legendHeight;
  const gridHeight = rows * step - gap;

  const footerHeight = userData.quote ? 150 : 110;
  const width = gridLeft + gridWidth + padding;
  const height = gridTop + gridHeight + footerHeight;

  const weeksLived = weekData.filter(w => w.isPast).length;
  const pctLived = Math.round((weeksLived / weekData.length) * 100);

  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(userData.name)}'s life in weeks">`
  );
  parts.push(
    `<title>${escapeXml(userData.name)}&apos;s Life in Weeks</title>`,
    `<rect width="${width}" height="${height}" fill="${palette.paper}"/>`
  );

  // Header
  const centre = width / 2;
  parts.push(
    `<text x="${centre}" y="${padding + 22}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="15" letter-spacing="4" fill="${palette.accent}">MEMENTO MORI</text>`,
    `<text x="${centre}" y="${padding + 74}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="${palette.ink}">${escapeXml(userData.name)}&apos;s Life in Weeks</text>`,
    `<text x="${centre}" y="${padding + 106}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" fill="${palette.muted}">Born ${escapeXml(userData.birthDate.toLocaleDateString())} · each square is one week</text>`
  );

  // Legend — the fixed states, then one entry per milestone.
  const legend: Array<[string, string]> = [
    [palette.weekFuture, 'Future'],
    [palette.weekPast, 'Lived'],
    [palette.weekCurrent, 'This week'],
    ...userData.events.map(e => [e.color, e.title] as [string, string]),
  ];
  const columnWidth = (gridWidth + labelGutter) / 4;
  legend.forEach(([color, label], index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = padding + col * columnWidth;
    const y = padding + headerHeight + row * 26;
    parts.push(
      `<rect x="${x}" y="${y}" width="12" height="12" rx="2" fill="${color}" stroke="${palette.line}"/>`,
      `<text x="${x + 19}" y="${y + 11}" font-family="system-ui, sans-serif" font-size="13" fill="${palette.ink}">${escapeXml(label)}</text>`
    );
  });

  // Age labels every five years, aligned to their row.
  for (let row = 0; row < rows; row++) {
    const year = row + 1;
    if (year % 5 !== 0) continue;
    parts.push(
      `<text x="${gridLeft - 12}" y="${gridTop + row * step + box - 2}" text-anchor="end" font-family="ui-monospace, monospace" font-size="11" fill="${palette.muted}">${year}</text>`
    );
  }

  // The grid. Squares are emitted individually; a 90-year poster is 4,680
  // rects, which every renderer handles fine and keeps the file honest.
  for (const week of weekData) {
    const index = week.weekNumber - 1;
    const col = index % WEEKS_PER_ROW;
    const row = Math.floor(index / WEEKS_PER_ROW);
    const [fill, stroke] = weekFill(week, palette);
    parts.push(
      `<rect x="${gridLeft + col * step}" y="${gridTop + row * step}" width="${box}" height="${box}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`
    );
    if (week.isCurrent && !week.event) {
      parts.push(
        `<circle cx="${gridLeft + col * step + box / 2}" cy="${gridTop + row * step + box / 2}" r="${box * 0.16}" fill="#ffffff"/>`
      );
    }
  }

  // Footer: optional quote, then the same four stats the app shows.
  let footerY = gridTop + gridHeight + 46;
  if (userData.quote) {
    parts.push(
      `<line x1="${padding}" y1="${footerY - 26}" x2="${width - padding}" y2="${footerY - 26}" stroke="${palette.line}"/>`,
      `<text x="${centre}" y="${footerY}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="19" fill="${palette.ink}">&#8220;${escapeXml(userData.quote)}&#8221;</text>`
    );
    footerY += 46;
  }

  const stats: Array<[string, string]> = [
    [weeksLived.toLocaleString(), 'WEEKS LIVED'],
    [(weekData.length - weeksLived).toLocaleString(), 'WEEKS REMAINING'],
    [`${pctLived}%`, 'LIFE LIVED'],
    [userData.events.length.toLocaleString(), 'MILESTONES'],
  ];
  parts.push(
    `<line x1="${padding}" y1="${footerY - 18}" x2="${width - padding}" y2="${footerY - 18}" stroke="${palette.line}"/>`
  );
  stats.forEach(([value, label], index) => {
    const x = padding + (index + 0.5) * ((width - padding * 2) / 4);
    parts.push(
      `<text x="${x}" y="${footerY + 22}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="${palette.ink}">${escapeXml(value)}</text>`,
      `<text x="${x}" y="${footerY + 42}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="10" letter-spacing="2" fill="${palette.muted}">${label}</text>`
    );
  });

  parts.push('</svg>');
  return parts.join('\n');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function fileStem(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug || 'life'}-in-weeks`;
}

export function downloadPosterSvg(options: PosterOptions): void {
  const svg = buildPosterSvg(options);
  triggerDownload(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${fileStem(options.userData.name)}.svg`);
}

/**
 * Rasterise the SVG through a canvas. Everything is inline and same-origin —
 * no external images or fonts are referenced — so the canvas stays untainted
 * and toBlob is allowed.
 */
export async function downloadPosterPng(options: PosterOptions, scale = 2): Promise<void> {
  const svg = buildPosterSvg(options);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not render the poster image.'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable in this browser.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not encode the PNG.');
    triggerDownload(blob, `${fileStem(options.userData.name)}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
