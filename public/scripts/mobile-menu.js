const header = document.querySelector('.site-header');
const toggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-mobile-menu]');

if (header && toggle && menu) {
  const closeMenu = (restoreFocus = false) => {
    menu.dataset.open = 'false';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '메뉴 열기');
    if (restoreFocus) toggle.focus();
  };

  const openMenu = () => {
    menu.dataset.open = 'true';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', '메뉴 닫기');
  };

  toggle.addEventListener('click', () => {
    if (menu.dataset.open === 'true') closeMenu(true);
    else openMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.dataset.open === 'true') closeMenu(true);
  });

  document.addEventListener('pointerdown', (event) => {
    if (menu.dataset.open === 'true' && !header.contains(event.target)) closeMenu();
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
}
