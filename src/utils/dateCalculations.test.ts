import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseLocalDate,
  formatDateForInput,
  calculateWeekNumber,
  calculateTotalWeeks,
  getWeekDate,
  getWeekEndDate,
  ageAt,
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
  const birth = parseLocalDate('1990-03-12');

  it('counts the day of birth as week 1', () => {
    expect(calculateWeekNumber(birth, birth)).toBe(1);
  });

  it('starts week 2 exactly seven days after birth, whatever the weekday', () => {
    expect(calculateWeekNumber(birth, parseLocalDate('1990-03-18'))).toBe(1);
    expect(calculateWeekNumber(birth, parseLocalDate('1990-03-19'))).toBe(2);
    const thursday = parseLocalDate('1990-03-15');
    expect(calculateWeekNumber(thursday, parseLocalDate('1990-03-21'))).toBe(1);
    expect(calculateWeekNumber(thursday, parseLocalDate('1990-03-22'))).toBe(2);
  });

  it('ignores the time of day', () => {
    const late = new Date(1990, 2, 18, 23, 59);
    expect(calculateWeekNumber(birth, late)).toBe(1);
  });
});

describe('birthday-anchored rows (no drift)', () => {
  const birth = parseLocalDate('1990-03-12');

  it('starts every row exactly on a birthday, all the way to 90', () => {
    // The old flat 52-weeks-per-year count drifted ~1.25 days per row; by row
    // 90 the "age 89" row began about three months late.
    for (let age = 0; age < 90; age++) {
      const birthday = parseLocalDate(`${1990 + age}-03-12`);
      expect(calculateWeekNumber(birth, birthday)).toBe(age * 52 + 1);
      expect(getWeekDate(birth, age * 52 + 1)).toEqual(birthday);
    }
  });

  it('puts the day before a birthday in the last cell of the previous row', () => {
    expect(calculateWeekNumber(birth, parseLocalDate('2026-03-11'))).toBe(36 * 52);
    expect(calculateWeekNumber(birth, parseLocalDate('2026-03-12'))).toBe(36 * 52 + 1);
  });

  it('lets the last cell of a year absorb the extra one or two days', () => {
    // 1991-03-12 to 1992-03-11 is 366 days (leap year): cell 52 is 9 days.
    const last = 52;
    expect(getWeekDate(birth, last)).toEqual(parseLocalDate('1991-03-04'));
    expect(getWeekEndDate(birth, last)).toEqual(parseLocalDate('1991-03-11'));
    const leapLast = 104;
    expect(getWeekDate(birth, leapLast)).toEqual(parseLocalDate('1992-03-03'));
    expect(getWeekEndDate(birth, leapLast)).toEqual(parseLocalDate('1992-03-11'));
  });

  it('maps every day to exactly one cell with no gaps or reversals', () => {
    let previous = 1;
    // 1990-03-12 to 1996-03-12 is 2,192 days: 1992 and 1996 are leap years.
    for (let day = 0; day <= 365 * 6 + 2; day++) {
      const date = new Date(1990, 2, 12 + day);
      const week = calculateWeekNumber(birth, date);
      expect(week === previous || week === previous + 1).toBe(true);
      previous = week;
    }
    expect(previous).toBe(6 * 52 + 1);
  });

  it('agrees with ageAt on every birthday, including 29 February births', () => {
    const leapling = parseLocalDate('2000-02-29');
    // date-fns clamps to 28 Feb in common years; the grid must follow suit.
    expect(ageAt(leapling, parseLocalDate('2001-02-27'))).toBe(0);
    expect(ageAt(leapling, parseLocalDate('2001-02-28'))).toBe(1);
    expect(calculateWeekNumber(leapling, parseLocalDate('2001-02-28'))).toBe(53);
    expect(ageAt(leapling, parseLocalDate('2004-02-29'))).toBe(4);
    expect(calculateWeekNumber(leapling, parseLocalDate('2004-02-29'))).toBe(4 * 52 + 1);
  });

  it('reports the true age for every cell', () => {
    for (const week of [1, 52, 53, 1904, 4680]) {
      expect(ageAt(birth, getWeekDate(birth, week))).toBe(getAgeFromWeek(week));
    }
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

  it('gives an overlapped week to the shorter event, whatever the order', () => {
    const job = { ...event('2018-01-08', '2021-11-26', '1990-03-12'), id: 'job', title: 'Job' };
    const wedding = { ...event('2019-06-17', '2019-06-23', '1990-03-12'), id: 'wedding', title: 'Wedding' };
    for (const order of [[job, wedding], [wedding, job]]) {
      const weeks = generateWeekData(birth, 90, order);
      const weddingWeek = weeks.find(w => w.weekNumber === wedding.startWeekNumber)!;
      expect(weddingWeek.event?.id).toBe('wedding');
      expect(weddingWeek.events.map(e => e.id)).toEqual(['wedding', 'job']);
      // The job still owns every week the wedding does not cover. Cells run
      // from the birthday, not from Mondays, so a Mon-Sun wedding can span two.
      expect(weeks.find(w => w.weekNumber === wedding.endWeekNumber + 1)?.event?.id).toBe('job');
    }
  });

  it('breaks ties between equal spans by the order events were added', () => {
    const a = { ...event('2010-01-04', '2010-01-10', '1990-03-12'), id: 'a' };
    const b = { ...event('2010-01-04', '2010-01-10', '1990-03-12'), id: 'b' };
    const week = generateWeekData(birth, 90, [a, b]).find(w => w.weekNumber === a.startWeekNumber)!;
    expect(week.event?.id).toBe('a');
    expect(week.events.map(e => e.id)).toEqual(['a', 'b']);
  });

  it('derives ranges from dates, not from stale stored week numbers', () => {
    const stale = { ...event('2008-09-15', '2008-10-12', '1990-03-12'), startWeekNumber: 1, endWeekNumber: 4680 };
    const tagged = generateWeekData(birth, 90, [stale]).filter(w => w.event);
    expect(tagged.length).toBeLessThan(10);
  });

  it('numbers years so that week 52 is year 1 and week 53 is year 2', () => {
    const weeks = generateWeekData(birth, 90, []);
    expect(weeks[51].year).toBe(1);
    expect(weeks[52].year).toBe(2);
    expect(weeks[51].weekInYear).toBe(52);
    expect(weeks[52].weekInYear).toBe(1);
  });
});
