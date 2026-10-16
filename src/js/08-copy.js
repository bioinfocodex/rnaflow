// ── COPY ──────────────────────────────────────────────────────────────────
function copyBlock(btn) {
  const pre = btn.closest('.code-block').querySelector('pre.code');
  navigator.clipboard.writeText(pre.textContent.trim()).then(() => {
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

// Copy a literal string (used by the server-setup panels). This was
// referenced by those Copy buttons but never defined, so they did nothing.
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}

function set(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}


