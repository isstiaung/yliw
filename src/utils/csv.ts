import { parseLocalDate } from './dateCalculations';
import { eventColors } from './eventColors';
import { iconOptions } from '@/components/IconPicker';

export interface ParsedCsvEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  icon: string;
}

export interface CsvImportResult {
  events: ParsedCsvEvent[];
  errors: string[];
}

/**
 * Template offered for download. Only title and start_date are required;
 * end_date defaults to start_date, colours are auto-assigned when blank,
 * and unknown icons fall back to a default.
 */
export const CSV_TEMPLATE = [
  'title,start_date,end_date,color,icon',
  'University,2010-09-01,2014-06-15,#33718f,Graduation',
  'First job,2014-07-01,2018-03-31,#c9921e,Briefcase',
  'Wedding day,2019-05-18,,#a63d2f,Marriage',
  'Trip to Japan,2022-04-02,2022-04-16,,Plane',
].join('\n');

const COLUMN_ALIASES: Record<string, string[]> = {
  title: ['title', 'event', 'name', 'milestone'],
  startDate: ['start_date', 'startdate', 'start date', 'start', 'from'],
  endDate: ['end_date', 'enddate', 'end date', 'end', 'to'],
  color: ['color', 'colour'],
  icon: ['icon', 'event_type', 'event type', 'type'],
};

/** Minimal CSV parser: handles quoted fields, escaped quotes and CRLF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter(r => r.some(cell => cell.trim() !== ''));
}

function parseStrictDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = parseLocalDate(value);
  const [year, month, day] = value.split('-').map(Number);
  // Reject rolled-over dates like 2020-02-31
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function resolveIcon(value: string): string {
  const match = iconOptions.find(o => o.name.toLowerCase() === value.trim().toLowerCase());
  return match ? match.name : 'Star';
}

function resolveColor(value: string, rowIndex: number): string {
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  return eventColors[rowIndex % eventColors.length];
}

/**
 * Parse an uploaded milestones CSV. Rows that can't be salvaged are
 * reported per-row and skipped; the rest import. Dates are validated
 * against the user's birth date and life expectancy, like the form.
 */
export function parseEventsCsv(text: string, birthDate: Date, endAge: number): CsvImportResult {
  const rows = parseCsv(text);
  const errors: string[] = [];
  const events: ParsedCsvEvent[] = [];

  if (rows.length === 0) {
    return { events, errors: ['The file is empty.'] };
  }

  const header = rows[0].map(cell => cell.trim().toLowerCase());
  const columns: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    columns[key] = header.findIndex(cell => aliases.includes(cell));
  }

  if (columns.title === -1 || columns.startDate === -1) {
    return {
      events,
      errors: ['Could not find "title" and "start_date" columns. Download the template to see the expected format.'],
    };
  }

  const maxDate = new Date(birthDate);
  maxDate.setFullYear(birthDate.getFullYear() + endAge);

  const cell = (row: string[], key: string): string =>
    columns[key] >= 0 ? (row[columns[key]] ?? '') : '';

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;

    const title = cell(row, 'title').trim();
    if (!title) {
      errors.push(`Row ${line}: missing title.`);
      continue;
    }

    const startRaw = cell(row, 'startDate').trim();
    const startDate = parseStrictDate(startRaw);
    if (!startDate) {
      errors.push(`Row ${line} (${title}): start date must be YYYY-MM-DD.`);
      continue;
    }

    const endRaw = cell(row, 'endDate').trim();
    const endDate = endRaw ? parseStrictDate(endRaw) : startDate;
    if (!endDate) {
      errors.push(`Row ${line} (${title}): end date must be YYYY-MM-DD or blank.`);
      continue;
    }

    if (endDate < startDate) {
      errors.push(`Row ${line} (${title}): end date is before start date.`);
      continue;
    }
    if (startDate < birthDate) {
      errors.push(`Row ${line} (${title}): starts before your birth date.`);
      continue;
    }
    if (endDate > maxDate) {
      errors.push(`Row ${line} (${title}): ends after age ${endAge}.`);
      continue;
    }

    events.push({
      title,
      startDate,
      endDate,
      color: resolveColor(cell(row, 'color'), events.length),
      icon: resolveIcon(cell(row, 'icon')),
    });
  }

  return { events, errors };
}
