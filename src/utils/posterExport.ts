import { UserData, WeekData } from '@/types';
import { isLabelledAge, summarizeWeeks } from './dateCalculations';
import { getIconShape, SvgNode } from './icons';

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

/* ---- text layout --------------------------------------------------------
   SVG text never wraps or shrinks to fit, and there is no DOM here to
   measure it with, so widths are estimated: about 0.55em a character for
   Latin text and a full em for CJK and emoji. Deliberately generous — a
   little slack on the line is fine, text running off the poster is not. */

const WIDE_CHAR =
  /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]|\p{Extended_Pictographic}/u;

export function estimateTextWidth(text: string, fontSize: number): number {
  let ems = 0;
  for (const char of text) ems += WIDE_CHAR.test(char) ? 1 : 0.55;
  return ems * fontSize;
}

/** Shorten text to fit a width, ending in an ellipsis when anything is cut. */
export function truncateText(text: string, fontSize: number, maxWidth: number): string {
  if (estimateTextWidth(text, fontSize) <= maxWidth) return text;
  const chars = Array.from(text);
  while (chars.length > 0 && estimateTextWidth(`${chars.join('')}…`, fontSize) > maxWidth) chars.pop();
  return `${chars.join('').trimEnd()}…`;
}

/**
 * Greedy word wrap into at most `maxLines`, the last one cut with an ellipsis
 * if the text runs longer. Line breaks in the text are kept, and a word too
 * long for a line — or unspaced text such as Japanese — breaks anywhere.
 */
export function wrapText(text: string, fontSize: number, maxWidth: number, maxLines: number): string[] {
  const fits = (value: string) => estimateTextWidth(value, fontSize) <= maxWidth;
  const lines: string[] = [];

  for (const paragraph of text.split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (fits(candidate)) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      let rest = Array.from(word);
      while (!fits(rest.join(''))) {
        let take = Math.max(1, rest.length - 1);
        while (take > 1 && !fits(rest.slice(0, take).join(''))) take--;
        lines.push(rest.slice(0, take).join(''));
        rest = rest.slice(take);
      }
      line = rest.join('');
    }
    if (line) lines.push(line);
  }

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncateText(`${kept[maxLines - 1]} ${lines[maxLines]}`, fontSize, maxWidth);
  return kept;
}

/* ---- icons -------------------------------------------------------------- */

const SAFE_NAME = /^[a-zA-Z][\w:-]*$/;

function serializeNode(node: SvgNode): string {
  if (!SAFE_NAME.test(node.tag)) return '';
  const attrs = Object.entries(node.attrs)
    .filter(([name]) => SAFE_NAME.test(name))
    .map(([name, value]) => ` ${name}="${escapeXml(value)}"`)
    .join('');
  return `<${node.tag}${attrs}>${node.children.map(serializeNode).join('')}</${node.tag}>`;
}

/** Same proportion as the icons in the on-screen squares (WeekBox). */
const ICON_SCALE = 0.72;

