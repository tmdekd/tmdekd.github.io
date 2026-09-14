const dialog = document.querySelector('#email-dialog');
const email = dialog?.dataset.email ?? '';

const copyEmail = async (status) => {
  try {
    await navigator.clipboard.writeText(email);
    if (status) status.textContent = '이메일 주소가 복사되었습니다.';
  } catch {
    if (status) status.textContent = '복사에 실패했습니다. 이메일 주소를 직접 확인해 주세요.';
  }
};

document.querySelectorAll('[data-email-dialog-open]').forEach((button) => {
  button.addEventListener('click', () => dialog?.showModal());
});

document.querySelectorAll('[data-email-dialog-close]').forEach((button) => {
  button.addEventListener('click', () => dialog?.close());
});

dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

document.querySelectorAll('[data-email-copy]').forEach((button) => {
  button.addEventListener('click', () => {
    const status = button.closest('dialog')?.querySelector('[role="status"]')
      ?? document.querySelector('#email-copy-status');
    void copyEmail(status);
  });
});
