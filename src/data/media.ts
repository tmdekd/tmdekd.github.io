import manifest from './media-manifest.json';

export interface MediaMeta {
  width: number;
  height: number;
  bytes: number;
  alt: string;
  slide?: number;
  role?: string;
  poster?: string;
  /** srcset 용 변형 폭 목록(마지막이 원본 폭). media:import 가 `<이름>-<폭>.webp` 로 만든다 */
  variants?: number[];
}

const entries = manifest as Record<string, MediaMeta>;

/** media-manifest.json(스크립트 media:import가 생성)에서 폭·높이·대체 텍스트를 읽는다. 없으면 undefined. */
export function getMedia(src?: string): MediaMeta | undefined {
  if (!src) return undefined;
  return entries[src];
}

/** `폭 / 높이` 문자열 (CSS aspect-ratio 용). 매니페스트에 없으면 fallback. */
export function aspectRatioOf(src: string | undefined, fallback = '16 / 10'): string {
  const meta = getMedia(src);
  return meta ? `${meta.width} / ${meta.height}` : fallback;
}

/** 반응형 srcset. 변형이 없으면 undefined(원본 src만 사용). */
export function srcsetOf(src: string | undefined): string | undefined {
  const meta = getMedia(src);
  if (!src || !meta?.variants || meta.variants.length < 2) return undefined;
  const base = src.replace(/\.webp$/, '');
  return meta.variants.map((width) => (width === meta.width ? `${src} ${width}w` : `${base}-${width}.webp ${width}w`)).join(', ');
}

/** 역할별 sizes 프리셋. 44rem 이하는 1열(전폭)이라 100vw. */
export const SIZES = {
  /** 행 안의 이미지(근거·기능·side 고려사항): 데스크톱에서 최대 40rem */
  row: '(max-width: 44rem) 100vw, 40rem',
  /** 전폭 이미지(wide 고려사항·비교 2열): 컨테이너 최대 1184px */
  wide: '(max-width: 44rem) 100vw, (max-width: 60rem) 90vw, 1184px',
  /** 구조 파트(80% 가운데) */
  structure: '(max-width: 60rem) 100vw, 60rem',
  /** 홈 카드 */
  card: '(max-width: 44rem) 100vw, 36rem',
  /** 보조 썸네일(2열) */
  thumb: '(max-width: 44rem) 50vw, 20rem',
} as const;
