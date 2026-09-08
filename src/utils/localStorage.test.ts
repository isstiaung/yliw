import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveUserData, loadUserData, clearUserData, exportUserData, importUserData } from './localStorage';
import { parseLocalDate, formatDateForInput, calculateWeekNumber } from './dateCalculations';
import { UserData } from '@/types';

/** Minimal in-memory Storage stand-in; this module is browser-only. */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, String(v)); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const sample = (): UserData => ({
  name: 'Alex Rivera',
  birthDate: parseLocalDate('1990-03-12'),
  endAge: 90,
  quote: 'Memento mori',
  events: [{
    id: 'e1',
    title: 'University',
    startDate: parseLocalDate('2008-09-15'),
    endDate: parseLocalDate('2012-06-10'),
    color: '#33718f',
    icon: 'Graduation',
    startWeekNumber: 967,
    endWeekNumber: 1161,
  }],
});

describe('save / load round trip', () => {
  it('returns null when nothing is stored', () => {
    expect(loadUserData()).toBeNull();
  });

  it('revives Dates as Date objects, not strings', () => {
    saveUserData(sample());
    const loaded = loadUserData()!;
    expect(loaded.birthDate).toBeInstanceOf(Date);
    expect(loaded.events[0].startDate).toBeInstanceOf(Date);
    expect(formatDateForInput(loaded.birthDate)).toBe('1990-03-12');
  });

  it('preserves the scalar fields', () => {
    saveUserData(sample());
    const loaded = loadUserData()!;
    expect(loaded.name).toBe('Alex Rivera');
    expect(loaded.endAge).toBe(90);
    expect(loaded.quote).toBe('Memento mori');
  });

  it('clearUserData removes the entry', () => {
    saveUserData(sample());
    clearUserData();
    expect(loadUserData()).toBeNull();
  });
});

describe('deserialisation is defensive', () => {
  const store = (value: unknown) =>
    localStorage.setItem('yliw-user-data', typeof value === 'string' ? value : JSON.stringify(value));

  it('returns null for malformed JSON rather than throwing', () => {
    store('{not json');
    expect(loadUserData()).toBeNull();
  });

  it.each([
    ['a missing name', { birthDate: '1990-03-12T00:00:00.000Z', endAge: 90 }],
    ['a blank name', { name: '   ', birthDate: '1990-03-12T00:00:00.000Z', endAge: 90 }],
    ['a non-string birthDate', { name: 'A', birthDate: 12345, endAge: 90 }],
    ['an unparseable birthDate', { name: 'A', birthDate: 'never', endAge: 90 }],
    ['endAge of 0', { name: 'A', birthDate: '1990-03-12T00:00:00.000Z', endAge: 0 }],
    ['endAge above 120', { name: 'A', birthDate: '1990-03-12T00:00:00.000Z', endAge: 121 }],
    ['a string endAge', { name: 'A', birthDate: '1990-03-12T00:00:00.000Z', endAge: '90' }],
    ['a null payload', null],
    ['an array payload', []],
  ])('rejects %s', (_label, payload) => {
    store(payload);
    expect(loadUserData()).toBeNull();
  });

  it('accepts a record with no events array', () => {
    store({ name: 'A', birthDate: '1990-03-12T00:00:00.000Z', endAge: 90 });
    expect(loadUserData()?.events).toEqual([]);
  });

  it('defaults a missing quote to an empty string', () => {
    store({ name: 'A', birthDate: '1990-03-12T00:00:00.000Z', endAge: 90 });
    expect(loadUserData()?.quote).toBe('');
  });

  it('rejects the whole file when one event is malformed', () => {
    store({
      name: 'A', birthDate: '1990-03-12T00:00:00.000Z', endAge: 90,
      events: [{ title: 'ok', startDate: '2008-09-15T00:00:00.000Z', endDate: 'nope' }],
    });
    expect(loadUserData()).toBeNull();
  });

  it('generates an id for an event that has none', () => {
    store({
      name: 'A', birthDate: '1990-03-12T00:00:00.000Z', endAge: 90,
      events: [{ title: 'ok', startDate: '2008-09-15T00:00:00.000Z', endDate: '2008-09-15T00:00:00.000Z' }],
    });
    expect(loadUserData()!.events[0].id).toBeTruthy();
  });

  it('supplies fallbacks for a missing colour and icon', () => {
    store({
      name: 'A', birthDate: '1990-03-12T00:00:00.000Z', endAge: 90,
      events: [{ title: 'ok', startDate: '2008-09-15T00:00:00.000Z', endDate: '2008-09-15T00:00:00.000Z' }],
    });
    const e = loadUserData()!.events[0];
    expect(e.color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(e.icon).toBe('Star');
  });

  it('recomputes week numbers from dates, ignoring what the file claims', () => {
    const birth = '1990-03-12T00:00:00.000Z';
    store({
      name: 'A', birthDate: birth, endAge: 90,
      events: [{
        title: 'ok', startDate: '2008-09-15T00:00:00.000Z', endDate: '2008-09-15T00:00:00.000Z',
        startWeekNumber: 99999, endWeekNumber: 99999,
      }],
    });
    const loaded = loadUserData()!;
    const expected = calculateWeekNumber(loaded.birthDate, loaded.events[0].startDate);
    expect(loaded.events[0].startWeekNumber).toBe(expected);
    expect(loaded.events[0].startWeekNumber).not.toBe(99999);
  });
});

describe('export / import', () => {
  it('exports an empty string when there is nothing stored', () => {
    expect(exportUserData()).toBe('');
  });

  it('exports JSON that imports back to equivalent data', () => {
    saveUserData(sample());
    const json = exportUserData();
    clearUserData();

    const imported = importUserData(json)!;
    expect(imported.name).toBe('Alex Rivera');
    expect(formatDateForInput(imported.events[0].startDate)).toBe('2008-09-15');
    // Import persists as a side effect, so a fresh load sees it too.
    expect(loadUserData()?.name).toBe('Alex Rivera');
  });

  it('returns null for an invalid import without clobbering existing data', () => {
    saveUserData(sample());
    expect(importUserData('{"garbage":true}')).toBeNull();
    expect(loadUserData()?.name).toBe('Alex Rivera');
  });

  it('returns null for malformed JSON on import', () => {
    expect(importUserData('not json at all')).toBeNull();
  });
});
