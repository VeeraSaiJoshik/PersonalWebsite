const root = document.documentElement;
const themeToggle = document.querySelector('#theme-toggle');
themeToggle.addEventListener('click', () => {
  const dark = root.dataset.theme !== 'dark';
  root.dataset.theme = dark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(dark));
  document.querySelector('#theme-label').textContent = dark ? 'Daylight mode' : 'Evening mode';
});

let toastTimer;
function announce(message) {
  const toast = document.querySelector('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

async function copyText(value) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch { /* A local file may not have clipboard permission. Use a selection fallback. */ }
  const previousFocus = document.activeElement;
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.append(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* Report the visible hex instead. */ }
  field.remove();
  previousFocus?.focus({ preventScroll: true });
  return copied;
}

document.querySelectorAll('[data-hex]').forEach(button => {
  button.addEventListener('click', async () => {
    const hex = button.dataset.hex;
    announce(await copyText(hex) ? `${hex} copied` : `Color: ${hex} — select the hex text to copy.`);
  });
});

const patternSelect = document.querySelector('#pattern-select');
patternSelect.addEventListener('change', () => {
  const path = `patterns/${patternSelect.value}.svg`;
  document.querySelector('#lab-pattern').src = path;
  document.querySelector('#lab-download').href = path;
});

document.querySelectorAll('button[data-placement]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('#lab-preview').dataset.placement = button.dataset.placement;
    document.querySelectorAll('button[data-placement]').forEach(item => {
      item.setAttribute('aria-pressed', String(item === button));
    });
  });
});

document.querySelector('#pattern-opacity').addEventListener('input', event => {
  const value = event.currentTarget.value;
  document.querySelector('#lab-pattern').style.opacity = Number(value) / 100;
  document.querySelector('#opacity-value').textContent = `${value}%`;
});
