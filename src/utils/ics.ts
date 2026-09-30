import { addDays } from 'date-fns';
import { LifeEvent } from '@/types';

/**
 * Milestones as an iCalendar (RFC 5545) file, for importing into Apple,
 * Google or Outlook calendars.
 *
 * Hand-written rather than a dependency: the format is small, and the parts
 * that go wrong — text escaping, line folding and exclusive end dates — are
 * all covered by tests.
 */

const CRLF = '\r\n';

/** RFC 5545 §3.3.11: backslash, semicolon, comma and newline are escaped. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * RFC 5545 §3.1: lines longer than 75 octets are folded with CRLF + space.
 * Counted in UTF-8 bytes, and never splitting a multi-byte character, or a
 * milestone title in Japanese or with emoji would corrupt the file.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  const limit = () => (parts.length === 0 ? 75 : 74); // continuation lines lose one to the space

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit()) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** All-day DATE value from local date parts: YYYYMMDD. */
export const formatDate = (date: Date): string =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

const formatUtcStamp = (date: Date): string =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T` +
  `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

export interface IcsOptions {
  calendarName: string;
  events: LifeEvent[];
  /** Injected for deterministic tests; DTSTAMP is required on every VEVENT. */
  now?: Date;
}

export function buildIcs({ calendarName, events, now = new Date() }: IcsOptions): string {
  const stamp = formatUtcStamp(now);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//yliw//Your Life In Weeks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      // Stable per milestone, so re-importing updates rather than duplicates.
      `UID:${event.id}@yliw`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${formatDate(event.startDate)}`,
      // All-day DTEND is exclusive: a milestone ending on the 23rd ends on the 24th.
      `DTEND;VALUE=DATE:${formatDate(addDays(event.endDate, 1))}`,
      `SUMMARY:${escapeText(event.title)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}

export function downloadIcs(options: IcsOptions, filename: string): void {
  const blob = new Blob([buildIcs(options)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
