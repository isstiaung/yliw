import { test, expect, stored, ALEX, Page } from './fixtures';

/** Seed once: seed() re-seeds on every load, which would hide whether data survives a reload. */
async function seedOnce(page: Page, data: unknown = ALEX) {
  await page.addInitScript(d => {
    if (sessionStorage.getItem('seeded')) return;
    localStorage.setItem('yliw-user-data', JSON.stringify(d));
    sessionStorage.setItem('seeded', '1');
  }, data);
}

test('start over clears the calendar from storage, not just the screen', async ({ page }) => {
  await seedOnce(page);
  await page.goto('/calendar');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.getByLabel('Your name')).toHaveValue('');
  expect(await stored(page)).toBeNull();
  await page.reload();
  await expect(page.getByLabel('Your name')).toHaveValue('');
});
