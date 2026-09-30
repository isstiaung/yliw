import { addDays, addYears, differenceInCalendarDays } from 'date-fns';
import { WeekData, LifeEvent } from '@/types';

/**
 * Week maths.
 *
 * Every row of the grid is one year of life and starts exactly on a birthday.
 * Cell i of a row covers days 7i..7i+6 after that birthday. A year is 365 or
 * 366 days and 52 weeks is 364, so the last cell of each row absorbs the extra
 * one or two days — an 8- or 9-day "week".
 *
 * The alternative, a flat 52 weeks per year counted from birth, drifts about a
 * day and a quarter per row: by row 90 the "age 89" row starts about three
 * months late. Anchoring rows to birthdays keeps the grid 52 wide while making
 * every age label exact.
 */

export const WEEKS_PER_YEAR = 52;

/**
 * Parse a `YYYY-MM-DD` value from an <input type="date"> as a *local* date.
 * `new Date('YYYY-MM-DD')` parses as UTC midnight, which shifts the calendar
 * day for any user not on UTC. Building the date from parts keeps it local.
 */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Format a Date as `YYYY-MM-DD` using local parts (inverse of parseLocalDate). */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Midnight local time, so time-of-day never shifts a date across a cell. */
const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * The birthday that starts year `age` of life. date-fns clamps a 29 February
 * birthday to 28 February in common years, and ageAt uses this same function,
 * so the two can never disagree about which row a date falls in.
 */
export function birthdayAt(birthDate: Date, age: number): Date {
  return addYears(startOfDay(birthDate), age);
}

/** Completed years of life on a date: the row it falls in. Negative before birth. */
export function ageAt(birthDate: Date, date: Date): number {
  const target = startOfDay(date);
  let age = target.getFullYear() - birthDate.getFullYear();
  if (birthdayAt(birthDate, age) > target) age -= 1;
  return age;
}

/** 1-based cell number for a date. Week 1 starts on the day of birth. */
export function calculateWeekNumber(birthDate: Date, targetDate: Date): number {
  const age = ageAt(birthDate, targetDate);
  const daysIntoYear = differenceInCalendarDays(startOfDay(targetDate), birthdayAt(birthDate, age));
  const column = Math.min(Math.floor(daysIntoYear / 7), WEEKS_PER_YEAR - 1);
  return age * WEEKS_PER_YEAR + column + 1;
}

export function calculateTotalWeeks(endAge: number): number {
  return endAge * WEEKS_PER_YEAR;
}

/** First day of a cell (inverse of calculateWeekNumber). */
export function getWeekDate(birthDate: Date, weekNumber: number): Date {
  const age = Math.floor((weekNumber - 1) / WEEKS_PER_YEAR);
  const column = (weekNumber - 1) % WEEKS_PER_YEAR;
  return addDays(birthdayAt(birthDate, age), column * 7);
}

/** Last day of a cell. Usually 6 days after the first; 7 or 8 for column 52. */
export function getWeekEndDate(birthDate: Date, weekNumber: number): Date {
  return addDays(getWeekDate(birthDate, weekNumber + 1), -1);
}

export function mapDateToWeek(birthDate: Date, eventDate: Date): number {
  return calculateWeekNumber(birthDate, eventDate);
}

export function mapDateRangeToWeeks(
  birthDate: Date,
  startDate: Date,
  endDate: Date
): { startWeek: number; endWeek: number } {
  return {
    startWeek: calculateWeekNumber(birthDate, startDate),
    endWeek: calculateWeekNumber(birthDate, endDate),
  };
}

/** Age in completed years during a given week: weeks 1–52 are age 0, 53–104 age 1, … */
export function getAgeFromWeek(weekNumber: number): number {
  return Math.floor((weekNumber - 1) / WEEKS_PER_YEAR);
}

export function generateWeekData(
  birthDate: Date,
  endAge: number,
  events: LifeEvent[],
  now: Date = new Date()
): WeekData[] {
  const totalWeeks = calculateTotalWeeks(endAge);
  const currentWeek = calculateWeekNumber(birthDate, now);

  // Week ranges come from the dates, never from the numbers stored on the
  // event: those go stale if the maths or the birth date ever change.
  //
  // Where events overlap, the shortest wins the square, so a one-week wedding
  // stays visible inside a four-year job. Ties go to the earlier-added event.
  // Every overlapping event is still listed on the week, for the tooltip and
  // the accessible name.
  const ranked = events
    .map((event, order) => {
      const { startWeek, endWeek } = mapDateRangeToWeeks(birthDate, event.startDate, event.endDate);
      return { event, order, startWeek, endWeek, span: endWeek - startWeek };
    })
    .sort((a, b) => a.span - b.span || a.order - b.order);

  const perWeek: LifeEvent[][] = Array.from({ length: totalWeeks }, () => []);
  for (const { event, startWeek, endWeek } of ranked) {
    const from = Math.max(startWeek, 1);
    const to = Math.min(endWeek, totalWeeks);
    for (let week = from; week <= to; week++) perWeek[week - 1].push(event);
  }

  const weekData: WeekData[] = [];
  for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber++) {
    const weekEvents = perWeek[weekNumber - 1];
    weekData.push({
      weekNumber,
      year: Math.ceil(weekNumber / WEEKS_PER_YEAR),
      weekInYear: ((weekNumber - 1) % WEEKS_PER_YEAR) + 1,
      isPast: weekNumber < currentWeek,
      isCurrent: weekNumber === currentWeek,
      event: weekEvents[0],
      events: weekEvents,
    });
  }

  return weekData;
}
