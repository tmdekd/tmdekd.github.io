import manifest from './media-manifest.json';

export interface MediaMeta {
  width: number;
  height: number;
  bytes: number;
  alt: string;
  slide?: number;
  role?: string;
  poster?: string;
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
