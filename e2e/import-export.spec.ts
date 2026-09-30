import { readFile } from 'node:fs/promises';
import { test, expect, seed, stored } from './fixtures';

test('CSV import keeps good rows and reports bad ones by line', async ({ page }) => {
  await seed(page, { name: 'Alex Rivera', birthDate: new Date('1990-03-12T00:00:00').toISOString(), endAge: 90, quote: '', events: [] });
  await page.goto('/');
  const csv = ['title,start_date,end_date', 'University,2008-09-15,2012-06-10', 'Broken,not-a-date,'].join('\n');
  await page.locator('input[type="file"][accept*="csv"]').setInputFiles({
    name: 'milestones.csv', mimeType: 'text/csv', buffer: Buffer.from(csv),
  });
  const status = page.getByRole('status');
  await expect(status).toContainText('Imported 1 milestone');
  await expect(status).toContainText('Row 3 (Broken): start date must be YYYY-MM-DD');
  expect(JSON.parse((await stored(page))!).events).toHaveLength(1);
});

test.describe('exports', () => {
  const download = async (page: import('@playwright/test').Page, name: RegExp) => {
    const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name }).click()]);
    return { name: file.suggestedFilename(), bytes: await readFile((await file.path())!) };
  };

  test('SVG is well-formed and draws every week', async ({ calendar: page }) => {
    const { name, bytes } = await download(page, /Download SVG/);
    expect(name).toBe('alex-rivera-in-weeks.svg');
    const parsed = await page.evaluate(text => {
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      return { error: !!doc.querySelector('parsererror'), rects: doc.querySelectorAll('rect').length };
    }, bytes.toString('utf8'));
    expect(parsed.error).toBe(false);
    expect(parsed.rects).toBeGreaterThanOrEqual(4680);
  });

  test('PNG is a real PNG', async ({ calendar: page }) => {
    const { bytes } = await download(page, /Download PNG/);
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });

  test('ICS holds every milestone as an all-day event', async ({ calendar: page }) => {
    const { name, bytes } = await download(page, /calendar \(\.ics\)/);
    const ics = bytes.toString('utf8');
    expect(name).toBe('alex-rivera-in-weeks.ics');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics).toContain('SUMMARY:Wedding');
    expect(ics).toContain('DTSTART;VALUE=DATE:20190617');
    expect(ics).toContain('DTEND;VALUE=DATE:20190624');
  });
});
