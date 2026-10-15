/**
 * 모션 게이트. 모든 animate 호출은 이 모듈을 통해서만 한다.
 *
 * - `public/scripts/motion-flag.js`가 head에서 html[data-motion="ok"]를 켠 경우에만 동작한다.
 * - WAAPI 기반 Motion은 global.css의 `animation-duration: 0.01ms !important`(reduced-motion)를 받지 않으므로
 *   이 JS 게이트가 유일한 방어선이다.
 * - HTML/CSS 기본 상태 = 최종(보이는) 상태. claim()이 대상을 숨기고 'running'으로 넘겨받은 뒤에만 애니메이션한다.
 */
import { animate, inView, stagger } from 'motion';

export { animate, inView, stagger };
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function motionAllowed(): boolean {
  const flag = document.documentElement.dataset.motion;
  return flag === 'ok' || flag === 'running';
}

/** 애니메이션 대상을 넘겨받는다. 모션이 허용되지 않으면 false를 돌려주고 아무것도 숨기지 않는다. */
export function claim(targets: Iterable<Element>): boolean {
  if (!motionAllowed()) return false;
  for (const element of targets) (element as HTMLElement).style.opacity = '0';
  document.documentElement.dataset.motion = 'running';
  return true;
}
