/**
 * 모션 게이트. 모든 animate 호출은 이 모듈을 통해서만 한다.
 *
 * - `public/scripts/motion-flag.js`(head)가 prefers-reduced-motion이 아닐 때만 html[data-motion="ok"]를 켠다.
 * - CSS는 data-motion이 ok/running일 때만 [data-hero-anim]을 숨긴다. HTML 기본 상태 = 최종(보이는) 상태.
 * - WAAPI 기반 Motion은 global.css의 `animation-duration: 0.01ms !important`를 받지 않으므로 이 게이트가 유일한 방어선이다.
 * - 안전망 2단: head 스크립트가 3초 안에 'running'으로 바뀌지 않으면 'ok'를 풀고, 여기서는 'running' 후 4초가 지나면 'done'으로 바꿔
 *   애니메이션이 중간에 실패해도 숨김 CSS가 풀리게 한다.
 * - 번들: motion/mini (WAAPI 전용 animate, 약 2.5KB gzip). transform은 문자열 키프레임으로 쓴다.
 */
import { animate } from 'motion/mini';

export { animate };
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function motionAllowed(): boolean {
  const flag = document.documentElement.dataset.motion;
  return flag === 'ok' || flag === 'running';
}

/** 애니메이션을 시작할 수 있으면 'running'으로 넘겨받고 true. 아니면 false(아무것도 숨기지 않음). */
export function claim(): boolean {
  if (!motionAllowed()) return false;
  const root = document.documentElement;
  if (root.dataset.motion !== 'running') {
    root.dataset.motion = 'running';
    window.setTimeout(() => { if (root.dataset.motion === 'running') root.dataset.motion = 'done'; }, 4000);
  }
  return true;
}

/** 시퀀스가 끝났을 때 호출. 숨김 CSS를 해제한다(인라인 최종값은 Motion이 유지). */
export function finish(): void {
  if (document.documentElement.dataset.motion === 'running') document.documentElement.dataset.motion = 'done';
}
