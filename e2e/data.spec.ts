import { test, expect, seed, stored, ALEX, Page } from './fixtures';

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

test.describe('editing your details', () => {
  test.beforeEach(async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Edit your details' }).click();
  });

  test('opens with the current details filled in', async ({ page }) => {
    await expect(page.getByLabel('Your name')).toHaveValue('Alex Rivera');
    await expect(page.getByLabel('Birth date')).toHaveValue('1990-03-12');
    await expect(page.getByLabel(/Life expectancy/)).toHaveValue('90');
  });

  test('saves changes and keeps every milestone', async ({ page }) => {
    await page.getByLabel('Your name').fill('Alex R.');
    await page.getByLabel(/Life expectancy/).fill('80');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('heading', { name: "Alex R.'s milestones" })).toBeVisible();
    const saved = JSON.parse((await stored(page))!);
    expect(saved).toMatchObject({ name: 'Alex R.', endAge: 80, birthDate: '1990-03-12' });
    expect(saved.events).toHaveLength(3);
  });

  test('warns before pushing milestones off the calendar, and cancelling changes nothing', async ({ page }) => {
    await page.getByLabel('Birth date').fill('2010-01-01');
    let asked = '';
    page.once('dialog', dialog => { asked = dialog.message(); dialog.dismiss(); });
    await page.getByRole('button', { name: 'Save changes' }).click();
    expect(asked).toMatch(/^1 milestone would fall/); // University starts in 2008
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
    expect(JSON.parse((await stored(page))!).birthDate).toBe('1990-03-12');
  });

  test('cancel goes back without saving', async ({ page }) => {
    await page.getByLabel('Your name').fill('Someone else');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: "Alex Rivera's milestones" })).toBeVisible();
  });
});
