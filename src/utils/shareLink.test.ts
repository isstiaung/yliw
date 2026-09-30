import { describe, it, expect } from 'vitest';
import {
  encodeShareFragment, decodeShareFragment, parseFragment, toBase64Url, fromBase64Url, ShareLinkError,
} from './shareLink';
import { parseLocalDate, formatDateForInput } from './dateCalculations';
import { UserData } from '@/types';

const user = (): UserData => ({
  name: 'Alex Rivera',
  birthDate: parseLocalDate('1990-03-12'),
  endAge: 90,
  quote: 'Memento mori',
  events: [
    ['University', '2008-09-15', '2012-06-10', '#33718f', 'Graduation'],
    ['Wedding', '2019-06-17', '2019-06-23', '#a63d2f', 'Marriage'],
    ['日本への旅 🎌', '2022-04-02', '2022-04-16', '#8a9042', 'Plane'],
  ].map(([title, s, e, color, icon], i) => ({
    id: `e${i}`, title, color, icon,
    startDate: parseLocalDate(s), endDate: parseLocalDate(e), startWeekNumber: 0, endWeekNumber: 0,
  })),
});

const roundTrip = async (passphrase?: string, decodeWith = passphrase) => {
  const fragment = await encodeShareFragment(user(), passphrase);
  return decodeShareFragment(parseFragment('#' + fragment)!, decodeWith);
};

const summary = (u: UserData) => ({
  name: u.name, birth: formatDateForInput(u.birthDate), endAge: u.endAge, quote: u.quote,
  events: u.events.map(e => [e.title, formatDateForInput(e.startDate), formatDateForInput(e.endDate), e.color, e.icon]),
});

describe('base64url', () => {
  it('round-trips every byte value and emits only URL-safe characters', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    const text = toBase64Url(bytes);
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Array.from(fromBase64Url(text))).toEqual(Array.from(bytes));
  });

  it('rejects characters outside the alphabet', () => {
    expect(() => fromBase64Url('abc+/=')).toThrow(ShareLinkError);
  });
});

describe('plain links', () => {
  it('round-trip the whole calendar, including non-Latin titles', async () => {
    expect(summary(await roundTrip())).toEqual(summary(user()));
  });

  it('use the s= prefix and stay URL-safe', async () => {
    const fragment = await encodeShareFragment(user());
    expect(fragment).toMatch(/^s=[A-Za-z0-9_-]+$/);
  });

  it('are compact enough to paste into a chat', async () => {
    const fragment = await encodeShareFragment(user());
    expect(fragment.length).toBeLessThan(400);
  });

  it('are readable by anyone, which is why the UI says so', async () => {
    const fragment = await encodeShareFragment(user());
    // No passphrase required — this documents the trade-off, not a bug.
    const decoded = await decodeShareFragment(parseFragment('#' + fragment)!);
    expect(decoded.name).toBe('Alex Rivera');
  });
});

describe('encrypted links', () => {
  it('round-trip with the right passphrase', async () => {
    expect(summary(await roundTrip('correct horse battery staple'))).toEqual(summary(user()));
  });

  it('use the e= prefix and contain no readable data', async () => {
    const fragment = await encodeShareFragment(user(), 'pw');
    expect(fragment.startsWith('e=')).toBe(true);
    const raw = new TextDecoder('utf-8', { fatal: false }).decode(fromBase64Url(fragment.slice(2)));
    expect(raw).not.toContain('Alex');
  });

  it('are salted: the same calendar and passphrase give different links', async () => {
    const a = await encodeShareFragment(user(), 'pw');
    const b = await encodeShareFragment(user(), 'pw');
    expect(a).not.toBe(b);
  });

  it('refuse a wrong passphrase', async () => {
    await expect(roundTrip('right', 'wrong')).rejects.toThrow(/Wrong passphrase/);
  });

  it('ask for a passphrase rather than failing obscurely', async () => {
    const fragment = await encodeShareFragment(user(), 'pw');
    await expect(decodeShareFragment(parseFragment('#' + fragment)!)).rejects.toThrow(/protected/);
  });

  it('detect tampering (AES-GCM is authenticated)', async () => {
    const fragment = await encodeShareFragment(user(), 'pw');
    const bytes = fromBase64Url(fragment.slice(2));
    bytes[bytes.length - 1] ^= 1;
    const tampered = { kind: 'encrypted' as const, data: toBase64Url(bytes) };
    await expect(decodeShareFragment(tampered, 'pw')).rejects.toThrow(ShareLinkError);
  });
});

describe('hostile or broken links', () => {
  it('ignores fragments that are not share links', () => {
    expect(parseFragment('')).toBeNull();
    expect(parseFragment('#top')).toBeNull();
  });

  it('reports damaged data as a ShareLinkError, never a raw exception', async () => {
    for (const data of ['', 'AAAA', 'not-deflate-data-at-all']) {
      await expect(decodeShareFragment({ kind: 'plain', data })).rejects.toThrow(ShareLinkError);
    }
  });

  it('refuses a decompression bomb', async () => {
    const huge = new Uint8Array(4 * 1024 * 1024).fill(32); // 4MB of spaces
    const reader = new Blob([huge]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const bomb = new Uint8Array(await new Response(reader).arrayBuffer());
    expect(bomb.length).toBeLessThan(10_000); // tiny link, huge payload
    await expect(decodeShareFragment({ kind: 'plain', data: toBase64Url(bomb) })).rejects.toThrow(/too large/);
  });

  it('runs shared data through import validation, so hostile colours are replaced', async () => {
    const evil = user();
    evil.events[0].color = '"/><script>alert(1)</script>';
    const decoded = await decodeShareFragment(parseFragment('#' + (await encodeShareFragment(evil)))!);
    expect(decoded.events[0].color).toBe('#b4471f');
  });

  it('rejects a payload from an unknown version', async () => {
    const json = new TextEncoder().encode(JSON.stringify({ v: 99 }));
    const reader = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const data = toBase64Url(new Uint8Array(await new Response(reader).arrayBuffer()));
    await expect(decodeShareFragment({ kind: 'plain', data })).rejects.toThrow(/different version/);
  });
});
