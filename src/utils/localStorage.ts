import { UserData, LifeEvent } from '@/types';
import { formatDateForInput, mapDateRangeToWeeks, parseStrictDate } from '@/utils/dateCalculations';

const STORAGE_KEY = 'yliw-user-data';

/**
 * Dates are stored as calendar days, `YYYY-MM-DD`, not as instants. They used
 * to be `toISOString()`, which records local midnight as a UTC instant: read
 * back in a different timezone — after travelling, or importing an export on
 * another device — that instant falls on the previous or next day.
 */
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

export function serializeUserData(userData: UserData): SerializedUserData {
  return {
    name: userData.name,
    birthDate: formatDateForInput(userData.birthDate),
    endAge: userData.endAge,
    quote: userData.quote,
    events: userData.events.map(event => ({
      ...event,
      startDate: formatDateForInput(event.startDate),
      endDate: formatDateForInput(event.endDate),
    })),
  };
}

export function saveUserData(userData: UserData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeUserData(userData)));
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

  return JSON.stringify(serializeUserData(userData), null, 2);
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

/**
 * Colours end up in style attributes and, via the SVG export, in raw markup,
 * so anything other than a hex colour is replaced. CSV import already
 * enforced this; JSON import and share links did not.
 */
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const HALF_DAY_MS = 12 * 60 * 60 * 1000;

/**
 * A stored date as a local calendar day, or null if it is not a date.
 *
 * `YYYY-MM-DD` is the current format. Anything else is read as an instant,
 * which is what older versions wrote: local midnight, as UTC. In the timezone
 * that wrote it, it is still local midnight, so its local date is the day.
 * Elsewhere, the writer's midnight was somewhere between UTC−12 and UTC+12,
 * which always puts the instant within 12 hours before or after that day's UTC
 * midnight, so the UTC date half a day later is the day that was meant.
 */
function parseStoredDate(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return parseStrictDate(value);

  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return null;
  if (
    instant.getHours() === 0 &&
    instant.getMinutes() === 0 &&
    instant.getSeconds() === 0 &&
    instant.getMilliseconds() === 0
  ) {
    return instant;
  }
  const shifted = new Date(instant.getTime() + HALF_DAY_MS);
  return new Date(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

/**
 * Validate and revive parsed JSON into UserData. Imported files may be
 * hand-edited or from an older version, so nothing is trusted: dates are
 * checked, missing ids regenerated, and week numbers recomputed from the
 * dates rather than read from the file.
 */
export function deserializeUserData(data: unknown): UserData | null {
  if (typeof data !== 'object' || data === null) return null;
  const raw = data as Partial<SerializedUserData>;

  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;
  if (typeof raw.birthDate !== 'string') return null;
  if (typeof raw.endAge !== 'number' || raw.endAge < 1 || raw.endAge > 120) return null;

  const birthDate = parseStoredDate(raw.birthDate);
  if (!birthDate) return null;

  const rawEvents = Array.isArray(raw.events) ? raw.events : [];
  const events: LifeEvent[] = [];

  for (const rawEvent of rawEvents) {
    if (typeof rawEvent !== 'object' || rawEvent === null) return null;
    const e = rawEvent as Partial<SerializedEvent>;
    if (typeof e.title !== 'string' || typeof e.startDate !== 'string' || typeof e.endDate !== 'string') {
      return null;
    }

    const startDate = parseStoredDate(e.startDate);
    const endDate = parseStoredDate(e.endDate);
    if (!startDate || !endDate) return null;

    const weekRange = mapDateRangeToWeeks(birthDate, startDate, endDate);

    events.push({
      id: typeof e.id === 'string' && e.id ? e.id : crypto.randomUUID(),
      title: e.title,
      startDate,
      endDate,
      color: typeof e.color === 'string' && HEX_COLOR.test(e.color) ? e.color : '#b4471f',
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
