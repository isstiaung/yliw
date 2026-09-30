import { describe, it, expect } from 'vitest';
import { buildIcs, escapeText, foldLine, formatDate } from './ics';
import { parseLocalDate } from './dateCalculations';
import { LifeEvent } from '@/types';

const now = new Date(Date.UTC(2026, 8, 30, 12, 0, 0));

const ev = (over: Partial<LifeEvent> = {}): LifeEvent => ({
  id: 'e1', title: 'Wedding', color: '#a63d2f', icon: 'Marriage',
  startDate: parseLocalDate('2019-06-17'), endDate: parseLocalDate('2019-06-23'),
  startWeekNumber: 0, endWeekNumber: 0, ...over,
});

const ics = (events: LifeEvent[], calendarName = 'Alex Rivera') => buildIcs({ calendarName, events, now });

describe('buildIcs', () => {
  it('wraps events in a valid VCALENDAR with CRLF line endings', () => {
    const out = ics([ev()]);
    expect(out.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(out.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(out).toContain('VERSION:2.0\r\n');
    expect(out).toMatch(/PRODID:.+\r\n/);
    expect(out.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('writes all-day dates with an exclusive end', () => {
    const out = ics([ev()]);
    expect(out).toContain('DTSTART;VALUE=DATE:20190617\r\n');
    expect(out).toContain('DTEND;VALUE=DATE:20190624\r\n');
  });

  it('gives single-day milestones a one-day span', () => {
    const out = ics([ev({ endDate: parseLocalDate('2019-06-17') })]);
    expect(out).toContain('DTSTART;VALUE=DATE:20190617');
    expect(out).toContain('DTEND;VALUE=DATE:20190618');
  });

  it('crosses month and year boundaries on the exclusive end', () => {
    expect(ics([ev({ endDate: parseLocalDate('2019-12-31') })])).toContain('DTEND;VALUE=DATE:20200101');
    expect(ics([ev({ endDate: parseLocalDate('2020-02-28') })])).toContain('DTEND;VALUE=DATE:20200229');
  });

  it('uses a stable UID and a UTC DTSTAMP on every event', () => {
    const out = ics([ev(), ev({ id: 'e2' })]);
    expect(out).toContain('UID:e1@yliw');
    expect(out).toContain('UID:e2@yliw');
    expect(out.match(/DTSTAMP:20260930T120000Z/g)?.length).toBe(2);
  });

  it('emits one VEVENT per milestone and none for an empty calendar', () => {
    expect(ics([ev(), ev({ id: 'e2' }), ev({ id: 'e3' })]).match(/BEGIN:VEVENT/g)?.length).toBe(3);
    expect(ics([])).not.toContain('BEGIN:VEVENT');
  });

  it('names the calendar, escaped', () => {
    expect(ics([], 'Alex, Sam; & co')).toContain('X-WR-CALNAME:Alex\\, Sam\; & co');
  });
});

describe('escapeText', () => {
  it('escapes the four characters RFC 5545 reserves', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\;c\\\\d\\ne');
  });
  it('escapes backslashes first so they are not doubled twice', () => {
    expect(escapeText('\\,')).toBe('\\\\\\,');
  });
});

describe('foldLine', () => {
  const bytes = (s: string) => new TextEncoder().encode(s).length;

  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:Wedding')).toBe('SUMMARY:Wedding');
  });

  it('folds long lines at 75 octets with CRLF + space', () => {
    const folded = foldLine('SUMMARY:' + 'x'.repeat(200));
    const lines = folded.split('\r\n');
    expect(lines.length).toBeGreaterThan(1);
    lines.forEach(l => expect(bytes(l)).toBeLessThanOrEqual(75));
    lines.slice(1).forEach(l => expect(l.startsWith(' ')).toBe(true));
    expect(lines.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe('SUMMARY:' + 'x'.repeat(200));
  });

  it('never splits a multi-byte character', () => {
    const title = 'SUMMARY:' + '日本への旅🎌'.repeat(20);
    const lines = foldLine(title).split('\r\n');
    lines.forEach(l => {
      expect(bytes(l)).toBeLessThanOrEqual(75);
      expect(l).not.toContain('�');
    });
    expect(lines.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(title);
  });
});

describe('formatDate', () => {
  it('uses local date parts', () => {
    expect(formatDate(parseLocalDate('2024-03-10'))).toBe('20240310');
  });
});
