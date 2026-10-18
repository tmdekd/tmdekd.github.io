/**
 * 원본 포트폴리오 미디어 가져오기
 *
 * 실행: `npm run media:import`
 * - 매핑표 scripts/media/portfolio-media.map.json 을 읽어 자료 폴더 원본 또는 pptx 슬라이드 미디어를 public/media/ 로 변환한다.
 * - 이미지: WebP(품질 85, 최대 폭 2000; maxWidth로 개별 지정, 업스케일 없음). 폭·높이를 src/data/media-manifest.json 에 기록(CLS 방지용).
 *   반응형용 변형(폭 800·1200, 원본보다 작을 때만)을 `<이름>-800.webp` 식으로 함께 만들고 매니페스트 `variants` 에 폭 목록을 적는다(srcset).
 * - KEEP_ORIGINALS=images_videos 로 실행하면 변환 전 원본(PNG·MP4)을 그 폴더에 같은 이름으로 복사하고 README.md 표를 만든다(폴더는 git 제외).
 * - 영상: H.264 MP4 720p(CRF 28) + 첫 프레임 포스터 WebP. ffmpeg 경로는 환경변수 FFMPEG(없으면 PATH의 ffmpeg).
 * - 원본(PNG·원본 MP4)은 저장소에 넣지 않는다. 자료 폴더는 로컬 전용. pptx는 adm-zip으로 읽는다.
 */
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const MAP = JSON.parse(await readFile(new URL('./portfolio-media.map.json', import.meta.url), 'utf8'));
const OUT_ROOT = resolve('public/media');
const MANIFEST = resolve('src/data/media-manifest.json');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const ONLY = process.env.MEDIA_ONLY ? process.env.MEDIA_ONLY.split(',') : null;
const KEEP = process.env.KEEP_ORIGINALS ? resolve(process.env.KEEP_ORIGINALS) : null;
const kept = [];

let zip = null;
async function readSource(source) {
  const [kind, rest] = source.split(/:(.+)/, 2);
  if (kind === 'assets') return { buffer: await readFile(join(MAP.roots.assets, rest)), name: rest };
  if (kind === 'pptx') {
    if (!zip) {
      const AdmZip = require('adm-zip');
      zip = new AdmZip(MAP.roots.pptx);
    }
    const buffer = zip.readFile(`ppt/media/${rest}`);
    return { buffer, name: rest };
  }
  throw new Error(`알 수 없는 source: ${source}`);
}

const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
let total = 0;