const TITLE_SIZE = 46;
const MIN_TITLE_SIZE = 28;
const LEGEND_SIZE = 13;
const QUOTE_SIZE = 19;
const QUOTE_LINE_HEIGHT = 28;
const MAX_QUOTE_LINES = 5;

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

  const width = gridLeft + gridWidth + padding;
  const textWidth = width - padding * 2;

  // Curly quotes go in before wrapping so they are measured with the words.
  const quoteLines = userData.quote
    ? wrapText(`\u201c${userData.quote}\u201d`, QUOTE_SIZE, textWidth, MAX_QUOTE_LINES)
    : [];
  const footerHeight = quoteLines.length ? 150 + (quoteLines.length - 1) * QUOTE_LINE_HEIGHT : 110;
  const height = gridTop + gridHeight + footerHeight;

  const { lived: weeksLived, remaining: weeksRemaining, percentLived: pctLived } = summarizeWeeks(weekData);

  // A long name shrinks the title before it is shortened.
  const titleSuffix = "'s Life in Weeks";
  const naturalTitle = estimateTextWidth(userData.name + titleSuffix, TITLE_SIZE);
  const titleSize =
    naturalTitle > textWidth ? Math.max(MIN_TITLE_SIZE, Math.floor((TITLE_SIZE * textWidth) / naturalTitle)) : TITLE_SIZE;
  const titleName = truncateText(userData.name, titleSize, textWidth - estimateTextWidth(titleSuffix, titleSize));

  // One <symbol> per icon in use, drawn into every square with <use>: a
  // four-year job is 200-odd squares, and repeating the path data in each
  // would multiply the file size for nothing.
  const iconIds = new Map<string, string>();
  const symbols: string[] = [];
  for (const { icon } of userData.events) {
    if (iconIds.has(icon)) continue;
    const shape = getIconShape(icon);
    if (!shape) continue;
    const id = `icon-${iconIds.size}`;
    iconIds.set(icon, id);
    symbols.push(
      `<symbol id="${id}" viewBox="${escapeXml(shape.viewBox)}">${shape.nodes.map(serializeNode).join('')}</symbol>`
    );
  }

  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(userData.name)}'s life in weeks">`
  );
  parts.push(
    `<title>${escapeXml(userData.name)}&apos;s Life in Weeks</title>`,
    `<rect width="${width}" height="${height}" fill="${escapeXml(palette.paper)}"/>`
  );
  if (symbols.length) parts.push(`<defs>${symbols.join('')}</defs>`);

  // Header
  const centre = width / 2;
  parts.push(
    `<text x="${centre}" y="${padding + 22}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="15" letter-spacing="4" fill="${escapeXml(palette.accent)}">MEMENTO MORI</text>`,
    `<text x="${centre}" y="${padding + 74}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" fill="${escapeXml(palette.ink)}">${escapeXml(titleName)}&apos;s Life in Weeks</text>`,
    `<text x="${centre}" y="${padding + 106}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" fill="${escapeXml(palette.muted)}">Born ${escapeXml(userData.birthDate.toLocaleDateString())} · each square is one week</text>`
  );

  // Legend — the fixed states, then one entry per milestone.
  const legend: Array<[string, string]> = [
    [palette.weekFuture, 'Future'],
    [palette.weekPast, 'Lived'],
    [palette.weekCurrent, 'This week'],
    ...userData.events.map(e => [e.color, e.title] as [string, string]),
  ];
  const columnWidth = (gridWidth + labelGutter) / 4;
  const labelWidth = columnWidth - 19 - 12;
  legend.forEach(([color, label], index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = padding + col * columnWidth;
    const y = padding + headerHeight + row * 26;
    parts.push(
      `<rect x="${x}" y="${y}" width="12" height="12" rx="2" fill="${escapeXml(color)}" stroke="${escapeXml(palette.line)}"/>`,
      `<text x="${x + 19}" y="${y + 11}" font-family="system-ui, sans-serif" font-size="${LEGEND_SIZE}" fill="${escapeXml(palette.ink)}">${escapeXml(truncateText(label, LEGEND_SIZE, labelWidth))}</text>`
    );
  });

  // Age labels every five years, aligned to their row. Row n is age n.
  for (let age = 0; age < rows; age++) {
    if (!isLabelledAge(age)) continue;
    parts.push(
      `<text x="${gridLeft - 12}" y="${gridTop + age * step + box - 2}" text-anchor="end" font-family="ui-monospace, monospace" font-size="11" fill="${escapeXml(palette.muted)}">${age}</text>`
    );
  }

  // The grid. Squares are emitted individually; a 90-year poster is 4,680
  // rects, which every renderer handles fine and keeps the file honest.
  const iconSize = box * ICON_SCALE;
  const iconInset = (box - iconSize) / 2;
  for (const week of weekData) {
    const index = week.weekNumber - 1;
    const x = gridLeft + (index % WEEKS_PER_ROW) * step;
    const y = gridTop + Math.floor(index / WEEKS_PER_ROW) * step;
    const [fill, stroke] = weekFill(week, palette);
    parts.push(
      `<rect x="${x}" y="${y}" width="${box}" height="${box}" rx="2" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="1"/>`
    );
    const iconId = week.event && iconIds.get(week.event.icon);
    if (iconId) {
      parts.push(
        `<use xlink:href="#${iconId}" x="${x + iconInset}" y="${y + iconInset}" width="${iconSize}" height="${iconSize}" fill="#ffffff" fill-opacity="0.85"/>`
      );
    } else if (week.isCurrent && !week.event) {
      parts.push(
        `<circle cx="${x + box / 2}" cy="${y + box / 2}" r="${box * 0.16}" fill="#ffffff"/>`
      );
    }
  }

  // Footer: optional quote, then the same four stats the app shows.
  let footerY = gridTop + gridHeight + 46;
  if (quoteLines.length) {
    parts.push(
      `<line x1="${padding}" y1="${footerY - 26}" x2="${width - padding}" y2="${footerY - 26}" stroke="${escapeXml(palette.line)}"/>`
    );
    quoteLines.forEach((line, i) => {
      const text = escapeXml(line).replace(/\u201c/g, '&#8220;').replace(/\u201d/g, '&#8221;');
      parts.push(
        `<text x="${centre}" y="${footerY + i * QUOTE_LINE_HEIGHT}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="${QUOTE_SIZE}" fill="${escapeXml(palette.ink)}">${text}</text>`
      );
    });
    footerY += 46 + (quoteLines.length - 1) * QUOTE_LINE_HEIGHT;
  }

  const stats: Array<[string, string]> = [
    [weeksLived.toLocaleString(), 'WEEKS LIVED'],
    [weeksRemaining.toLocaleString(), 'WEEKS REMAINING'],
    [`${pctLived}%`, 'LIFE LIVED'],
    [userData.events.length.toLocaleString(), 'MILESTONES'],
  ];
  parts.push(
    `<line x1="${padding}" y1="${footerY - 18}" x2="${width - padding}" y2="${footerY - 18}" stroke="${escapeXml(palette.line)}"/>`
  );
  stats.forEach(([value, label], index) => {
    const x = padding + (index + 0.5) * ((width - padding * 2) / 4);
    parts.push(
      `<text x="${x}" y="${footerY + 22}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="${escapeXml(palette.ink)}">${escapeXml(value)}</text>`,
      `<text x="${x}" y="${footerY + 42}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="10" letter-spacing="2" fill="${escapeXml(palette.muted)}">${label}</text>`
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
