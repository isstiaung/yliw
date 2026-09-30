import { UserData } from '@/types';
import { formatDateForInput, parseLocalDate } from './dateCalculations';
import { deserializeUserData } from './localStorage';

/**
 * Share links that need no server.
 *
 * The calendar travels in the URL fragment (after #), which browsers never
 * send to a server — so sharing stays local-first. It is compacted,
 * deflate-compressed and base64url-encoded.
 *
 * Encoding is not protection: anyone holding a plain link can read it. For
 * that, a link can instead be encrypted with AES-GCM under a key derived from
 * a passphrase (PBKDF2-SHA-256), and the passphrase never goes in the link.
 * Both use the browser's built-in Web Crypto and CompressionStream, so there
 * is no dependency.
 *
 * Fragment formats:
 *   #s=<base64url(deflate(json))>                      plain
 *   #e=<base64url(salt[16] | iv[12] | ciphertext)>     encrypted
 */

const VERSION = 1;
const PBKDF2_ITERATIONS = 600_000; // OWASP's current figure for PBKDF2-SHA-256
/** A share link decompressing past this is rejected: no decompression bombs. */
const MAX_DECOMPRESSED_BYTES = 256 * 1024;

type SharedEvent = [title: string, start: string, end: string, color: string, icon: string];

interface SharePayload {
  v: number;
  n: string;
  b: string;
  a: number;
  q?: string;
  e: SharedEvent[];
}

export class ShareLinkError extends Error {}

/* ---- base64url ---------------------------------------------------------- */

export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new ShareLinkError('This link is damaged.');
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new ShareLinkError('This link is damaged.');
  }
  return Uint8Array.from(binary, ch => ch.charCodeAt(0));
}

/* ---- compression -------------------------------------------------------- */

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, limit = Infinity) {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) {
      await reader.cancel();
      throw new ShareLinkError('This link is too large to open.');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

const compress = (bytes: Uint8Array) => pipe(bytes, new CompressionStream('deflate-raw'));

async function decompress(bytes: Uint8Array) {
  try {
    return await pipe(bytes, new DecompressionStream('deflate-raw'), MAX_DECOMPRESSED_BYTES);
  } catch (error) {
    if (error instanceof ShareLinkError) throw error;
    throw new ShareLinkError('This link is damaged.');
  }
}

/* ---- payload ------------------------------------------------------------ */

/** Only what the calendar needs: no ids, no week numbers — both are derived. */
export function toPayload(user: UserData): SharePayload {
  return {
    v: VERSION,
    n: user.name,
    b: formatDateForInput(user.birthDate),
    a: user.endAge,
    ...(user.quote ? { q: user.quote } : {}),
    e: user.events.map(ev => [
      ev.title,
      formatDateForInput(ev.startDate),
      formatDateForInput(ev.endDate),
      ev.color,
      ev.icon,
    ]),
  };
}

/**
 * Back to UserData through the same validator as JSON import, so a link can
 * never carry anything an imported file could not: dates are checked, colours
 * are restricted to hex, and week numbers are recomputed.
 */
export function fromPayload(raw: unknown): UserData {
  const p = raw as Partial<SharePayload> | null;
  if (!p || typeof p !== 'object' || p.v !== VERSION) {
    throw new ShareLinkError('This link was made by a different version of the app.');
  }
  if (typeof p.b !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.b) || !Array.isArray(p.e)) {
    throw new ShareLinkError('This link is damaged.');
  }
  const iso = (value: unknown) =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseLocalDate(value).toISOString() : 'invalid';

  const user = deserializeUserData({
    name: p.n,
    birthDate: iso(p.b),
    endAge: p.a,
    quote: typeof p.q === 'string' ? p.q : '',
    events: p.e.map((ev, i) =>
      Array.isArray(ev)
        ? { id: `shared-${i}`, title: ev[0], startDate: iso(ev[1]), endDate: iso(ev[2]), color: ev[3], icon: ev[4] }
        : null
    ),
  });
  if (!user) throw new ShareLinkError('This link is damaged.');
  return user;
}

/* ---- encryption --------------------------------------------------------- */

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/* ---- public API --------------------------------------------------------- */

/** Build the fragment (without the leading #). */
export async function encodeShareFragment(user: UserData, passphrase?: string): Promise<string> {
  const packed = await compress(new TextEncoder().encode(JSON.stringify(toPayload(user))));
  if (!passphrase) return `s=${toBase64Url(packed)}`;

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, packed as BufferSource)
  );
  const out = new Uint8Array(salt.length + iv.length + sealed.length);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(sealed, salt.length + iv.length);
  return `e=${toBase64Url(out)}`;
}

export type ParsedFragment = { kind: 'plain'; data: string } | { kind: 'encrypted'; data: string } | null;

export function parseFragment(hash: string): ParsedFragment {
  const fragment = hash.replace(/^#/, '');
  if (fragment.startsWith('s=')) return { kind: 'plain', data: fragment.slice(2) };
  if (fragment.startsWith('e=')) return { kind: 'encrypted', data: fragment.slice(2) };
  return null;
}

export async function decodeShareFragment(parsed: NonNullable<ParsedFragment>, passphrase?: string): Promise<UserData> {
  let packed = fromBase64Url(parsed.data);

  if (parsed.kind === 'encrypted') {
    if (!passphrase) throw new ShareLinkError('This calendar is protected. Enter the passphrase to open it.');
    if (packed.length < 16 + 12 + 16) throw new ShareLinkError('This link is damaged.');
    const key = await deriveKey(passphrase, packed.subarray(0, 16));
    try {
      packed = new Uint8Array(
        await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: packed.subarray(16, 28) as BufferSource },
          key,
          packed.subarray(28) as BufferSource
        )
      );
    } catch {
      // AES-GCM authenticates: a wrong passphrase and a tampered link look the same.
      throw new ShareLinkError('Wrong passphrase, or the link has been altered.');
    }
  }

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(await decompress(packed)));
  } catch (error) {
    if (error instanceof ShareLinkError) throw error;
    throw new ShareLinkError('This link is damaged.');
  }
  return fromPayload(json);
}
