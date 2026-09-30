import { test, expect, seed, TODAY } from './fixtures';

test.describe('the week grid', () => {
  test('renders a 90-year calendar as a 90 x 52 grid', async ({ calendar: page }) => {
    await expect(page.getByRole('row')).toHaveCount(90);
    await expect(page.getByRole('gridcell')).toHaveCount(4680);
  });

  test('stays within its DOM budget', async ({ calendar: page }) => {
    // Was 29,936 before the shared tooltip. Guards against per-cell regressions.
    const nodes = await page.evaluate(() => document.querySelectorAll('*').length);
    expect(nodes).toBeLessThan(7000);
  });

  test('marks today as week 1,901, with 1,900 weeks lived', async ({ calendar: page }) => {
    // Born 12 Mar 1990; 30 Sep 2026 is 202 days after the 36th birthday -> cell 29 of row 37.
    await expect(page.locator('#week-1901')).toHaveAttribute('aria-label', /this week/);
    await expect(page.locator('#week-1900')).toHaveAttribute('aria-label', /lived/);
    await expect(page.getByText('1,900', { exact: true })).toBeVisible();
  });

  test('starts every row on a birthday, so ages are exact', async ({ calendar: page }) => {
    await expect(page.locator('#week-1873')).toHaveAttribute('aria-label', /^Week 1,873, age 36,/);
    await expect(page.locator('#week-1872')).toHaveAttribute('aria-label', /^Week 1,872, age 35,/);
  });

  test('gives an overlapped week to the shorter event and names both', async ({ calendar: page }) => {
    const wedding = page.locator('#week-1522');
    await expect(wedding).toHaveCSS('background-color', 'rgb(166, 61, 47)');
    await expect(wedding).toHaveAttribute('aria-label', /Wedding and Built the company/);
    // Outside the wedding, the job owns the square.
    await expect(page.locator('#week-1524')).toHaveCSS('background-color', 'rgb(192, 90, 46)');
  });

  test('shows exactly one tooltip on hover, and none otherwise', async ({ calendar: page }) => {
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toHaveCount(0);
    await page.locator('#week-1522').hover();
    await expect(tooltip).toHaveCount(1);
    await expect(tooltip).toContainText('Week 1522');
    await expect(tooltip).toContainText('Wedding');
    await expect(tooltip).toContainText('Built the company');
    await page.mouse.move(2, 2);
    await expect(tooltip).toHaveCount(0);
  });
});

test.describe('keyboard navigation', () => {
  test('is one tab stop that enters at the current week', async ({ calendar: page }) => {
    const grid = page.getByRole('grid');
    await grid.focus();
    await expect(grid).toHaveAttribute('aria-activedescendant', 'week-1901');
    await expect(page.locator('[role="grid"] [tabindex]:not([tabindex="-1"])')).toHaveCount(0);
  });

  test('moves by week, year, five years and to the ends of life', async ({ calendar: page }) => {
    const grid = page.getByRole('grid');
    await grid.focus();
    const at = (week: number) => expect(grid).toHaveAttribute('aria-activedescendant', `week-${week}`);
    await page.keyboard.press('ArrowRight'); await at(1902);
    await page.keyboard.press('ArrowDown'); await at(1954);
    await page.keyboard.press('PageUp'); await at(1694);
    await page.keyboard.press('Home'); await at(1665);
    await page.keyboard.press('End'); await at(1716);
    await page.keyboard.press('Control+Home'); await at(1);
    await page.keyboard.press('Control+End'); await at(4680);
  });

  test('moves the tooltip with focus and does not scroll the page', async ({ calendar: page }) => {
    await page.getByRole('grid').focus();
    const before = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tooltip')).toContainText('Week 1902');
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('clears focus state on blur', async ({ calendar: page }) => {
    const grid = page.getByRole('grid');
    await grid.focus();
    await page.getByRole('heading', { level: 1 }).click();
    await expect(grid).not.toHaveAttribute('aria-activedescendant', /.+/);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });
});

test.describe('layout', () => {
  for (const width of [375, 393, 640, 768, 1024, 1280, 1600]) {
    test(`fits without sideways scrolling at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.clock.setFixedTime(TODAY);
      await seed(page);
      await page.goto('/calendar');
      await expect(page.getByRole('gridcell').first()).toBeAttached();
      const overflow = await page.evaluate(() => {
        const grid = document.querySelector('.life-grid')!;
        return {
          page: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          grid: grid.scrollWidth > grid.clientWidth + 1,
        };
      });
      expect(overflow).toEqual({ page: false, grid: false });
    });
  }

  test('print styles override screen sizing per paper size', async ({ calendar: page }) => {
    await page.evaluate(() => { window.print = () => {}; });
    const size = () => page.evaluate(() =>
      getComputedStyle(document.querySelector('.life-grid')!).getPropertyValue('--week-size').trim());
    for (const [paper, expected] of [['A0', '40px'], ['A5', '5px']] as const) {
      await page.emulateMedia({ media: 'screen' });
      await page.getByRole('button', { name: new RegExp(`^${paper}`) }).click();
      await page.getByRole('button', { name: /^Print/ }).click();
      await page.emulateMedia({ media: 'print' });
      expect(await size()).toBe(expected);
    }
  });
});
