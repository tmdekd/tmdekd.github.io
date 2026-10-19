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
 * 자체 호스팅 Pretendard 서브셋 검증: dist 의 모든 글자가 서브셋(public/fonts/pretendard-subset.glyphs.json)에 있어야 하고,
 * 상세 페이지가 내려받는 woff2 는 Pretendard 1 + Plex Mono 2 뿐이어야 한다. 새 문장을 쓰고 서브셋을 다시 만들지 않으면 여기서 실패한다(`npm run fonts:subset`).
 */

async function fontRequests(page: import('@playwright/test').Page, path: string, width: number) {
  const urls: string[] = [];
  page.on('request', (request) => { if (request.url().endsWith('.woff2')) urls.push(request.url()); });
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}${path}`, { waitUntil: 'load' }); // 영상 preload 때문에 networkidle 은 오래 걸릴 수 있다
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return urls;
}

test.describe('self-hosted Pretendard subset', () => {
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
