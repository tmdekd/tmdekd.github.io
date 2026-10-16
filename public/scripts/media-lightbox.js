// 본문 이미지 "크게 보기" — [data-lightbox-src] 버튼 클릭을 위임 처리한다. 모션 없음(감속 모션과 무관).
const dialog = document.querySelector('#media-lightbox');
const stage = dialog?.querySelector('[data-lightbox-stage]');
const image = stage?.querySelector('img');
const caption = dialog?.querySelector('#media-lightbox-caption');
let opener;

if (dialog && stage && image && caption) {
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-lightbox-src]') : null;
    if (!button) return;
    event.preventDefault();
    opener = button;
    const alt = button.getAttribute('data-lightbox-alt') ?? '';
    const text = button.getAttribute('data-lightbox-caption') || alt;
    caption.textContent = text;
    image.alt = alt;
    stage.setAttribute('aria-busy', 'true');
    image.onload = () => stage.removeAttribute('aria-busy');
    image.onerror = () => stage.removeAttribute('aria-busy');
    image.src = button.getAttribute('data-lightbox-src') ?? '';
    dialog.showModal();
  });

  dialog.querySelectorAll('[data-lightbox-close]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });

  dialog.addEventListener('click', (event) => {
    // 패널 바깥(배경) 클릭으로 닫기. 이미지·바 영역은 제외
    if (event.target === dialog || event.target === stage) dialog.close();
  });

  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    opener?.focus();
    opener = undefined;
  });
}
