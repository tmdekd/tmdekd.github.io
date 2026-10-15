/**
 * 팔레트 시안 캡처 스크립트 (임시, 팔레트 결정 후 삭제 가능)
 *
 * 사전 조건: `npm run build` (dist/ 필요)
 * 실행:     `npm run lab:palettes`
 *
 * dist/를 로컬 서버로 띄우고, 각 테마를 <html data-theme> 속성으로 주입한 뒤
 * 풀페이지 스크린샷과 axe(wcag2a/2aa) 색 대비 위반을 lab-results/palettes/ 에 저장한다.
 * 로컬에는 Playwright 브라우저가 없으므로 설치된 Chrome(channel: 'chrome')을 사용한다.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createStaticServer } from '../../tests/e2e/static-server.ts';

const PORT = 4322;
const OUT = `lab-results/palettes${process.env.LAB_OUT_SUFFIX ?? ''}`; // test-results/는 Playwright가 매 실행마다 비우므로 별도 폴더 사용
const THEMES = (process.env.LAB_THEMES ?? 'default').split(','); // 시안 테마는 제거됨(2026-10-15). 기본 1회 캡처
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'lawmate', path: '/projects/lawmate/' },
];
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

await mkdir(OUT, { recursive: true });
const server = createStaticServer(join(process.cwd(), 'dist'));
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const summary = [];

try {
  for (const theme of THEMES) {
    for (const route of ROUTES) {
      let axeRows = null;
      for (const viewport of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        await page.goto(`http://127.0.0.1:${PORT}${route.path}`, { waitUntil: 'networkidle' });
        if (theme !== 'current') {
          await page.evaluate((value) => {
            document.documentElement.dataset.theme = value;
          }, theme);
        }
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
        await page.screenshot({
          path: `${OUT}/palette-${theme}-${route.name}-${viewport.name}.png`,
          fullPage: true,
        });

        if (viewport.name === '1440') {
          const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
          axeRows = results.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            nodes: violation.nodes.slice(0, 6).map((node) => ({
              target: node.target.join(' '),
              message: node.any[0]?.message ?? node.all[0]?.message ?? '',
            })),
            count: violation.nodes.length,
          }));
        }
        await context.close();
      }
      summary.push({ theme, route: route.name, violations: axeRows });
      const total = axeRows.reduce((sum, row) => sum + row.count, 0);
      console.log(`[${theme}] ${route.path}  violations: ${axeRows.length} rule(s), ${total} node(s)`);
    }
  }
} finally {
  await browser.close();
  server.close();
}

const lines = ['# 팔레트 시안 axe 요약', '', `생성: ${new Date().toISOString()}`, ''];
for (const row of summary) {
  lines.push(`## ${row.theme} · ${row.route}`);
  if (row.violations.length === 0) {
    lines.push('- 위반 없음', '');
    continue;
  }
  for (const violation of row.violations) {
    lines.push(`- **${violation.id}** (${violation.impact}) · ${violation.count}개 노드`);
    for (const node of violation.nodes) {
      lines.push(`  - \`${node.target}\` — ${node.message}`);
    }
  }
  lines.push('');
}
await writeFile(`${OUT}/axe-summary.md`, lines.join('\n'), 'utf8');
console.log(`\n저장: ${OUT}/palette-*.png, ${OUT}/axe-summary.md`);
