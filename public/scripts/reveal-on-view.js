// 섹션 진입 리빌 (절제): [data-reveal] 요소가 뷰포트에 들어오면 .is-revealed 를 붙인다.
// 실제 전환(opacity + translate)은 global.css 가 맡고, 같은 부모 안의 형제끼리 40ms씩 지연을 둔다.
// prefers-reduced-motion 이면 아무것도 하지 않아 HTML 기본 상태(모두 보임)가 유지된다.
const initializeReveal = () => {
  const targets = Array.from(document.querySelectorAll('[data-reveal]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!targets.length || reduceMotion.matches || !('IntersectionObserver' in window)) return;

  const stagger = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-reveal-stagger')) || 40;
  targets.forEach((target) => {
    const siblings = target.parentElement ? Array.from(target.parentElement.children).filter((child) => child.hasAttribute('data-reveal')) : [target];
    const index = Math.max(0, siblings.indexOf(target));
    target.style.transitionDelay = `${Math.min(index, 7) * stagger}ms`;
  });

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      currentObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  document.documentElement.dataset.revealReady = 'true';
  targets.forEach((target) => observer.observe(target));
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeReveal, { once: true });
else initializeReveal();
