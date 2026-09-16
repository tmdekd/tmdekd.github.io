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

test('home shows equal-width project cards in newest-first order', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const cards = page.locator('#projects .project-card');
  const names = await cards.locator('h3').allTextContents();
  expect(names).toEqual(['NeuroCare', 'LAWMATE', 'VINO', '요리왕 좌룡']);
  expect(await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-period')))).toEqual([
    '2025.08.21 — 2025.08.22',
    '2025.05.13 — 2025.07.07',
    '2025.05.09 — 2025.05.12',
    '2025.04.14 — 2025.04.15',
  ]);
  const firstRow = await Promise.all([cards.nth(0).boundingBox(), cards.nth(1).boundingBox()]);
  expect(firstRow[0]?.width).toBeCloseTo(firstRow[1]?.width ?? 0, 0);
});

test('uses clear Korean profile and skill labels without forced heading breaks', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('전문 분야', { exact: true })).toBeVisible();
  await expect(page.getByText('주요 경험', { exact: true })).toBeVisible();
  await expect(page.getByText('기술 역량', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Focus');
  await expect(page.locator('body')).not.toContainText('Based');
  expect(await page.locator('.section-heading h2').evaluateAll((headings) => headings.some((heading) => heading.querySelector('br')))).toBe(false);
});

test('uses readable Pretendard section labels for core Korean sections', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const labels = page.locator('#career .section-kicker, #projects .section-kicker, #skills > .section-heading .section-kicker, .background-compact .section-kicker');
  await expect(labels).toHaveText(['경력', '프로젝트', '기술 역량', '이력과 활동']);
  expect(await labels.evaluateAll((elements) => elements.every((element) => {
    const style = getComputedStyle(element);
    const size = Number.parseFloat(style.fontSize);
    return style.fontFamily.includes('Pretendard') && Number(style.fontWeight) >= 700 && size >= 18 && size <= 20;
  }))).toBe(true);
});

test('explains what each technical skill group enables', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('문서와 검색 데이터를 바탕으로 질문에 답하는 AI 서비스 흐름을 설계·구현합니다.')).toBeVisible();
  await expect(page.getByText('AI 기능이 실제 서비스로 동작하도록 API와 데이터 흐름을 구현합니다.')).toBeVisible();
  await expect(page.getByText('개발 환경부터 배포·운영 흐름까지 연결합니다.')).toBeVisible();
});

test('keeps Korean headings from breaking inside a word', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  expect(await page.locator('h1, h2, h3').evaluateAll((headings) => headings.every((heading) => getComputedStyle(heading).wordBreak === 'keep-all'))).toBe(true);
  expect(await page.locator('.hero-prefix').evaluate((heading) => getComputedStyle(heading).whiteSpace)).toBe('nowrap');
});

test('summarizes Bytech AI service work for a closed network environment', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('전력산업 연구개발 과제·사업의 기획 및 수주 과정에 참여하며, 폐쇄망 환경을 고려한 AI 서비스의 기획·설계·개발을 수행하고 있습니다.')).toBeVisible();
});

test('opens email guidance and copies the address from the dialog', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const opener = page.getByRole('button', { name: '이메일 주소 보기' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: '이메일 안내' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('moon010103@naver.com');
  await dialog.getByRole('button', { name: '이메일 주소 복사' }).click();
  await expect(dialog.getByRole('status')).toHaveText('이메일 주소가 복사되었습니다.');
  await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toBe('moon010103@naver.com');
  await dialog.getByRole('button', { name: '닫기' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test('mobile navigation reveals every portfolio section and restores focus when dismissed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menuButton = page.getByRole('button', { name: '메뉴 열기' });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const navigation = page.locator('#primary-navigation');
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: '소개' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: '경력' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: '프로젝트' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: '기술' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: '연락' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(navigation).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test('placeholder projects use case briefs instead of generic media panels', async ({ page }) => {
  await page.goto('/');
  const briefs = page.locator('#projects [data-project-brief]');
  await expect(briefs).toHaveCount(4);
  await expect(briefs.first()).toContainText('역할');
  await expect(briefs.first()).toContainText('플랫폼');
  await expect(briefs.first()).toContainText('핵심 기술');
});

test('project details use Korean metadata and section labels', async ({ page }) => {
  await page.goto('/projects/lawmate/');
  await expect(page.getByText('기간', { exact: true })).toBeVisible();
  await expect(page.locator('.section-kicker').filter({ hasText: '배경' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Period');
  await expect(page.locator('body')).not.toContainText('Background');
  await expect(page.locator('body')).not.toContainText('Outcome & Reflection');
});

test('uses the compact display and utility typography scale', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const type = await page.evaluate(() => ({
    hero: Number.parseFloat(getComputedStyle(document.querySelector('h1')!).fontSize),
    section: Number.parseFloat(getComputedStyle(document.querySelector('.section-heading h2')!).fontSize),
    tag: Number.parseFloat(getComputedStyle(document.querySelector('.tag')!).fontSize),
  }));
  expect(type.hero).toBeLessThanOrEqual(96);
  expect(type.section).toBeLessThanOrEqual(56);
  expect(type.tag).toBeGreaterThanOrEqual(12.5);
});

test('copies the contact address from the footer without opening a mail client', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.locator('#contact').getByRole('button', { name: /moon010103@naver\.com/ }).click();
  await expect(page.locator('#contact').getByRole('status')).toHaveText('이메일 주소가 복사되었습니다.');
  await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toBe('moon010103@naver.com');
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
