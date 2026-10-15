// 팔레트 시안 미리보기 (dev 서버 전용, BaseLayout에서 import.meta.env.DEV일 때만 삽입)
// 사용: http://localhost:4321/?theme=a  (a | a-light | b | c | current)
(function () {
  var key = 'portfolio-theme-preview';
  var params = new URLSearchParams(window.location.search);
  var requested = params.get('theme');
  if (requested !== null) {
    try { localStorage.setItem(key, requested); } catch (_) { /* ignore */ }
  }
  var theme = requested;
  if (theme === null) {
    try { theme = localStorage.getItem(key); } catch (_) { theme = null; }
  }
  if (theme && theme !== 'current') {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
})();