for (const item of MAP.items) {
  if (ONLY && !ONLY.some((k) => item.out.includes(k))) continue;
  const { buffer, name } = await readSource(item.source);
  const isVideo = /\.(mp4|mov|webm)$/i.test(name);
  const outBase = join(OUT_ROOT, item.out);
  await mkdir(dirname(outBase), { recursive: true });
  if (KEEP) {
    const ext = (name.match(/\.[^.]+$/) ?? ['.bin'])[0].toLowerCase();
    const keepPath = join(KEEP, `${item.out}${ext}`);
    await mkdir(dirname(keepPath), { recursive: true });
    await writeFile(keepPath, buffer);
    kept.push({ file: `${item.out}${ext}`, source: item.source, slide: item.slide, role: item.role, bytes: buffer.length });
  }

  if (!isVideo) {
    const maxWidth = item.maxWidth ?? 2000;
    const image = sharp(buffer).rotate();
    const meta = await image.metadata();
    const width = Math.min(meta.width ?? maxWidth, maxWidth);
    const out = `${outBase}.webp`;
    const info = await image.resize({ width, withoutEnlargement: true }).webp({ quality: item.quality ?? 85, effort: 5 }).toFile(out);
    const variants = [];
    for (const variantWidth of [800, 1200]) {
      if (variantWidth >= info.width) continue;
      const variant = await sharp(buffer).rotate().resize({ width: variantWidth }).webp({ quality: item.quality ?? 85, effort: 5 }).toFile(`${outBase}-${variantWidth}.webp`);
      variants.push(variantWidth);
      total += variant.size;
    }
    variants.push(info.width);
    manifest[`/media/${item.out}.webp`] = { width: info.width, height: info.height, bytes: info.size, alt: item.alt, slide: item.slide, role: item.role, source: item.source, sourceSize: `${meta.width}x${meta.height}`, variants };
    total += info.size;
    console.log(`[img] ${item.out}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB  ← ${name} (${meta.width}x${meta.height}) 변형 ${variants.join('/')}`);
    continue;
  }

  // 영상: 임시 원본 → ffmpeg → mp4 + 포스터
  const tmpIn = join(tmpdir(), `portfolio-src-${Date.now()}-${name.replace(/[^\w.]/g, '_')}`);
  await writeFile(tmpIn, buffer);
  const outMp4 = `${outBase}.mp4`;
  const outPosterPng = join(tmpdir(), `portfolio-poster-${Date.now()}.png`);
  const enc = spawnSync(FFMPEG, ['-y', '-i', tmpIn, '-vf', "scale='min(1280,iw)':-2", '-c:v', 'libx264', '-crf', String(item.crf ?? 28), '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '96k', outMp4], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (enc.status !== 0) { console.error(enc.stderr?.toString().slice(-800)); throw new Error(`ffmpeg 실패: ${name}`); }
  const poster = spawnSync(FFMPEG, ['-y', '-ss', String(item.posterAt ?? 1), '-i', outMp4, '-frames:v', '1', outPosterPng], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (poster.status !== 0) throw new Error(`포스터 추출 실패: ${name}`);
  const posterInfo = await sharp(outPosterPng).webp({ quality: 80 }).toFile(`${outBase}-poster.webp`);
  const size = (await stat(outMp4)).size;
  const probe = spawnSync(FFMPEG, ['-i', outMp4], { stdio: ['ignore', 'ignore', 'pipe'] }).stderr.toString();
  const dim = probe.match(/(\d{3,4})x(\d{3,4})/);
  manifest[`/media/${item.out}.mp4`] = { width: Number(dim?.[1] ?? posterInfo.width), height: Number(dim?.[2] ?? posterInfo.height), bytes: size, alt: item.alt, slide: item.slide, role: item.role, source: item.source, sourceBytes: buffer.length, poster: `/media/${item.out}-poster.webp` };
  manifest[`/media/${item.out}-poster.webp`] = { width: posterInfo.width, height: posterInfo.height, bytes: posterInfo.size, alt: `${item.alt} 포스터`, slide: item.slide, role: 'poster', source: item.source };
  total += size + posterInfo.size;
  await rm(tmpIn, { force: true }); await rm(outPosterPng, { force: true });
  console.log(`[vid] ${item.out}.mp4 ${(size / 1024 / 1024).toFixed(1)}MB (원본 ${(buffer.length / 1024 / 1024).toFixed(1)}MB) + 포스터`);
}

await mkdir(dirname(MANIFEST), { recursive: true });
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
if (KEEP && kept.length) {
  const rows = kept.map((k) => `| ${k.file} | ${k.source} | ${k.slide} | ${k.role} | ${(k.bytes / 1024).toFixed(0)}KB |`).join('\n');
  const head = `# 사이트에 쓰인 원본 이미지·영상\n\n생성: ${new Date().toISOString().slice(0, 10)} · KEEP_ORIGINALS=images_videos npm run media:import\n변환 전 원본 그대로(PNG·MP4). 사이트는 public/media 의 WebP·H.264 변환본을 쓴다. 이 폴더는 git 에서 제외.\n\n| 파일 | 원본 소스 | PDF 쪽 | 역할 | 크기 |\n|---|---|---|---|---|\n`;
  await writeFile(join(KEEP, 'README.md'), head + rows + '\n', 'utf8');
  console.log(`원본 ${kept.length}개 → ${KEEP}`);
}
console.log(`\n매니페스트 ${Object.keys(manifest).length}개 항목, 이번 실행 출력 ${(total / 1024 / 1024).toFixed(1)}MB → ${MANIFEST}`);
