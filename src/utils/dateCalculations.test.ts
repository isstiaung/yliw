import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseLocalDate,
  formatDateForInput,
  calculateWeekNumber,
  calculateTotalWeeks,
  getWeekDate,
  generateWeekData,
  mapDateRangeToWeeks,
  getAgeFromWeek,
} from './dateCalculations';
import { LifeEvent } from '@/types';

afterEach(() => vi.useRealTimers());

/** Build a LifeEvent without repeating the boilerplate in every test. */
function event(start: string, end: string, birth: string): LifeEvent {
  const range = mapDateRangeToWeeks(parseLocalDate(birth), parseLocalDate(start), parseLocalDate(end));
  return {
    id: 'e1',
    title: 'Test',
    startDate: parseLocalDate(start),
    endDate: parseLocalDate(end),
    color: '#000000',
    icon: 'Star',
    startWeekNumber: range.startWeek,
    endWeekNumber: range.endWeek,
  };
}

describe('parseLocalDate', () => {
  it('reads YYYY-MM-DD as a local date, not UTC midnight', () => {
    // The whole reason this helper exists: `new Date('2020-03-12')` is UTC
    // midnight, which is the *previous* day for anyone behind UTC.
    const d = parseLocalDate('2020-03-12');
    expect(d.getFullYear()).toBe(2020);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(12);
  });

  it('round-trips through formatDateForInput', () => {
    for (const value of ['1990-01-01', '2000-02-29', '2024-12-31']) {
      expect(formatDateForInput(parseLocalDate(value))).toBe(value);
    }
  });

  it('does not drift across a DST boundary', () => {
    // US DST starts 2024-03-10; a UTC-based parse can land on the 9th.
    expect(formatDateForInput(parseLocalDate('2024-03-10'))).toBe('2024-03-10');
    expect(formatDateForInput(parseLocalDate('2024-11-03'))).toBe('2024-11-03');
  });
});

describe('calculateWeekNumber', () => {
  const birth = parseLocalDate('1990-03-12'); // a Monday

  it('counts the birth week as week 1', () => {
    expect(calculateWeekNumber(birth, birth)).toBe(1);
  });

  it('counts from the Monday of the birth week, not the birthday', () => {
    // 1990-03-12 is a Monday, so the Sunday after is still week 1.
    expect(calculateWeekNumber(birth, parseLocalDate('1990-03-18'))).toBe(1);
    expect(calculateWeekNumber(birth, parseLocalDate('1990-03-19'))).toBe(2);
  });

  it('handles a birth date mid-week by anchoring to that Monday', () => {
    const thursday = parseLocalDate('1990-03-15');
    // Week 1 is the Mon-Sun block containing the birthday.
    expect(calculateWeekNumber(thursday, parseLocalDate('1990-03-12'))).toBe(1);
    expect(calculateWeekNumber(thursday, parseLocalDate('1990-03-19'))).toBe(2);
  });
});

describe('calculateTotalWeeks', () => {
  it('uses a flat 52 weeks per year', () => {
    expect(calculateTotalWeeks(90)).toBe(4680);
    expect(calculateTotalWeeks(1)).toBe(52);
  });
});

describe('getWeekDate', () => {
  it('is the inverse of calculateWeekNumber', () => {
    const birth = parseLocalDate('1990-03-12');
    for (const week of [1, 2, 52, 100, 2000]) {
      expect(calculateWeekNumber(birth, getWeekDate(birth, week))).toBe(week);
    }
  });
});

describe('getAgeFromWeek', () => {
  it('maps weeks 1-52 to age 0 and 53-104 to age 1', () => {
    expect(getAgeFromWeek(1)).toBe(0);
    expect(getAgeFromWeek(52)).toBe(0);
    expect(getAgeFromWeek(53)).toBe(1);
    expect(getAgeFromWeek(104)).toBe(1);
    expect(getAgeFromWeek(105)).toBe(2);
  });
});

describe('generateWeekData', () => {
  const birth = parseLocalDate('1990-03-12');

  it('produces exactly endAge * 52 weeks', () => {
    expect(generateWeekData(birth, 90, []).length).toBe(4680);
    expect(generateWeekData(birth, 20, []).length).toBe(1040);
  });

  it('marks exactly one week as current', () => {
    vi.useFakeTimers();
    vi.setSystemTime(parseLocalDate('2026-08-10'));
    const weeks = generateWeekData(birth, 90, []);
    expect(weeks.filter(w => w.isCurrent).length).toBe(1);
  });

  it('never marks a week as both past and current', () => {
    vi.useFakeTimers();
    vi.setSystemTime(parseLocalDate('2026-08-10'));
    const weeks = generateWeekData(birth, 90, []);
    expect(weeks.filter(w => w.isPast && w.isCurrent).length).toBe(0);
  });

  it('splits every week into exactly one of past, current, or future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(parseLocalDate('2026-08-10'));
    const weeks = generateWeekData(birth, 90, []);
    const past = weeks.filter(w => w.isPast).length;
    const current = weeks.filter(w => w.isCurrent).length;
    const future = weeks.filter(w => !w.isPast && !w.isCurrent).length;
    expect(past + current + future).toBe(weeks.length);
  });

  it('attaches an event to every week it spans, inclusive of both ends', () => {
    const e = event('2008-09-15', '2008-10-12', '1990-03-12');
    const weeks = generateWeekData(birth, 90, [e]);
    const tagged = weeks.filter(w => w.event?.id === 'e1');
    expect(tagged.length).toBe(e.endWeekNumber - e.startWeekNumber + 1);
    expect(tagged[0].weekNumber).toBe(e.startWeekNumber);
    expect(tagged[tagged.length - 1].weekNumber).toBe(e.endWeekNumber);
  });

  it('gives a single-day event exactly one week', () => {
    const e = event('2019-06-17', '2019-06-17', '1990-03-12');
    const weeks = generateWeekData(birth, 90, [e]);
    expect(weeks.filter(w => w.event?.id === 'e1').length).toBe(1);
  });

  it('lets the first matching event win when two overlap', () => {
    const first = { ...event('2010-01-04', '2010-12-27', '1990-03-12'), id: 'first' };
    const second = { ...event('2010-06-07', '2011-06-06', '1990-03-12'), id: 'second' };
    const weeks = generateWeekData(birth, 90, [first, second]);
    const overlap = weeks.find(w => w.weekNumber === second.startWeekNumber);
    // Documents current behaviour: events.find() short-circuits on the first.
    expect(overlap?.event?.id).toBe('first');
  });

  it('numbers years so that week 52 is year 1 and week 53 is year 2', () => {
    const weeks = generateWeekData(birth, 90, []);
    expect(weeks[51].year).toBe(1);
    expect(weeks[52].year).toBe(2);
    expect(weeks[51].weekInYear).toBe(52);
    expect(weeks[52].weekInYear).toBe(1);
  });
});
