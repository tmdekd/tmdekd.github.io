/**
 * Lighthouse 검증 (최종 검증용)
 *
 * 사전 조건: `npm run build` (dist/ 필요)
 * 실행:     `npm run lab:lighthouse`
 * dist/를 로컬 서버로 띄우고 데스크톱 프리셋으로 성능·접근성만 측정해 lab-results/lighthouse/ 에 JSON과 요약을 저장한다.
 * 로컬에는 Playwright 브라우저가 없으므로 설치된 Chrome을 chrome-launcher가 찾아 쓴다.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { createStaticServer } from '../../tests/e2e/static-server.ts';

const PORT = 4324;
const OUT = 'lab-results/lighthouse';
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'lawmate', path: '/projects/lawmate/' },
];

await mkdir(OUT, { recursive: true });
const server = createStaticServer(join(process.cwd(), 'dist'));
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-first-run', '--no-default-browser-check'] });
const rows = [];

try {
  for (const route of ROUTES) {
    const result = await lighthouse(`http://127.0.0.1:${PORT}${route.path}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility'],
      formFactor: 'desktop',
      screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
      throttlingMethod: 'simulate',
      // 데스크톱 프리셋 스로틀링(lighthouse desktop constants). 지정하지 않으면 모바일 4G 기본값이 적용된다.
      throttling: { rttMs: 40, throughputKbps: 10 * 1024, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
    });
    const lhr = result.lhr;
    const audit = (id) => lhr.audits[id]?.numericValue ?? null;
    const row = {
      route: route.path,
      performance: Math.round((lhr.categories.performance.score ?? 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility.score ?? 0) * 100),
      cls: audit('cumulative-layout-shift'),
      lcpMs: audit('largest-contentful-paint'),
      tbtMs: audit('total-blocking-time'),
      fcpMs: audit('first-contentful-paint'),
    };
    rows.push(row);
    await writeFile(`${OUT}/${route.name}.json`, result.report, 'utf8');
    console.log(`[${route.path}] 성능 ${row.performance} · 접근성 ${row.accessibility} · CLS ${row.cls?.toFixed(3)} · LCP ${Math.round(row.lcpMs)}ms · TBT ${Math.round(row.tbtMs)}ms`);
  }
} finally {
  try { await chrome.kill(); } catch { /* Windows에서 임시 프로필 삭제가 EPERM으로 실패할 수 있다(결과에는 영향 없음) */ }
  server.close();
}

const lines = ['# Lighthouse 요약 (desktop, 성능·접근성)', '', `생성: ${new Date().toISOString()}`, '', '| 라우트 | 성능 | 접근성 | CLS | LCP | TBT | FCP |', '|---|---:|---:|---:|---:|---:|---:|'];
for (const row of rows) lines.push(`| ${row.route} | ${row.performance} | ${row.accessibility} | ${row.cls?.toFixed(3)} | ${Math.round(row.lcpMs)}ms | ${Math.round(row.tbtMs)}ms | ${Math.round(row.fcpMs)}ms |`);
await writeFile(`${OUT}/summary.md`, lines.join('\n'), 'utf8');
console.log(`\n저장: ${OUT}/*.json, ${OUT}/summary.md`);
