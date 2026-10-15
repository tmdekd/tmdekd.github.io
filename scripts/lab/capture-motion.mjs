/**
 * 히어로 모션 캡처 (검증용)
 *
 * 실행: `npm run lab:motion`  (LAB_SKIP_BUILD=true 면 기존 dist/ 사용)
 * 홈(/)을 1440/390에서 로드해 t=0/300/800/1500/3000ms 프레임 PNG, 1440에서는 120ms 간격 연속 프레임(seq/, GIF 재료),
 * reducedMotion:'reduce' 캡처(모션 없이도 완결된 화면), axe(wcag2a/2aa), dist/_astro JS gzip 합계를 lab-results/motion/ 에 저장한다.
 * LAB_VIDEO=true 면 webm 영상도 녹화(Playwright ffmpeg 필요: npx playwright install ffmpeg).
 */
import { spawnSync } from 'node:child_process';
import { mkdir, readdir, readFile, rename, writeFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createStaticServer } from '../../tests/e2e/static-server.ts';

const PORT = 4323;
const OUT = 'lab-results/motion';
const ROUTES = [{ name: 'home', path: '/' }];
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];
const FRAMES = [0, 300, 800, 1500, 3000];
const SEQ_STEP = 120; const SEQ_COUNT = 30; // 3.6초
const VIDEO = process.env.LAB_VIDEO === 'true';

if (process.env.LAB_SKIP_BUILD !== 'true') {
  console.log('빌드 중…');
  const result = spawnSync('npx astro build', { shell: true, stdio: 'inherit', env: { ...process.env } });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

await mkdir(`${OUT}/video`, { recursive: true });
await mkdir(`${OUT}/seq`, { recursive: true });
const server = createStaticServer(join(process.cwd(), 'dist'));
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const summary = [];

const shoot = async (page, path, clip) => {
  try { await page.screenshot({ path, clip }); } catch { await page.waitForTimeout(50); await page.screenshot({ path, clip }); }
};

try {
  for (const route of ROUTES) {
    const url = `http://127.0.0.1:${PORT}${route.path}`;
    const row = { name: route.name, axe: null, overflow: {}, heroDone: null };
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        ...(VIDEO ? { recordVideo: { dir: `${OUT}/video`, size: { width: viewport.width, height: viewport.height } } } : {}),
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const start = Date.now();
      for (const t of FRAMES) {
        const wait = t - (Date.now() - start);
        if (wait > 0) await page.waitForTimeout(wait);
        await shoot(page, `${OUT}/frame-${route.name}-${viewport.name}-${String(t).padStart(4, '0')}.png`);
      }
      row.overflow[viewport.name] = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      if (viewport.name === '1440') {
        row.heroDone = await page.evaluate(() => ({
          flag: document.documentElement.dataset.motion ?? '(없음)',
          hidden: Array.from(document.querySelectorAll('[data-hero-anim]')).filter((el) => getComputedStyle(el).opacity !== '1').length,
        }));
        await page.reload({ waitUntil: 'domcontentloaded' });
        const seqStart = Date.now();
        for (let i = 0; i < SEQ_COUNT; i += 1) {
          const wait = i * SEQ_STEP - (Date.now() - seqStart);
          if (wait > 0) await page.waitForTimeout(wait);
          await shoot(page, `${OUT}/seq/${route.name}-${String(i).padStart(2, '0')}.png`, { x: 0, y: 0, width: 1440, height: 760 });
        }
      }
      const video = VIDEO ? page.video() : null;
      await context.close();
      if (video) await rename(await video.path(), `${OUT}/video/${route.name}-${viewport.name}.webm`);

      const staticContext = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
      const staticPage = await staticContext.newPage();
      await staticPage.goto(url, { waitUntil: 'networkidle' });
      await staticPage.evaluate(() => document.fonts.ready);
      await staticPage.waitForTimeout(150);
      await staticPage.screenshot({ path: `${OUT}/reduced-${route.name}-${viewport.name}.png` });
      if (viewport.name === '1440') {
        const results = await new AxeBuilder({ page: staticPage }).withTags(['wcag2a', 'wcag2aa']).analyze();
        row.axe = results.violations.map((violation) => ({
          id: violation.id, impact: violation.impact, count: violation.nodes.length,
          nodes: violation.nodes.slice(0, 6).map((node) => ({ target: node.target.join(' '), message: node.any[0]?.message ?? node.all[0]?.message ?? '' })),
        }));
      }
      await staticContext.close();
    }
    summary.push(row);
    const total = row.axe.reduce((sum, item) => sum + item.count, 0);
    console.log(`[${route.name}] axe: ${row.axe.length} rule(s), ${total} node(s) · overflow 1440=${row.overflow['1440']} 390=${row.overflow['390']} · 3초 후 플래그=${row.heroDone.flag}, 숨겨진 히어로 요소=${row.heroDone.hidden}`);
  }
} finally {
  await browser.close();
  server.close();
}

const astroDir = join(process.cwd(), 'dist', '_astro');
const bundles = [];
for (const file of await readdir(astroDir)) {
  if (!file.endsWith('.js')) continue;
  const buffer = await readFile(join(astroDir, file));
  bundles.push({ file, raw: (await stat(join(astroDir, file))).size, gzip: gzipSync(buffer).length });
}
bundles.sort((a, b) => b.gzip - a.gzip);

const lines = ['# 히어로 모션 캡처 요약', '', `생성: ${new Date().toISOString()}`, ''];
for (const row of summary) {
  lines.push(`## ${row.name}`, `- 가로 오버플로: 1440=${row.overflow['1440']} / 390=${row.overflow['390']}`, `- 3초 후 data-motion=${row.heroDone.flag}, 숨겨진 [data-hero-anim]=${row.heroDone.hidden}`);
  if (row.axe.length === 0) lines.push('- axe 위반 없음');
  for (const violation of row.axe) {
    lines.push(`- **${violation.id}** (${violation.impact}) · ${violation.count}개 노드`);
    for (const node of violation.nodes) lines.push(`  - \`${node.target}\` — ${node.message}`);
  }
  lines.push('');
}
lines.push('## JS 번들 (dist/_astro, gzip)', '', '| 파일 | raw | gzip |', '|---|---:|---:|');
for (const bundle of bundles) lines.push(`| ${bundle.file} | ${bundle.raw} | ${bundle.gzip} |`);
lines.push('', `합계 gzip: ${bundles.reduce((sum, bundle) => sum + bundle.gzip, 0)} bytes`);
await writeFile(`${OUT}/summary.md`, lines.join('\n'), 'utf8');
console.log(`\n저장: ${OUT}/frame-*.png, seq/*.png, reduced-*.png, summary.md`);
