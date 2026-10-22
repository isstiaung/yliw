import { describe, it, expect } from 'vitest';
import { buildPosterSvg, estimateTextWidth, fileStem, truncateText, wrapText } from './posterExport';
import { generateWeekData, parseLocalDate, summarizeWeeks } from './dateCalculations';
import { UserData } from '@/types';

const birthDate = parseLocalDate('1990-03-12');

function makeUser(overrides: Partial<UserData> = {}): UserData {
  return {
    name: 'Alex Rivera',
    birthDate,
    endAge: 90,
    quote: '',
    events: [],
    ...overrides,
  };
}

const svgFor = (user: UserData) =>
  buildPosterSvg({ userData: user, weekData: generateWeekData(user.birthDate, user.endAge, user.events) });

describe('fileStem', () => {
  it.each([
    ['Alex Rivera', 'alex-rivera-in-weeks'],
    ['  Ada  Lovelace  ', 'ada-lovelace-in-weeks'],
    ["O'Brien-Smith", 'o-brien-smith-in-weeks'],
    ['日本語', 'life-in-weeks'],
    ['', 'life-in-weeks'],
  ])('turns %o into %o', (input, expected) => {
    expect(fileStem(input)).toBe(expected);
  });
});

describe('buildPosterSvg', () => {
  it('emits a well-formed root element with matching width and viewBox', () => {
    const svg = svgFor(makeUser());
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
    const width = svg.match(/width="(\d+)"/)![1];
    const height = svg.match(/height="(\d+)"/)![1];
    expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
  });

  it('draws one rect per week, plus the background and legend swatches', () => {
    const user = makeUser({ endAge: 10 });
    const rects = (svgFor(user).match(/<rect /g) ?? []).length;
    // 520 weeks + 1 background + 3 legend swatches
    expect(rects).toBe(520 + 1 + 3);
  });

  it('scales with life expectancy', () => {
    const short = (svgFor(makeUser({ endAge: 20 })).match(/<rect /g) ?? []).length;
    const long = (svgFor(makeUser({ endAge: 90 })).match(/<rect /g) ?? []).length;
    expect(long - short).toBe((90 - 20) * 52);
  });

  it('includes the name and birth date in the header', () => {
    const svg = svgFor(makeUser());
    expect(svg).toContain('Alex Rivera&apos;s Life in Weeks');
    expect(svg).toContain(birthDate.toLocaleDateString());
  });

  it('renders the quote only when there is one', () => {
    expect(svgFor(makeUser())).not.toContain('&#8220;');
    expect(svgFor(makeUser({ quote: 'Memento mori' }))).toContain('Memento mori');
  });

  it('adds a legend entry per milestone, using the event colour', () => {
    const user = makeUser({
      events: [{
        id: 'e1', title: 'University',
        startDate: parseLocalDate('2008-09-15'), endDate: parseLocalDate('2012-06-10'),
        color: '#33718f', icon: 'Graduation', startWeekNumber: 967, endWeekNumber: 1161,
      }],
    });
    const svg = svgFor(user);
    expect(svg).toContain('University');
    expect(svg).toContain('#33718f');
  });

  it('escapes XML-significant characters so the file stays parseable', () => {
    const svg = svgFor(makeUser({ name: 'A & B <script>', quote: 'He said "hi"' }));
    expect(svg).toContain('A &amp; B &lt;script&gt;');
    expect(svg).not.toMatch(/<script>/);
    expect(svg).toContain('&quot;hi&quot;');
  });

  it('reports the same lived-week count the app shows', () => {
    const user = makeUser();
    const weekData = generateWeekData(user.birthDate, user.endAge, user.events);
    const lived = weekData.filter(w => w.isPast).length;
    expect(buildPosterSvg({ userData: user, weekData })).toContain(lived.toLocaleString());
  });

  it('leaves no unescaped markup characters in the output', () => {
    // A stray & or < silently produces a file no renderer will open. Real XML
    // parsing is asserted in the browser check; this guards the common cause.
    const svg = svgFor(makeUser({ name: 'Alex & Sam', quote: 'Quote with <angle> brackets' }));

    // Every ampersand must open a character entity.
    const strayAmpersands = svg.match(/&(?!(?:[a-zA-Z]+|#\d+);)/g) ?? [];
    expect(strayAmpersands).toEqual([]);

    // No angle brackets survive inside text nodes.
    const textContent = [...svg.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(m => m[1]);
    expect(textContent.some(t => /[<>]/.test(t))).toBe(false);
    expect(textContent.join(' ')).toContain('&lt;angle&gt;');
  });
});

describe('attribute escaping', () => {
  it('escapes colours from the palette and events, even if validation is bypassed', () => {
    const evil = '"/><script>alert(1)</script><x a="';
    const user = makeUser({
      events: [{
        id: 'e', title: 't', startDate: parseLocalDate('2008-09-15'), endDate: parseLocalDate('2008-09-20'),
        color: evil, icon: 'Star', startWeekNumber: 0, endWeekNumber: 0,
      }],
    });
    const svg = buildPosterSvg({
      userData: user,
      weekData: generateWeekData(user.birthDate, user.endAge, user.events),
      palette: { paper: evil, ink: evil, muted: evil, line: evil, accent: evil, weekFuture: evil,
                 weekFutureBorder: evil, weekPast: evil, weekPastBorder: evil, weekCurrent: evil },
    });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });
});

const milestone = (over: Partial<UserData['events'][number]> = {}): UserData['events'][number] => ({
  id: 'e1', title: 'University',
  startDate: parseLocalDate('2008-09-15'), endDate: parseLocalDate('2012-06-10'),
  color: '#33718f', icon: 'Graduation', startWeekNumber: 0, endWeekNumber: 0, ...over,
});

/** Text content and x of every <text>, plus the poster width. */
const layout = (svg: string) => ({
  width: Number(svg.match(/width="(\d+)"/)![1]),
  texts: [...svg.matchAll(/<text x="([\d.]+)"[^>]*font-size="(\d+)"[^>]*>(.*?)<\/text>/g)].map(m => ({
    x: Number(m[1]), size: Number(m[2]), text: m[3],
  })),
});

describe('stats', () => {
  it('reports the same weeks remaining as the app, not counting the current week', () => {
    const user = makeUser();
    const weekData = generateWeekData(user.birthDate, user.endAge, user.events, parseLocalDate('2026-09-30'));
    const { remaining } = summarizeWeeks(weekData);
    const svg = buildPosterSvg({ userData: user, weekData });
    expect(svg).toContain(`>${remaining.toLocaleString()}</text>`);
    expect(svg).not.toContain(`>${(remaining + 1).toLocaleString()}</text>`);
  });
});

describe('age labels', () => {
  it('label row n with age n, as the tooltip does', () => {
    const svg = svgFor(makeUser());
    const labels = [...svg.matchAll(/font-size="11"[^>]*>(\d+)<\/text>/g)].map(m => Number(m[1]));
    expect(labels[0]).toBe(5);
    expect(labels.at(-1)).toBe(85);
    // Label 5 sits on the sixth row: same y as the top of row 5 plus the box.
    const label5 = svg.match(/y="([\d.]+)"[^>]*font-size="11"[^>]*>5<\/text>/)![1];
    const firstRect = svg.match(/<rect x="[\d.]+" y="([\d.]+)" width="14"/)![1];
    expect(Number(label5)).toBe(Number(firstRect) + 5 * 18 + 14 - 2);
  });
});

describe('long text', () => {
  it('wraps a long quote onto several lines that each fit', () => {
    const quote = 'The trouble is, you think you have time. '.repeat(6).trim();
    const { width, texts } = layout(svgFor(makeUser({ quote })));
    const lines = texts.filter(t => t.size === 19);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(estimateTextWidth(line.text, 19)).toBeLessThanOrEqual(width - 128);
    expect(lines[0].text.startsWith('&#8220;')).toBe(true);
    expect(lines.at(-1)!.text.endsWith('&#8221;')).toBe(true);
  });

  it('cuts a very long quote off with an ellipsis rather than growing forever', () => {
    const quote = 'word '.repeat(2000);
    const lines = layout(svgFor(makeUser({ quote }))).texts.filter(t => t.size === 19);
    expect(lines).toHaveLength(5);
    expect(lines.at(-1)!.text.endsWith('…')).toBe(true);
  });

  it('grows the poster to make room for a wrapped quote', () => {
    const height = (quote: string) => Number(svgFor(makeUser({ quote })).match(/height="(\d+)"/)![1]);
    expect(height('short '.repeat(60))).toBeGreaterThan(height('short'));
  });

  it('shrinks, then shortens, a long name so the title fits', () => {
    const title = (name: string) =>
      layout(svgFor(makeUser({ name }))).texts.find(t => t.text.endsWith('&apos;s Life in Weeks'))!;
    expect(title('Alex Rivera').size).toBe(46);
    const long = title('Alexandria Catherine Montgomery-Fitzwilliam');
    expect(long.size).toBeLessThan(46);
    expect(long.text).toContain('Alexandria Catherine Montgomery-Fitzwilliam');
    const absurd = title('Name '.repeat(40).trim());
    expect(absurd.size).toBe(28);
    expect(absurd.text).toContain('…&apos;s Life in Weeks');
  });

  it('shortens legend titles to their column', () => {
    const title = 'A very long milestone title that would run into the next column';
    const svg = svgFor(makeUser({ events: [milestone({ title })] }));
    expect(svg).not.toContain(title);
    expect(svg).toMatch(/>A very long [^<]*…<\/text>/);
  });
});

describe('text helpers', () => {
  it('counts CJK and emoji as wider than Latin letters', () => {
    expect(estimateTextWidth('日本', 10)).toBeGreaterThan(estimateTextWidth('ab', 10));
    expect(estimateTextWidth('🎌', 10)).toBe(10);
  });

  it('leaves text that fits alone and cuts what does not', () => {
    expect(truncateText('short', 10, 100)).toBe('short');
    expect(truncateText('a much longer piece of text', 10, 60)).toMatch(/…$/);
  });

  it('keeps line breaks, and breaks unspaced text anywhere', () => {
    expect(wrapText('one\ntwo', 10, 500, 5)).toEqual(['one', 'two']);
    const lines = wrapText('日本語'.repeat(10), 10, 50, 10);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every(line => estimateTextWidth(line, 10) <= 50)).toBe(true);
    expect(lines.join('')).toBe('日本語'.repeat(10));
  });

  it('terminates even when one character is wider than the line', () => {
    expect(wrapText('日', 10, 5, 3)).toEqual(['日']);
  });
});

describe('milestone icons', () => {
  it('defines each icon once and draws it in every square the milestone owns', () => {
    const user = makeUser({ events: [milestone()] });
    const weekData = generateWeekData(user.birthDate, user.endAge, user.events);
    const owned = weekData.filter(w => w.event).length;
    const svg = buildPosterSvg({ userData: user, weekData });
    expect(svg.match(/<symbol /g)).toHaveLength(1);
    expect(svg.match(/<use xlink:href="#icon-0"/g)).toHaveLength(owned);
    expect(svg).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
  });

  it('shares one symbol between milestones with the same icon', () => {
    const user = makeUser({
      events: [milestone(), milestone({ id: 'e2', title: 'Masters', startDate: parseLocalDate('2013-09-15'), endDate: parseLocalDate('2014-06-10') })],
    });
    expect(svgFor(user).match(/<symbol /g)).toHaveLength(1);
  });

  it('draws nothing for an unknown icon, and no defs without milestones', () => {
    expect(svgFor(makeUser({ events: [milestone({ icon: 'Nope' })] }))).not.toContain('<use');
    expect(svgFor(makeUser())).not.toContain('<defs>');
  });
});
