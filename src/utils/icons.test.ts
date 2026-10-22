import { describe, it, expect } from 'vitest';
import { getIconShape, iconOptions } from './icons';

describe('getIconShape', () => {
  // The poster reads shapes out of react-icons' element tree, which is that
  // library's internals. If an upgrade changes it, this fails before a user
  // exports a poster with every icon missing.
  it.each(iconOptions.map(option => option.name))('reads the shape of %s', name => {
    const shape = getIconShape(name)!;
    expect(shape.viewBox).toMatch(/^[\d.]+ [\d.]+ [\d.]+ [\d.]+$/);
    expect(shape.nodes.length).toBeGreaterThan(0);
    expect(shape.nodes.every(node => typeof node.tag === 'string')).toBe(true);
  });

  it('gives path data as plain SVG attributes', () => {
    const [path] = getIconShape('Star')!.nodes;
    expect(path.tag).toBe('path');
    expect(path.attrs.d).toMatch(/^M/);
  });

  it('returns null for an unknown icon', () => {
    expect(getIconShape('Nope')).toBeNull();
  });
});
