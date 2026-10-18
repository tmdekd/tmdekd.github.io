/**
 * OG 이미지(1200×630 PNG) 생성 — public/og-default.png
 * 한글 표지 문장을 SVG 텍스트로 두면 뷰어 폰트에 따라 달라지므로, 사이트와 같은 Pretendard로 HTML을 렌더해 PNG로 굳힌다.
 * 실행: node scripts/lab/og-image.mjs (설치된 Chrome 사용). 색은 tokens.css 의 Slate 900 / Sky 700 / 흰색과 동일.
 */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fontCss = resolve('node_modules/pretendard/dist/web/variable/pretendardvariable.css');
const fontUrl = pathToFileURL(fontCss).href;
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="stylesheet" href="${fontUrl}">
<style>
  html, body { margin: 0; }
  body { width: 1200px; height: 630px; background: #0f172a; color: #ffffff; font-family: "Pretendard Variable", Pretendard, sans-serif; }
  .wrap { position: relative; box-sizing: border-box; height: 100%; padding: 92px 96px; }
  .bar { width: 56px; height: 6px; background: #0369a1; margin-bottom: 36px; }
  .kicker { font-size: 26px; font-weight: 500; letter-spacing: -0.01em; opacity: 0.8; margin: 0 0 22px; }
  h1 { font-size: 64px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.2; margin: 0 0 30px; max-width: 980px; }
  .tags { display: flex; gap: 14px; font-size: 24px; font-weight: 600; opacity: 0.9; }
  .tags span { padding: 8px 16px; border: 1.5px solid rgba(255,255,255,0.35); border-radius: 6px; }
  .foot { position: absolute; left: 96px; bottom: 72px; display: flex; gap: 28px; font-size: 24px; font-weight: 500; opacity: 0.72; }
</style></head><body><div class="wrap">
  <div class="bar"></div>
  <p class="kicker">문승기 · AI Engineer</p>
  <h1>사용자가 체감하는 변화를 만드는<br>AI 엔지니어</h1>
  <div class="tags"><span>LLM</span><span>RAG</span><span>Agent</span><span>문서 파싱·검색</span></div>
  <div class="foot"><span>tmdekd.github.io</span><span>github.com/tmdekd</span></div>
</div></body></html>`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);
await page.screenshot({ path: 'public/og-default.png', type: 'png' });
await browser.close();
console.log('저장: public/og-default.png', (await readFile('public/og-default.png')).length, 'bytes');
