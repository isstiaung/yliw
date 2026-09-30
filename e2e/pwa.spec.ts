import { test, expect, seed, ALEX } from './fixtures';

test('links a valid manifest whose icons all load', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await (await request.get(href!)).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).status()).toBe(200);
  }
});

test('works offline after a single visit', async ({ page, context }) => {
  await seed(page);
  await page.goto('/calendar');
  await expect(page.getByRole('gridcell').first()).toBeAttached();
  // Wait until the worker has installed, precached, and taken control.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    }
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${ALEX.name}'s Life in Weeks`);
  await expect(page.getByRole('gridcell')).toHaveCount(4680);

  // A page never visited before also opens, from the precached shell.
  await page.goto('/view#s=x');
  await expect(page.getByRole('heading', { name: "Can't open this link" })).toBeVisible();
});
