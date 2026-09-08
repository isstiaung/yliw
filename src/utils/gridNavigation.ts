/**
 * Keyboard movement within the week grid.
 *
 * Kept pure and separate from the component so the movement rules — which are
 * mostly edge cases — can be tested without a DOM.
 */

export const WEEKS_PER_ROW = 52;

export interface NavigationOptions {
  key: string;
  /** Currently active week, 1-based. */
  current: number;
  /** Total weeks in the calendar. */
  total: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

/** Clamp to the calendar rather than wrapping past either end. */
const clamp = (week: number, total: number): number => Math.min(Math.max(week, 1), total);

/**
 * The week a key press should move to, or null if the key is not a navigation
 * key and should be left alone.
 *
 * Left/Right move by one week and cross row boundaries, so holding Right walks
 * the whole life in order rather than stopping at the end of each year.
 * Up/Down move by a year. Home/End go to the ends of the current year;
 * with Ctrl or Cmd they go to the first and last week of life.
 */
export function nextWeekForKey({
  key,
  current,
  total,
  ctrlKey = false,
  metaKey = false,
}: NavigationOptions): number | null {
  const jumpToExtremes = ctrlKey || metaKey;
  const rowStart = current - ((current - 1) % WEEKS_PER_ROW);

  switch (key) {
    case 'ArrowLeft':
      return clamp(current - 1, total);
    case 'ArrowRight':
      return clamp(current + 1, total);
    case 'ArrowUp':
      return clamp(current - WEEKS_PER_ROW, total);
    case 'ArrowDown':
      return clamp(current + WEEKS_PER_ROW, total);
    case 'Home':
      return jumpToExtremes ? 1 : rowStart;
    case 'End':
      return jumpToExtremes ? total : clamp(rowStart + WEEKS_PER_ROW - 1, total);
    case 'PageUp':
      return clamp(current - WEEKS_PER_ROW * 5, total);
    case 'PageDown':
      return clamp(current + WEEKS_PER_ROW * 5, total);
    default:
      return null;
  }
}

/** Screen-reader description of a week; also the cell's accessible name. */
export function describeWeek(
  weekNumber: number,
  age: number,
  state: 'past' | 'current' | 'future',
  eventTitle?: string
): string {
  const stateLabel =
    state === 'current' ? 'this week' : state === 'past' ? 'lived' : 'not yet lived';
  const suffix = eventTitle ? `, ${eventTitle}` : '';
  return `Week ${weekNumber.toLocaleString()}, age ${age}, ${stateLabel}${suffix}`;
}
