/**
 * Lighthouse 검증 (최종 검증용)
 *
 * 사전 조건: `npm run build` (dist/ 필요)
 * 실행:     `npm run lab:lighthouse` (데스크톱) · `LH_FORM=mobile npm run lab:lighthouse` (모바일 에뮬레이션 + 4G 스로틀링)
 *           `LH_ROUTES=home,lawmate` 로 라우트 제한, `LH_RUNS=5` 로 반복 측정(CLS 변동 확인용 — 요약에 최대·중앙값)
 * dist/를 로컬 서버로 띄우고 성능·접근성만 측정해 lab-results/lighthouse/ 에 JSON과 요약을 저장한다.
 * 로컬에는 Playwright 브라우저가 없으므로 설치된 Chrome을 chrome-launcher가 찾아 쓴다.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { createStaticServer } from '../../tests/e2e/static-server.ts';

const PORT = 4324;
const OUT = 'lab-results/lighthouse';
const FORM = process.env.LH_FORM === 'mobile' ? 'mobile' : 'desktop';
const RUNS = Math.max(1, Number(process.env.LH_RUNS ?? 1));
const ALL_ROUTES = [
  { name: 'home', path: '/' },
  { name: 'neurocare', path: '/projects/neurocare/' },
  { name: 'lawmate', path: '/projects/lawmate/' },
  { name: 'vino', path: '/projects/vino/' },
  { name: 'yoriwang', path: '/projects/yoriwang-jwaryong/' },
  { name: '404', path: '/404.html' },
];
const ROUTES = process.env.LH_ROUTES ? ALL_ROUTES.filter((r) => process.env.LH_ROUTES.split(',').includes(r.name)) : ALL_ROUTES.filter((r) => ['home', 'lawmate'].includes(r.name));

await mkdir(OUT, { recursive: true });
const server = createStaticServer(join(process.cwd(), 'dist'));
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-first-run', '--no-default-browser-check'] });
const rows = [];

try {
  for (const route of ROUTES) {
    const runs = [];
    for (let run = 0; run < RUNS; run += 1) {
      const result = await lighthouse(`http://127.0.0.1:${PORT}${route.path}`, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility'],
        formFactor: FORM,
        screenEmulation: FORM === 'mobile'
          ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }
          : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
        throttlingMethod: 'simulate',
        // 데스크톱은 lighthouse desktop constants, 모바일은 기본 4G(150ms RTT, 1.6Mbps, CPU 4x)
        throttling: FORM === 'mobile'
          ? { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4, requestLatencyMs: 562.5, downloadThroughputKbps: 1474.56, uploadThroughputKbps: 675 }
          : { rttMs: 40, throughputKbps: 10 * 1024, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
      });
      const lhr = result.lhr;
      const audit = (id) => lhr.audits[id]?.numericValue ?? null;
      runs.push({
        performance: Math.round((lhr.categories.performance.score ?? 0) * 100),
        accessibility: Math.round((lhr.categories.accessibility.score ?? 0) * 100),
        cls: audit('cumulative-layout-shift'),
        lcpMs: audit('largest-contentful-paint'),
        tbtMs: audit('total-blocking-time'),
        fcpMs: audit('first-contentful-paint'),
      });
      if (run === 0) await writeFile(`${OUT}/${FORM}-${route.name}.json`, result.report, 'utf8');
    }
    const median = (key) => { const v = runs.map((r) => r[key]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
    const max = (key) => Math.max(...runs.map((r) => r[key]));
    const row = { route: route.path, form: FORM, runs: RUNS, performance: median('performance'), accessibility: Math.min(...runs.map((r) => r.accessibility)), cls: median('cls'), clsMax: max('cls'), lcpMs: median('lcpMs'), tbtMs: median('tbtMs'), fcpMs: median('fcpMs') };
    rows.push(row);
    console.log(`[${FORM}] [${route.path}] 성능 ${row.performance} · 접근성 ${row.accessibility} · CLS ${row.cls?.toFixed(3)}${RUNS > 1 ? ` (max ${row.clsMax.toFixed(3)}, ${RUNS}회)` : ''} · LCP ${Math.round(row.lcpMs)}ms · TBT ${Math.round(row.tbtMs)}ms`);
  }
} finally {
  try { await chrome.kill(); } catch { /* Windows에서 임시 프로필 삭제가 EPERM으로 실패할 수 있다(결과에는 영향 없음) */ }
  server.close();
}

const lines = [`# Lighthouse 요약 (${FORM}, 성능·접근성${RUNS > 1 ? `, ${RUNS}회 중앙값` : ''})`, '', `생성: ${new Date().toISOString()}`, '', '| 라우트 | 성능 | 접근성 | CLS | CLS 최대 | LCP | TBT | FCP |', '|---|---:|---:|---:|---:|---:|---:|---:|'];
for (const row of rows) lines.push(`| ${row.route} | ${row.performance} | ${row.accessibility} | ${row.cls?.toFixed(3)} | ${row.clsMax?.toFixed(3)} | ${Math.round(row.lcpMs)}ms | ${Math.round(row.tbtMs)}ms | ${Math.round(row.fcpMs)}ms |`);
await writeFile(`${OUT}/summary-${FORM}.md`, lines.join('\n'), 'utf8');
console.log(`\n저장: ${OUT}/${FORM}-*.json, ${OUT}/summary-${FORM}.md`);
