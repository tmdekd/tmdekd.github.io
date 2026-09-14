import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { createStaticServer } from './static-server';

const server = createStaticServer(join(process.cwd(), 'dist'));

test.beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(4321, '127.0.0.1', resolve));
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const routes = [
  '/',
  '/projects/neurocare/',
  '/projects/lawmate/',
  '/projects/vino/',
  '/projects/yoriwang-jwaryong/',
  '/404.html',
];
const projectRoutes = routes.filter((route) => route.startsWith('/projects/'));

for (const route of routes) {
  test(`${route} renders without accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`home has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
}

test('home exposes the four projects in approved order', async ({ page }) => {
  await page.goto('/');
  const names = await page.locator('#projects .project-card h3').allTextContents();
  expect(names).toEqual(['NeuroCare', 'LAWMATE', 'VINO', '요리왕 좌룡']);
});

test('legacy sample content is absent', async ({ page }) => {
  await page.goto('/');
  const body = await page.locator('body').innerText();
  expect(body).not.toContain('jbs371');
  expect(body).not.toContain('example@email.com');
});

test('project cards lead to working detail pages', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('#projects a.detail-link');
  await expect(links).toHaveCount(4);
  for (const link of await links.evaluateAll((elements) => elements.map((element) => (element as HTMLAnchorElement).href))) {
    const response = await page.request.get(link);
    expect(response.ok(), link).toBe(true);
  }
});

for (const route of projectRoutes) {
  for (const viewport of [
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`${route} has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(route);
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }
}

test('unknown URLs return the custom 404 page', async ({ page }) => {
  const response = await page.goto('/not-a-real-portfolio-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '길을 잠시 벗어났습니다.' })).toBeVisible();
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`capture ${viewport.name} visual review`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.screenshot({
      path: `test-results/screenshots/home-${viewport.name}.png`,
      fullPage: true,
    });
  });
}

test('capture project detail visual review', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/projects/lawmate/');
  await page.screenshot({ path: 'test-results/screenshots/project-lawmate.png', fullPage: true });
});
