const hashTargetId = (link) => {
  const href = link.getAttribute('href');
  return href?.startsWith('#') ? decodeURIComponent(href.slice(1)) : undefined;
};

const initializeSectionNavigation = () => {
  document.querySelectorAll('[data-section-navigation]').forEach((navigation) => {
    const items = Array.from(navigation.querySelectorAll('a')).map((link) => {
      const id = hashTargetId(link);
      const section = id ? document.getElementById(id) : null;
      return section ? { id, link, section } : null;
    }).filter(Boolean);

    if (!items.length) return;

    const setCurrent = (id) => {
      items.forEach((item) => {
        if (item.id === id) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      });
    };

    const updateCurrent = () => {
      const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
      const localNavigationHeight = navigation.dataset.sectionNavigation === 'project'
        ? navigation.getBoundingClientRect().height
        : 0;
      const scrollPaddingTop = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const marker = headerHeight + localNavigationHeight + scrollPaddingTop + 24;
      let current = items[0];

      items.forEach((item) => {
        if (item.section.getBoundingClientRect().top <= marker) current = item;
      });

      setCurrent(current.id);
    };

    const observer = new IntersectionObserver(updateCurrent, {
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0, 0.1],
    });

    items.forEach((item) => observer.observe(item.section));
    navigation.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      const id = link ? hashTargetId(link) : undefined;
      if (id) setCurrent(id);
    });
    window.addEventListener('scroll', updateCurrent, { passive: true });
    window.addEventListener('hashchange', updateCurrent);
    updateCurrent();
  });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeSectionNavigation, { once: true });
else initializeSectionNavigation();
