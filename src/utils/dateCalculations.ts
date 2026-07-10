import { differenceInWeeks, startOfWeek, addWeeks, isBefore, isSameWeek } from 'date-fns';
import { WeekData, LifeEvent } from '@/types';

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

export function calculateWeekNumber(birthDate: Date, targetDate: Date): number {
  const birthWeekStart = startOfWeek(birthDate, { weekStartsOn: 1 }); // Monday start
  return differenceInWeeks(targetDate, birthWeekStart) + 1;
}

export function calculateTotalWeeks(endAge: number): number {
  return endAge * 52; // 52 weeks per year
}

export function getWeekDate(birthDate: Date, weekNumber: number): Date {
  const birthWeekStart = startOfWeek(birthDate, { weekStartsOn: 1 });
  return addWeeks(birthWeekStart, weekNumber - 1);
}

export function generateWeekData(
  birthDate: Date,
  endAge: number,
  events: LifeEvent[]
): WeekData[] {
  const totalWeeks = calculateTotalWeeks(endAge);
  const currentDate = new Date();
  const weekData: WeekData[] = [];

  for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber++) {
    const weekDate = getWeekDate(birthDate, weekNumber);
    const year = Math.ceil(weekNumber / 52);
    const weekInYear = ((weekNumber - 1) % 52) + 1;
    
    const isCurrent = isSameWeek(weekDate, currentDate, { weekStartsOn: 1 });
    // The current week's start is before "now" too, so exclude it explicitly
    // — otherwise it gets double-counted as both past and current in stats.
    const isPast = !isCurrent && isBefore(weekDate, currentDate);
    
    // Find event for this week (check if week falls within event's date range)
    const event = events.find(e => 
      weekNumber >= e.startWeekNumber && weekNumber <= e.endWeekNumber
    );

    weekData.push({
      weekNumber,
      year,
      weekInYear,
      isPast,
      isCurrent,
      event
    });
  }

  return weekData;
}

export function mapDateToWeek(birthDate: Date, eventDate: Date): number {
  return calculateWeekNumber(birthDate, eventDate);
}

export function mapDateRangeToWeeks(birthDate: Date, startDate: Date, endDate: Date): { startWeek: number; endWeek: number } {
  return {
    startWeek: calculateWeekNumber(birthDate, startDate),
    endWeek: calculateWeekNumber(birthDate, endDate)
  };
}

/** Age in completed years during a given week: weeks 1–52 are age 0, 53–104 age 1, … */
export function getAgeFromWeek(weekNumber: number): number {
  return Math.floor((weekNumber - 1) / 52);
}
