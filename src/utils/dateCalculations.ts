import { differenceInWeeks, startOfWeek, addWeeks, isBefore, isSameWeek } from 'date-fns';
import { WeekData, LifeEvent } from '@/types';

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
    
    const isPast = isBefore(weekDate, currentDate);
    const isCurrent = isSameWeek(weekDate, currentDate, { weekStartsOn: 1 });
    
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

export function getAgeFromWeek(weekNumber: number): number {
  return Math.ceil(weekNumber / 52);
}

export function formatWeekInfo(weekData: WeekData, birthDate: Date): string {
  const weekDate = getWeekDate(birthDate, weekData.weekNumber);
  const age = getAgeFromWeek(weekData.weekNumber);
  
  return `Week ${weekData.weekNumber} - Age ${age}, Year ${weekData.year}, Week ${weekData.weekInYear} of year (${weekDate.toLocaleDateString()})`;
}
