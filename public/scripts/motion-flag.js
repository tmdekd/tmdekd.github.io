// 모션 허용 플래그 (head에서 동기 로드, 3줄짜리 게이트)
// - prefers-reduced-motion: reduce 면 아무것도 하지 않는다 → HTML 기본 상태(모두 보임)가 그대로 최종 상태.
// - 허용이면 html[data-motion="ok"]를 켠다. CSS는 이 속성이 있을 때만 [data-hero-anim]을 숨긴다.
// - 모듈 스크립트가 3초 안에 넘겨받지(running) 못하면 플래그를 풀어 콘텐츠가 숨겨진 채 남지 않게 한다.
(function () {
  var root = document.documentElement;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.dataset.motion = 'ok';
  window.setTimeout(function () { if (root.dataset.motion === 'ok') delete root.dataset.motion; }, 3000);
})();
