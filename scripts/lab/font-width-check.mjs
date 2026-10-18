/**
 * 대체 폰트(맑은 고딕)와 Pretendard의 실제 글자 폭 비율을 브라우저에서 측정한다(한글 포함 문장 기준).
 * xAvgCharWidth는 라틴 위주라 한글 비중이 큰 제목에는 맞지 않을 수 있어, 실제 문장으로 size-adjust 값을 정한다.
 * 실행: node scripts/lab/font-width-check.mjs
 */
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fontUrl = pathToFileURL(resolve('node_modules/pretendard/dist/web/variable/pretendardvariable.css')).href;
const samples = ['AI를 기능이 아닌 작동하는 구조로 만듭니다.', '프로젝트 경력 이력 사항 기술 역량', 'LAWMATE의 시스템 아키텍처', '데이터 기반 가설·실험으로 속도·정확도·비용을 개선합니다. LLM·RAG·Agent 서비스와 문서 파싱·검색 시스템을 설계하고 구현하는 AI 엔지니어입니다.', 'NeuroCare 독거노인 정서 돌봄 AI 서비스'];
const html = `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${fontUrl}">
<style>@font-face{font-family:'Fallback Raw';src:local('Malgun Gothic'),local('맑은 고딕');} span{font-size:64px;white-space:nowrap;position:absolute}</style>
${samples.map((t, i) => `<span id="p${i}" style="font-family:'Pretendard Variable';font-weight:800">${t}</span><span id="f${i}" style="font-family:'Fallback Raw';font-weight:800">${t}</span>`).join('')}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const rows = await page.evaluate((n) => Array.from({ length: n }, (_, i) => {
  const p = document.getElementById(`p${i}`).getBoundingClientRect(); const f = document.getElementById(`f${i}`).getBoundingClientRect();
  return { pretendard: Math.round(p.width), fallback: Math.round(f.width), ratio: p.width / f.width, pH: p.height, fH: f.height };
}), samples.length);
for (const [i, r] of rows.entries()) console.log(samples[i].slice(0, 24).padEnd(26), r.pretendard, r.fallback, 'width ratio', r.ratio.toFixed(4), 'line box', r.pH, r.fH);
const avg = rows.reduce((s, r) => s + r.ratio, 0) / rows.length;
console.log(`권장 size-adjust(평균 폭 비율): ${(avg * 100).toFixed(2)}%`);
await browser.close();
