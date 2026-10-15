/**
 * UI 색 배분 목업 캡처 (임시)
 *
 * 실행: `npm run lab:mock`
 * plan/mockups/ui-palettes.html(아티팩트 형식, 문서 골격 없음)을 골격으로 감싸 Chrome에 띄우고
 * 6안 × 1280/390 풀페이지 PNG와 axe(wcag2a/2aa) 결과를 lab-results/mock/ 에 저장한다.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const SRC = process.env.LAB_SRC ?? 'plan/mockups/ui-palettes.html';
const OUT = process.env.LAB_OUT ?? 'lab-results/mock';
const VARIANTS = (process.env.LAB_VARIANTS ?? 'a1,a2,b1,b2,c1,c2').split(',');
const VIEWPORTS = [
  { name: '1280', width: 1280, height: 900 },
  { name: '390', width: 390, height: 844 },
];

await mkdir(OUT, { recursive: true });
const body = await readFile(SRC, 'utf8');
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}</style></head><body>${body}</body></html>`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const summary = [];
try {
  for (const variant of VARIANTS) {
    let axeRows = null;
    let overflow = {};
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.evaluate((v) => { location.hash = v; }, variant);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(200);
      overflow[viewport.name] = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      await page.screenshot({ path: `${OUT}/mock-${variant}-${viewport.name}.png`, fullPage: true });
      if (viewport.name === '1280') {
        const results = await new AxeBuilder({ page }).include('#mock').withTags(['wcag2a', 'wcag2aa']).analyze();
        axeRows = results.violations.map((violation) => ({
          id: violation.id, impact: violation.impact, count: violation.nodes.length,
          nodes: violation.nodes.slice(0, 8).map((node) => ({ target: node.target.join(' '), message: node.any[0]?.message ?? node.all[0]?.message ?? '' })),
        }));
      }
      await context.close();
    }
    summary.push({ variant, violations: axeRows, overflow });
    const total = axeRows.reduce((sum, row) => sum + row.count, 0);
    console.log(`[${variant}] axe: ${axeRows.length} rule(s), ${total} node(s) · overflow 1280=${overflow['1280']} 390=${overflow['390']}`);
  }
} finally {
  await browser.close();
}

const lines = ['# 목업 axe 요약', '', `생성: ${new Date().toISOString()}`, ''];
for (const row of summary) {
  lines.push(`## ${row.variant}`, `- 가로 오버플로: 1280=${row.overflow['1280']} / 390=${row.overflow['390']}`);
  if (row.violations.length === 0) { lines.push('- 위반 없음', ''); continue; }
  for (const violation of row.violations) {
    lines.push(`- **${violation.id}** (${violation.impact}) · ${violation.count}개 노드`);
    for (const node of violation.nodes) lines.push(`  - \`${node.target}\` — ${node.message}`);
  }
  lines.push('');
}
await writeFile(`${OUT}/axe-summary.md`, lines.join('\n'), 'utf8');
console.log(`\n저장: ${OUT}/mock-*.png, ${OUT}/axe-summary.md`);
