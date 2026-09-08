import { describe, it, expect } from 'vitest';
import { buildPosterSvg, fileStem } from './posterExport';
import { generateWeekData, parseLocalDate } from './dateCalculations';
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
