import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { codepointsOf, collectSiteText } from '../../scripts/fonts/subset-pretendard.mjs';
import { createStaticServer } from './static-server';

const PORT = 4323;
const server = createStaticServer(join(process.cwd(), 'dist'));
test.beforeAll(async () => { await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', resolve)); });
test.afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); });

/**
 * 서체 전략 시안 검증(FONT_STRATEGY 로 빌드한 dist 기준).
 * A: dist 의 모든 글자가 서브셋에 있어야 하고, 상세 페이지가 내려받는 woff2 는 Pretendard 1 + Plex Mono 2 뿐이어야 한다.
 * B: 390px(휴대폰)에서는 Pretendard woff2 를 하나도 내려받지 않아야 한다.
 */
const STRATEGY = process.env.FONT_STRATEGY ?? 'current';

async function fontRequests(page: import('@playwright/test').Page, path: string, width: number) {
  const urls: string[] = [];
  page.on('request', (request) => { if (request.url().endsWith('.woff2')) urls.push(request.url()); });
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}${path}`, { waitUntil: 'load' }); // 영상 preload 때문에 networkidle 은 오래 걸릴 수 있다
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return urls;
}

test.describe('font strategy A: single self-hosted subset', () => {
  test.skip(STRATEGY !== 'a', 'FONT_STRATEGY=a 로 빌드했을 때만');

  test('the subset covers every character the built site uses', async () => {
    const glyphs = JSON.parse(await readFile('public/fonts/pretendard-subset.glyphs.json', 'utf8')) as { codepoints: number[] };
    const have = new Set(glyphs.codepoints);
    const missing = codepointsOf(await collectSiteText()).filter((cp) => !have.has(cp));
    expect(missing.map((cp) => `U+${cp.toString(16)} ${String.fromCodePoint(cp)}`)).toEqual([]);
  });

  test('a detail page downloads one Pretendard file plus the two mono weights', async ({ page }) => {
    const urls = await fontRequests(page, '/projects/lawmate/', 412);
    expect(urls.filter((url) => url.includes('PretendardVariable-subset'))).toHaveLength(1);
    expect(urls.filter((url) => /pretendard/i.test(url) && !url.includes('subset'))).toEqual([]);
    expect(urls.length).toBeLessThanOrEqual(3);
  });
});

test.describe('font strategy B: system font on phones', () => {
  test.skip(STRATEGY !== 'b', 'FONT_STRATEGY=b 로 빌드했을 때만');

  test('phones download no Pretendard files, desktop still does', async ({ page }) => {
    const phone = await fontRequests(page, '/projects/lawmate/', 390);
    expect(phone.filter((url) => /pretendard/i.test(url))).toEqual([]);
    const desktop = await fontRequests(page, '/projects/lawmate/', 1440);
    expect(desktop.filter((url) => /pretendard/i.test(url)).length).toBeGreaterThan(0);
  });
});
