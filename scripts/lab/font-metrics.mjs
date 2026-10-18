/**
 * Pretendard 대체 폰트(맑은 고딕) 메트릭 맞춤값 계산 — CLS(웹폰트 교체 시 제목 이동) 보정용.
 * 실행: node scripts/lab/font-metrics.mjs  → size-adjust / ascent-override / descent-override / line-gap-override 출력
 * 계산식(Fontaine·Next.js 방식): size-adjust = 폴백 xAvgCharWidth/unitsPerEm ÷ 본 폰트 xAvgCharWidth/unitsPerEm 의 역수,
 * ascent-override = (본 폰트 ascent/upm) ÷ size-adjust, descent·line-gap 동일.
 */
import { fromFile } from '@capsizecss/unpack/fs';

const main = await fromFile('node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2');
const fallback = await fromFile(process.env.FALLBACK_FONT ?? 'C:/Windows/Fonts/malgun.ttf');
const avg = (m) => m.xWidthAvg / m.unitsPerEm;
const sizeAdjust = avg(main) / avg(fallback);
const pct = (v) => `${(v * 100).toFixed(2)}%`;
console.log({ main: main.familyName, fallback: fallback.familyName, mainUpm: main.unitsPerEm, fallbackUpm: fallback.unitsPerEm, mainXAvg: main.xWidthAvg, fallbackXAvg: fallback.xWidthAvg });
console.log(`size-adjust: ${pct(sizeAdjust)}`);
console.log(`ascent-override: ${pct(main.ascent / main.unitsPerEm / sizeAdjust)}`);
console.log(`descent-override: ${pct(Math.abs(main.descent) / main.unitsPerEm / sizeAdjust)}`);
console.log(`line-gap-override: ${pct(main.lineGap / main.unitsPerEm / sizeAdjust)}`);
