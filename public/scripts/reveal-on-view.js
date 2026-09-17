const initializeReveal = () => {
  const targets = Array.from(document.querySelectorAll('[data-reveal]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!targets.length || reduceMotion.matches || !('IntersectionObserver' in window)) return;

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
