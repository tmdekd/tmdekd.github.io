/**
 * Pretendard Variable 을 사이트가 실제로 쓰는 글자만 담은 woff2 1파일로 서브셋한다(서체 전략 A).
 *
 * 사전 조건: `npm run build` (dist/ 의 HTML 에서 글자를 모은다)
 * 실행:     `npm run fonts:subset` → public/fonts/PretendardVariable-subset.woff2, public/fonts/pretendard-subset.glyphs.json
 *           이후 `npm run build` 를 다시 해야 public/ 의 새 파일이 dist 로 복사된다.
 * 글자 출처: dist/**\/*.html 본문 텍스트, public/scripts/*.js 의 문자열 리터럴(런타임 문구), src/data/profile.ts,
 *           고정 포함(ASCII, NBSP, 가운뎃점·대시·따옴표·화살표 등 기호).
 * tests/e2e/font-subset.spec.ts 가 dist 의 글자 집합 ⊆ glyphs.json 을 검사해 새 문장이 서브셋에 빠지면 실패한다.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import subsetFont from 'subset-font';

const SOURCE = 'node_modules/pretendard/dist/public/variable/PretendardVariable.ttf';
const OUT_DIR = 'public/fonts';
const OUT_FONT = join(OUT_DIR, 'PretendardVariable-subset.woff2');
const OUT_GLYPHS = join(OUT_DIR, 'pretendard-subset.glyphs.json');
/** 본문에 없더라도 넣어 두는 글자: ASCII 전체, NBSP, 자주 쓰는 기호 */
const FIXED = [...Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCodePoint(0x20 + i)), ' ', '·—–“”‘’…©→↗↓←↑✓×'].join('');

export async function collectSiteText(root = process.cwd()) {
  const parts = [FIXED];
  for (const file of await walk(join(root, 'dist'), (name) => name.endsWith('.html'))) parts.push(htmlText(await readFile(file, 'utf8')));
  for (const file of await walk(join(root, 'public/scripts'), (name) => name.endsWith('.js'))) parts.push(jsStrings(await readFile(file, 'utf8')));
  parts.push(jsStrings(await readFile(join(root, 'src/data/profile.ts'), 'utf8')));
  return parts.join('');
}

export function codepointsOf(text) {
  return [...new Set(Array.from(text, (ch) => ch.codePointAt(0)))].filter((cp) => cp > 0x1f && cp !== 0x7f).sort((a, b) => a - b);
}

async function walk(dir, keep) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(full, keep)));
    else if (keep(entry.name)) found.push(full);
  }
  return found;
}

function htmlText(html) {
  return decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
}

function jsStrings(source) {
  return Array.from(source.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g), (m) => m[2]).join(' ');
}

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', middot: '·', mdash: '—', ndash: '–', copy: '©', rarr: '→', larr: '←', uarr: '↑', darr: '↓' };
function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    if (body[0] === '#') return String.fromCodePoint(Number.parseInt(body[1] === 'x' || body[1] === 'X' ? body.slice(2) : body.slice(1), body[1] === 'x' || body[1] === 'X' ? 16 : 10));
    return NAMED[body.toLowerCase()] ?? match;
  });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll('\\', '/').split('/').pop())) {
  const source = await readFile(SOURCE);
  const text = await collectSiteText();
  const codepoints = codepointsOf(text);
  const subset = await subsetFont(source, String.fromCodePoint(...codepoints), {
    targetFormat: 'woff2',
    variationAxes: { wght: { min: 400, max: 800 } },
  });
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FONT, subset);
  await writeFile(OUT_GLYPHS, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: SOURCE,
    sourceSha256: createHash('sha256').update(source).digest('hex'),
    count: codepoints.length,
    hangul: codepoints.filter((cp) => cp >= 0xac00 && cp <= 0xd7a3).length,
    codepoints,
  }, null, 0), 'utf8');
  console.log(`글자 ${codepoints.length}개(한글 ${codepoints.filter((cp) => cp >= 0xac00 && cp <= 0xd7a3).length}) → ${OUT_FONT} ${(subset.length / 1024).toFixed(1)} KB (원본 ${(source.length / 1024 / 1024).toFixed(2)} MB)`);
}
