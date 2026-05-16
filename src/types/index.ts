export interface LifeEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  icon: string;
  startWeekNumber: number;
  endWeekNumber: number;
}

export interface UserData {
  name: string;
  birthDate: Date;
  endAge: number;
  quote: string;
  events: LifeEvent[];
}

export interface WeekData {
  weekNumber: number;
  year: number;
  weekInYear: number;
  isPast: boolean;
  isCurrent: boolean;
  event?: LifeEvent;
}

export type PrintSize = 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5';

export interface PrintConfig {
  size: PrintSize;
  width: string;
  height: string;
  boxSize: string;
  gap: string;
  fontSize: string;
}

export type AppPhase = 'setup' | 'events' | 'calendar';
