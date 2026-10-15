/**
 * 모션 랩 캡처 (임시)
 *
 * 실행: `npm run lab:motion`  (환경변수 LAB_SKIP_BUILD=true 면 기존 dist/ 사용)
 * 1) PUBLIC_LAB=true 로 빌드해 /lab/motion-{변형}/ 경로를 만든다.
 * 2) 변형별 × 1440/390: 로드 후 t=0/300/800/1500/3000ms 프레임 PNG, 1440에서는 120ms 간격 연속 프레임(seq/, GIF 재료).
 *    LAB_VIDEO=true 면 webm 영상도 녹화(Playwright ffmpeg 필요: npx playwright install ffmpeg).
 *    reducedMotion:'reduce' 캡처(모션 없이도 완결된 화면), 1440에서 axe(wcag2a/2aa),
 *    제목 서체 Wanted Sans 비교 캡처(1440, 최종 상태).
 * 3) dist/_astro 아래 JS의 gzip 합계를 요약에 기록한다. 출력: lab-results/motion/
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
const VARIANTS = (process.env.LAB_VARIANTS ?? 'kinetic,infographic,isometric').split(',');
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];
const FRAMES = [0, 300, 800, 1500, 3000];
const SEQ_STEP = 120; const SEQ_COUNT = 30; // 3.6초
const VIDEO = process.env.LAB_VIDEO === 'true';

if (process.env.LAB_SKIP_BUILD !== 'true') {
  console.log('빌드 중 (PUBLIC_LAB=true)…');
  const result = spawnSync('npx astro build', { shell: true, stdio: 'inherit', env: { ...process.env, PUBLIC_LAB: 'true' } });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

await mkdir(`${OUT}/video`, { recursive: true });
await mkdir(`${OUT}/seq`, { recursive: true });
const server = createStaticServer(join(process.cwd(), 'dist'));
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const summary = [];

try {
  for (const variant of VARIANTS) {
    const url = `http://127.0.0.1:${PORT}/lab/motion-${variant}/`;
    const row = { variant, axe: null, overflow: {} };
    for (const viewport of VIEWPORTS) {
      // (1) 모션 허용: 프레임 + 영상
      const videoContext = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        ...(VIDEO ? { recordVideo: { dir: `${OUT}/video`, size: { width: viewport.width, height: viewport.height } } } : {}),
      });
      const page = await videoContext.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const start = Date.now();
      for (const t of FRAMES) {
        const wait = t - (Date.now() - start);
        if (wait > 0) await page.waitForTimeout(wait);
        const path = `${OUT}/frame-${variant}-${viewport.name}-${String(t).padStart(4, '0')}.png`;
        try { await page.screenshot({ path }); } catch { await page.waitForTimeout(50); await page.screenshot({ path }); }
      }
      if (viewport.name === '1440') {
        // 연속 프레임: 다시 재생 버튼으로 처음부터 (GIF 재료)
        await page.click('[data-replay]');
        const seqStart = Date.now();
        for (let i = 0; i < SEQ_COUNT; i += 1) {
          const wait = i * SEQ_STEP - (Date.now() - seqStart);
          if (wait > 0) await page.waitForTimeout(wait);
          await page.screenshot({ path: `${OUT}/seq/${variant}-${String(i).padStart(2, '0')}.png`, clip: { x: 0, y: 0, width: 1440, height: 760 } });
        }
      }
      row.overflow[viewport.name] = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      const video = VIDEO ? page.video() : null;
      await videoContext.close();
      if (video) {
        const saved = await video.path();
        await rename(saved, `${OUT}/video/${variant}-${viewport.name}.webm`);
      }

      // (2) 감속 모션: 정적 캡처 + axe + 서체 비교
      const staticContext = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
      const staticPage = await staticContext.newPage();
      await staticPage.goto(url, { waitUntil: 'networkidle' });
      await staticPage.evaluate(() => document.fonts.ready);
      await staticPage.waitForTimeout(150);
      await staticPage.screenshot({ path: `${OUT}/reduced-${variant}-${viewport.name}.png` });
      if (viewport.name === '1440') {
        const results = await new AxeBuilder({ page: staticPage }).withTags(['wcag2a', 'wcag2aa']).analyze();
        row.axe = results.violations.map((violation) => ({
          id: violation.id, impact: violation.impact, count: violation.nodes.length,
          nodes: violation.nodes.slice(0, 6).map((node) => ({ target: node.target.join(' '), message: node.any[0]?.message ?? node.all[0]?.message ?? '' })),
        }));
        await staticPage.evaluate(() => { document.documentElement.dataset.font = 'wanted'; });
        await staticPage.evaluate(() => document.fonts.ready);
        await staticPage.waitForTimeout(400);
        await staticPage.screenshot({ path: `${OUT}/font-wanted-${variant}-1440.png` });
      }
      await staticContext.close();
    }
    summary.push(row);
    const total = row.axe.reduce((sum, item) => sum + item.count, 0);
    console.log(`[${variant}] axe: ${row.axe.length} rule(s), ${total} node(s) · overflow 1440=${row.overflow['1440']} 390=${row.overflow['390']}`);
  }
} finally {
  await browser.close();
  server.close();
}

// 번들 크기 (dist/_astro/*.js gzip)
const astroDir = join(process.cwd(), 'dist', '_astro');
const bundles = [];
for (const file of await readdir(astroDir)) {
  if (!file.endsWith('.js')) continue;
  const buffer = await readFile(join(astroDir, file));
  bundles.push({ file, raw: (await stat(join(astroDir, file))).size, gzip: gzipSync(buffer).length });
}
bundles.sort((a, b) => b.gzip - a.gzip);

const lines = ['# 모션 랩 캡처 요약', '', `생성: ${new Date().toISOString()}`, ''];
for (const row of summary) {
  lines.push(`## ${row.variant}`, `- 가로 오버플로: 1440=${row.overflow['1440']} / 390=${row.overflow['390']}`);
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
console.log(`\n저장: ${OUT}/frame-*.png, seq/*.png, reduced-*.png, font-wanted-*.png, summary.md`);
