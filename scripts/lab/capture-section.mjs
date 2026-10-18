/**
 * 특정 섹션만 요소 캡처. 예: LAB_SECTION="#project-structure" LAB_SLUGS="neurocare,lawmate" node scripts/lab/capture-section.mjs
 * 사전 조건: npm run build. 출력: lab-results/sections/<섹션id>/<slug>-<폭>.png
 */
import { chromium } from 'playwright';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { createStaticServer } from '../../tests/e2e/static-server.ts';

const SECTION = process.env.LAB_SECTION ?? '#project-structure';
const SLUGS = (process.env.LAB_SLUGS ?? 'neurocare,lawmate,vino,yoriwang-jwaryong').split(',');
const WIDTHS = (process.env.LAB_WIDTHS ?? '1440,768,390').split(',').map(Number);
const PORT = 4323;
const out = join(process.cwd(), 'lab-results/sections', SECTION.replace(/[^\w-]/g, ''));
await mkdir(out, { recursive: true });
const server = createStaticServer(join(process.cwd(), 'dist'));
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const slug of SLUGS) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${PORT}/projects/${slug}/`, { waitUntil: 'load' });
      // lazy 이미지를 전부 불러오도록 끝까지 스크롤(capture-palettes와 동일)
      await page.evaluate(async () => {
        const step = window.innerHeight * 0.8;
        for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
        await Promise.all(Array.from(document.images).filter((img) => !img.complete).map((img) => new Promise((r) => { img.onload = img.onerror = r; })));
      });
      const element = page.locator(SECTION);
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await element.screenshot({ path: join(out, `${slug}-${width}.png`) });
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`저장: ${out}`);
