import { test, expect, seed, stored, Page } from './fixtures';

// Next renders its own empty role="alert" route announcer, so match ours by text.
const alert = (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text });

const createLink = async (page: Page, passphrase?: string) => {
  if (passphrase) {
    await page.getByLabel('Protect with a passphrase').check();
    await page.getByPlaceholder('At least 8 characters').fill(passphrase);
  }
  await page.getByRole('button', { name: 'Create link' }).click();
  return page.getByLabel('Share link').inputValue();
};

test('a plain link opens read-only for someone with no calendar, and writes nothing', async ({ calendar, browser }) => {
  const link = await createLink(calendar);
  expect(link).toMatch(/\/view#s=[A-Za-z0-9_-]+$/);

  const viewer = await (await browser.newContext()).newPage();
  await viewer.goto(link);
  await expect(viewer.getByRole('heading', { level: 1 })).toHaveText("Alex Rivera's Life in Weeks");
  await expect(viewer.getByText('Viewing a shared calendar')).toBeVisible();
  // Read-only: no editing, sharing or data controls.
  await expect(viewer.getByRole('heading', { name: 'Share' })).toHaveCount(0);
  await expect(viewer.getByRole('button', { name: 'Start over' })).toHaveCount(0);
  await expect(viewer.getByRole('button', { name: /Export JSON/ })).toHaveCount(0);
  expect(await stored(viewer)).toBeNull();
});

test('a protected link needs the right passphrase', async ({ calendar, browser }) => {
  const link = await createLink(calendar, 'correct horse battery');
  expect(link).toMatch(/\/view#e=/);

  const viewer = await (await browser.newContext()).newPage();
  await viewer.goto(link);
  await expect(viewer.getByRole('heading', { name: 'Protected calendar' })).toBeVisible();
  await viewer.getByLabel('Passphrase').fill('wrong passphrase');
  await viewer.getByRole('button', { name: 'Open calendar' }).click();
  await expect(alert(viewer, 'Wrong passphrase')).toBeVisible();
  await viewer.getByLabel('Passphrase').fill('correct horse battery');
  await viewer.getByRole('button', { name: 'Open calendar' }).click();
  await expect(viewer.getByRole('heading', { level: 1 })).toHaveText("Alex Rivera's Life in Weeks");
});

test('saving a copy with no calendar of your own just saves it', async ({ calendar, browser }) => {
  const link = await createLink(calendar);
  const viewer = await (await browser.newContext()).newPage();
  await viewer.goto(link);
  await viewer.getByRole('button', { name: 'Save a copy as mine' }).click();
  await expect(viewer).toHaveURL(/\/calendar$/);
  await expect(viewer.getByRole('button', { name: 'Start over' })).toBeVisible();
  await expect.poll(async () => JSON.parse((await stored(viewer))!).name).toBe('Alex Rivera');
});

test('saving a copy over your own calendar asks first, and cancelling keeps yours', async ({ calendar, browser }) => {
  const link = await createLink(calendar);
  const viewer = await (await browser.newContext()).newPage();
  await seed(viewer, { name: 'Sam', birthDate: new Date('1985-01-01T00:00:00').toISOString(), endAge: 80, quote: '', events: [] });
  await viewer.goto(link);
  let asked = '';
  viewer.once('dialog', dialog => { asked = dialog.message(); dialog.dismiss(); });
  await viewer.getByRole('button', { name: 'Save a copy as mine' }).click();
  expect(asked).toMatch(/Replace your own calendar/);
  expect(JSON.parse((await stored(viewer))!).name).toBe('Sam');
});

test('a damaged link explains itself', async ({ page }) => {
  await page.goto('/view#s=this-is-not-a-calendar');
  await expect(page.getByRole('heading', { name: "Can't open this link" })).toBeVisible();
  await expect(alert(page, 'damaged')).toBeVisible();
});
