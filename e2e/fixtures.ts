import { test as base, expect, Page } from '@playwright/test';
export type { Page };

/** A fictional persona. The job/wedding overlap exercises the overlap rule. */
export const ALEX = {
  name: 'Alex Rivera',
  birthDate: new Date('1990-03-12T00:00:00').toISOString(),
  endAge: 90,
  quote: 'Memento mori',
  events: [
    ['University', '2008-09-15', '2012-06-10', '#33718f', 'Graduation'],
    ['Built the company', '2018-01-08', '2021-11-26', '#c05a2e', 'Rocket'],
    ['Wedding', '2019-06-17', '2019-06-23', '#a63d2f', 'Marriage'],
  ].map(([title, start, end, color, icon]) => ({
    id: title.toLowerCase().replace(/\W+/g, '-'),
    title,
    startDate: new Date(`${start}T00:00:00`).toISOString(),
    endDate: new Date(`${end}T00:00:00`).toISOString(),
    color,
    icon,
    startWeekNumber: 0,
    endWeekNumber: 0,
  })),
};

/** Tests pin "today" so the current week, and so every lived count, is stable. */
export const TODAY = new Date('2026-09-30T12:00:00');

export async function seed(page: Page, data: unknown = ALEX) {
  await page.addInitScript(d => {
    if (d === null) localStorage.removeItem('yliw-user-data');
    else localStorage.setItem('yliw-user-data', JSON.stringify(d));
  }, data);
}

export const test = base.extend<{ calendar: Page }>({
  // A page already on the calendar for Alex, with today pinned.
  calendar: async ({ page }, use) => {
    await page.clock.setFixedTime(TODAY);
    await seed(page);
    await page.goto('/calendar');
    await expect(page.getByRole('gridcell').first()).toBeAttached();
    await use(page);
  },
});

export { expect };

/** Read what the page stored, from outside. */
export const stored = (page: Page) =>
  page.evaluate(() => localStorage.getItem('yliw-user-data'));
