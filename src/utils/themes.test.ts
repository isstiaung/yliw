import { describe, it, expect } from 'vitest';
import { withDerivedBorders } from './themes';

describe('withDerivedBorders', () => {
  it('adds nothing when no fill is customised', () => {
    expect(withDerivedBorders({ '--paper': '#ffffff' })).toEqual({ '--paper': '#ffffff' });
  });

  it('gives a custom lived colour the same border', () => {
    expect(withDerivedBorders({ '--week-past': '#aa2200' })['--week-past-border']).toBe('#aa2200');
  });

  it('darkens the border of a light future colour and lightens a dark one', () => {
    const light = withDerivedBorders({ '--week-future': '#eeeeee' })['--week-future-border'];
    const dark = withDerivedBorders({ '--week-future': '#222222' })['--week-future-border'];
    expect(parseInt(light.slice(1, 3), 16)).toBeLessThan(0xee);
    expect(parseInt(dark.slice(1, 3), 16)).toBeGreaterThan(0x22);
  });

  it('follows a custom accent for the current week, which defaults to it', () => {
    const custom = withDerivedBorders({ '--accent': '#3366cc' });
    expect(custom['--week-current-border']).toMatch(/^#[0-9a-f]{6}$/);
    expect(withDerivedBorders({ ...custom, '--week-current': '#118844' })['--week-current-border']).not.toBe(
      custom['--week-current-border']
    );
  });

  it('drops a derived border once its fill is no longer customised', () => {
    const custom = withDerivedBorders({ '--week-past': '#aa2200' });
    delete custom['--week-past'];
    expect(withDerivedBorders(custom)).not.toHaveProperty('--week-past-border');
  });
});
