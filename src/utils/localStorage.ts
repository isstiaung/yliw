import { UserData, LifeEvent } from '@/types';
import { mapDateRangeToWeeks } from '@/utils/dateCalculations';

const STORAGE_KEY = 'yliw-user-data';

interface SerializedEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  icon: string;
  startWeekNumber: number;
  endWeekNumber: number;
}

interface SerializedUserData {
  name: string;
  birthDate: string;
  endAge: number;
  quote: string;
  events: SerializedEvent[];
}

export function saveUserData(userData: UserData): void {
  try {
    const serializedData = JSON.stringify({
      ...userData,
      birthDate: userData.birthDate.toISOString(),
      events: userData.events.map(event => ({
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString()
      }))
    });
    localStorage.setItem(STORAGE_KEY, serializedData);
  } catch (error) {
    console.error('Failed to save user data:', error);
  }
}

export function loadUserData(): UserData | null {
  try {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    if (!serializedData) return null;

    return deserializeUserData(JSON.parse(serializedData));
  } catch (error) {
    console.error('Failed to load user data:', error);
    return null;
  }
}

export function clearUserData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
}

export function exportUserData(): string {
  const userData = loadUserData();
  if (!userData) return '';

  return JSON.stringify(userData, null, 2);
}

export function importUserData(jsonString: string): UserData | null {
  try {
    const userData = deserializeUserData(JSON.parse(jsonString));
    if (!userData) return null;
    saveUserData(userData);
    return userData;
  } catch (error) {
    console.error('Failed to import user data:', error);
    return null;
  }
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

/**
 * Validate and revive parsed JSON into UserData. Imported files may be
 * hand-edited or from an older version, so nothing is trusted: dates are
 * checked, missing ids regenerated, and week numbers recomputed from the
 * dates rather than read from the file.
 */
function deserializeUserData(data: unknown): UserData | null {
  if (typeof data !== 'object' || data === null) return null;
  const raw = data as Partial<SerializedUserData>;

  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;
  if (typeof raw.birthDate !== 'string') return null;
  if (typeof raw.endAge !== 'number' || raw.endAge < 1 || raw.endAge > 120) return null;

  const birthDate = new Date(raw.birthDate);
  if (!isValidDate(birthDate)) return null;

  const rawEvents = Array.isArray(raw.events) ? raw.events : [];
  const events: LifeEvent[] = [];

  for (const rawEvent of rawEvents) {
    if (typeof rawEvent !== 'object' || rawEvent === null) return null;
    const e = rawEvent as Partial<SerializedEvent>;
    if (typeof e.title !== 'string' || typeof e.startDate !== 'string' || typeof e.endDate !== 'string') {
      return null;
    }

    const startDate = new Date(e.startDate);
    const endDate = new Date(e.endDate);
    if (!isValidDate(startDate) || !isValidDate(endDate)) return null;

    const weekRange = mapDateRangeToWeeks(birthDate, startDate, endDate);

    events.push({
      id: typeof e.id === 'string' && e.id ? e.id : crypto.randomUUID(),
      title: e.title,
      startDate,
      endDate,
      color: typeof e.color === 'string' ? e.color : '#b4471f',
      icon: typeof e.icon === 'string' ? e.icon : 'Star',
      startWeekNumber: weekRange.startWeek,
      endWeekNumber: weekRange.endWeek,
    });
  }

  return {
    name: raw.name,
    birthDate,
    endAge: raw.endAge,
    quote: typeof raw.quote === 'string' ? raw.quote : '',
    events,
  };
}
