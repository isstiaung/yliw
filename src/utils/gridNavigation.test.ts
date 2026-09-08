import { describe, it, expect } from 'vitest';
import { nextWeekForKey, describeWeek, WEEKS_PER_ROW } from './gridNavigation';

const TOTAL = 4680; // 90 years

const move = (key: string, current: number, mods: { ctrlKey?: boolean; metaKey?: boolean } = {}) =>
  nextWeekForKey({ key, current, total: TOTAL, ...mods });

describe('nextWeekForKey — basic movement', () => {
  it('moves one week horizontally', () => {
    expect(move('ArrowRight', 100)).toBe(101);
    expect(move('ArrowLeft', 100)).toBe(99);
  });

  it('moves a year vertically', () => {
    expect(move('ArrowDown', 100)).toBe(100 + WEEKS_PER_ROW);
    expect(move('ArrowUp', 100)).toBe(100 - WEEKS_PER_ROW);
  });

  it('crosses row boundaries horizontally rather than stopping', () => {
    // Holding Right should walk the whole life in order.
    expect(move('ArrowRight', WEEKS_PER_ROW)).toBe(WEEKS_PER_ROW + 1);
    expect(move('ArrowLeft', WEEKS_PER_ROW + 1)).toBe(WEEKS_PER_ROW);
  });

  it('ignores keys that are not navigation keys', () => {
    for (const key of ['a', 'Enter', ' ', 'Escape', 'Tab', 'Shift']) {
      expect(move(key, 100)).toBeNull();
    }
  });
});

describe('nextWeekForKey — clamping at the edges', () => {
  it('does not move before week 1', () => {
    expect(move('ArrowLeft', 1)).toBe(1);
    expect(move('ArrowUp', 1)).toBe(1);
    expect(move('ArrowUp', 10)).toBe(1);
    expect(move('PageUp', 1)).toBe(1);
  });

  it('does not move past the final week', () => {
    expect(move('ArrowRight', TOTAL)).toBe(TOTAL);
    expect(move('ArrowDown', TOTAL)).toBe(TOTAL);
    expect(move('ArrowDown', TOTAL - 10)).toBe(TOTAL);
    expect(move('PageDown', TOTAL)).toBe(TOTAL);
  });

  it('never returns a week outside the calendar', () => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
    for (const start of [1, 2, 52, 53, 2000, TOTAL - 1, TOTAL]) {
      for (const key of keys) {
        for (const mods of [{}, { ctrlKey: true }]) {
          const next = nextWeekForKey({ key, current: start, total: TOTAL, ...mods });
          if (next === null) continue;
          expect(next).toBeGreaterThanOrEqual(1);
          expect(next).toBeLessThanOrEqual(TOTAL);
        }
      }
    }
  });
});

describe('nextWeekForKey — Home and End', () => {
  it('goes to the ends of the current year', () => {
    expect(move('Home', 60)).toBe(53);
    expect(move('End', 60)).toBe(104);
    expect(move('Home', 1)).toBe(1);
    expect(move('End', 1)).toBe(52);
  });

  it('jumps to the first and last week of life with Ctrl or Cmd', () => {
    expect(move('Home', 2000, { ctrlKey: true })).toBe(1);
    expect(move('End', 2000, { ctrlKey: true })).toBe(TOTAL);
    expect(move('Home', 2000, { metaKey: true })).toBe(1);
    expect(move('End', 2000, { metaKey: true })).toBe(TOTAL);
  });

  it('clamps End on a final partial row', () => {
    // A 10-year calendar ends mid-grid; End must not run past it.
    expect(nextWeekForKey({ key: 'End', current: 500, total: 520 })).toBe(520);
  });
});

describe('nextWeekForKey — page movement', () => {
  it('moves five years at a time', () => {
    expect(move('PageDown', 100)).toBe(100 + WEEKS_PER_ROW * 5);
    expect(move('PageUp', 1000)).toBe(1000 - WEEKS_PER_ROW * 5);
  });
});

describe('describeWeek', () => {
  it('names the week, age and state', () => {
    expect(describeWeek(100, 1, 'past')).toBe('Week 100, age 1, lived');
    expect(describeWeek(4000, 76, 'future')).toBe('Week 4,000, age 76, not yet lived');
    expect(describeWeek(1904, 36, 'current')).toBe('Week 1,904, age 36, this week');
  });

  it('appends the milestone when there is one', () => {
    expect(describeWeek(1904, 36, 'past', 'Built the company')).toBe(
      'Week 1,904, age 36, lived, Built the company'
    );
  });
});
