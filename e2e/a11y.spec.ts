import { test, expect, seed, stored, ALEX } from './fixtures';

test.describe('milestone dialog', () => {
  test.beforeEach(async ({ page }) => {
    await seed(page, { ...ALEX, events: [] });
    await page.goto('/');
    await page.getByRole('button', { name: 'Add milestone' }).click();
  });

  test('opens as a labelled modal dialog with focus inside it', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'New milestone' });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(d => (d as HTMLDialogElement).open && d.matches(':modal'))).toBe(true);
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  });

  test('closes on Escape', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('traps Tab inside the dialog', async ({ page }) => {
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const el = document.activeElement;
        // Focus may briefly sit on the document/browser chrome between cycles.
        return !el || el === document.body || !!el.closest('dialog');
      });
      expect(inside).toBe(true);
    }
  });

  test('closes on a backdrop click but not on a click inside', async ({ page }) => {
    await page.getByRole('heading', { name: 'New milestone' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('names the colour group and reports the selected swatch', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Colour' });
    await expect(group).toBeVisible();
    const swatches = group.getByRole('button');
    await swatches.nth(2).click();
    await expect(swatches.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
  });

  test('still adds a milestone end to end', async ({ page }) => {
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/title/i).first().fill('University');
    await dialog.getByLabel(/start/i).first().fill('2008-09-15');
    await dialog.getByLabel(/end/i).first().fill('2012-06-10');
    await dialog.getByRole('button', { name: 'Add milestone' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(async () => JSON.parse((await stored(page))!).events.length).toBe(1);
  });
});

test('paper sizes are a named group that reports the selection', async ({ calendar: page }) => {
  const group = page.getByRole('group', { name: 'Paper size' });
  await expect(group).toBeVisible();
  await group.getByRole('button', { name: /^A2/ }).click();
  await expect(group.getByRole('button', { name: /^A2/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
});
