import { test, expect } from './fixtures';

const meta = (page: import('@playwright/test').Page, key: string) =>
  page.locator(`meta[property="${key}"], meta[name="${key}"]`).first().getAttribute('content');

test('the home page has a link preview, a canonical URL and structured data', async ({ page, request }) => {
  await page.goto('/');
  expect(await meta(page, 'og:title')).toContain('Your Life In Weeks');
  expect(await meta(page, 'twitter:card')).toBe('summary_large_image');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\//);

  // The image URL is absolute (it points at the deployed site), so fetch its path locally.
  const image = new URL((await meta(page, 'og:image'))!);
  const response = await request.get(image.pathname);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('image/png');

  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld['@type']).toBe('WebApplication');
  expect(await page.locator('meta[name="robots"]').count()).toBe(0);
});

test('share links preview as a shared calendar, with the image, and are not indexed', async ({ page }) => {
  await page.goto('/view#s=x');
  expect(await meta(page, 'og:title')).toBe('A shared life calendar');
  expect(await meta(page, 'og:image')).toMatch(/\/og-image\.png$/);
  expect(await meta(page, 'twitter:image')).toMatch(/\/og-image\.png$/);
  expect(await meta(page, 'robots')).toBe('noindex, nofollow');
});

test('the calendar page is not indexed', async ({ page }) => {
  await page.goto('/calendar');
  expect(await meta(page, 'robots')).toBe('noindex');
});

test('robots.txt points at a sitemap that lists the home page', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toMatch(/Allow: \//);
  const sitemapUrl = new URL(robots.match(/Sitemap: (\S+)/)![1]);
  const sitemap = await (await request.get(sitemapUrl.pathname)).text();
  expect(sitemap).toContain('<urlset');
  expect(sitemap).toMatch(/<loc>https:\/\/[^<]+<\/loc>/);
});
