// ── RESULTS VIEWER (v3) ───────────────────────────────────────────────────
// Reads outputs back through the local server so plots and reports can be
// looked at in place, instead of "go find the PNG in Finder".
let resCurrentDir = '';

function resSay(html, colour) {
  const el = document.getElementById('res-status');
  if (el) { el.innerHTML = html; el.style.color = colour || 'var(--text3)'; }
}

function fileUrl(path) {
  return authUrl('/file', { path });
}

async function refreshResults() {
  const base = document.getElementById('folder-preview-text')?.textContent || '';
  const grid = document.getElementById('res-grid');
  const bar  = document.getElementById('res-folders');
  if (grid) grid.innerHTML = '';
  if (bar)  bar.innerHTML  = '';

  if (!connected) {
    resSay(serverUp
      ? '🔑 Paste the server access token to browse results.'
      : 'The viewer reads files through the local server. Start it with <code>python3 rnaflow_server.py</code>, then refresh.',
      'var(--orange)');
    return;
  }

  resSay('Looking for outputs…');
  try {
    // Register the project folder once; the server refuses paths outside it
    const reg = await fetch(`${SERVER}/scope`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ root: base })
    });
    if (!reg.ok) {
      const e = await reg.json().catch(() => ({}));
      resSay(`❌ ${e.detail || 'Could not open that project folder.'}<br>` +
             `<span style="color:var(--text3)">Expected at <code>${base}</code> — has the pipeline run yet?</span>`,
             'var(--red)');
      return;
    }
    const root = (await reg.json()).root;

    // Offer the folders that actually exist
    const top = await resList(root);
    const dirs = top.entries.filter(e => e.dir).map(e => e.name);
    const preferred = ['results', 'qc', 'counts', 'aligned', 'trimmed', 'logs']
      .filter(d => dirs.includes(d));
    const rest = dirs.filter(d => !preferred.includes(d));
    [...preferred, ...rest].forEach(name => {
      const b = document.createElement('button');
      b.className = 'btn btn-ghost';
      b.style.cssText = 'font-size:0.78em;padding:4px 12px;';
      b.textContent = name;
      b.onclick = () => showResultsDir(`${root}/${name}`, b);
      bar.appendChild(b);
    });

    const first = preferred[0] || rest[0];
    if (!first) {
      resSay(`Project folder found, but it has no subfolders yet — run the pipeline first.`, 'var(--text3)');
      return;
    }
    showResultsDir(`${root}/${first}`, bar.querySelector('button'));
  } catch (e) {
    resSay('❌ ' + e.message, 'var(--red)');
  }
}

async function resList(path) {
  const r = await fetch(authUrl('/ls', { path }), { headers: authHeaders() });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || `Could not list ${path}`);
  }
  return r.json();
}

function humanSize(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(1) + ' GB';
}

async function showResultsDir(path, btn) {
  resCurrentDir = path;
  document.querySelectorAll('#res-folders button').forEach(b => b.style.borderColor = '');
  if (btn) btn.style.borderColor = 'var(--green)';

  const grid = document.getElementById('res-grid');
  grid.innerHTML = '';
  let listing;
  try { listing = await resList(path); }
  catch (e) { resSay('❌ ' + e.message, 'var(--red)'); return; }

  const files = listing.entries.filter(e => !e.dir);
  if (!files.length) {
    resSay(`Nothing in <code>${path}</code> yet.`, 'var(--text3)');
    return;
  }
  resSay(`${files.length} file${files.length !== 1 ? 's' : ''} in <code>${path}</code>`, 'var(--text2)');

  files.forEach(f => grid.appendChild(resultCard(f)));
}

function resultCard(f) {
  const card = document.createElement('div');
  card.style.cssText = 'border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--bg2);';

  const head = document.createElement('div');
  head.style.cssText = 'padding:8px 10px;font-size:0.78em;display:flex;gap:8px;align-items:center;border-bottom:1px solid var(--border);';
  head.innerHTML = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--mono);">${f.name}</span>
                    <span style="color:var(--text3);white-space:nowrap;">${humanSize(f.size)}</span>`;
  card.appendChild(head);

  const body = document.createElement('div');
  body.style.cssText = 'padding:10px;min-height:60px;';

  if (!f.viewable) {
    body.innerHTML = `<div style="font-size:0.78em;color:var(--text3);">Not previewable here — open it from your file manager.</div>`;
  } else if (f.kind.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = fileUrl(f.path);
    img.style.cssText = 'width:100%;height:auto;border-radius:6px;background:#fff;cursor:zoom-in;';
    img.loading = 'lazy';
    img.onclick = () => openResultFull(f);
    img.onerror = () => { body.innerHTML = '<div style="font-size:0.78em;color:var(--red)">Could not load image.</div>'; };
    body.appendChild(img);
  } else if (f.kind === 'text/html') {
    const b = document.createElement('button');
    b.className = 'btn btn-ghost';
    b.style.cssText = 'font-size:0.78em;width:100%;';
    b.textContent = '⬈ Open report';
    b.onclick = () => openResultFull(f);
    body.appendChild(b);
  } else if (f.kind === 'application/pdf') {
    const b = document.createElement('button');
    b.className = 'btn btn-ghost';
    b.style.cssText = 'font-size:0.78em;width:100%;';
    b.textContent = '⬈ Open PDF';
    b.onclick = () => openResultFull(f);
    body.appendChild(b);
  } else {
    const pre = document.createElement('pre');
    pre.style.cssText = 'margin:0;font-size:0.68em;max-height:150px;overflow:auto;color:var(--text2);white-space:pre;';
    pre.textContent = 'loading…';
    fetch(fileUrl(f.path), { headers: authHeaders() })
      .then(r => r.text())
      .then(t => { pre.textContent = t.split('\n').slice(0, 12).join('\n'); })
      .catch(() => { pre.textContent = '(could not read)'; });
    body.appendChild(pre);
  }

  card.appendChild(body);
  return card;
}

// Reports are built from tool output and file names, so they are treated as
// untrusted: shown in a sandboxed iframe that cannot reach this page or its
// stored token, on top of the server's own CSP.
function openResultFull(f) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:9999;display:flex;flex-direction:column;padding:24px;';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:12px;align-items:center;color:#fff;font-size:0.85em;margin-bottom:10px;font-family:var(--mono);';
  bar.innerHTML = `<span style="flex:1;">${f.name}</span>`;
  const close = document.createElement('button');
  close.className = 'btn btn-ghost';
  close.style.cssText = 'font-size:0.8em;color:#fff;border-color:#666;';
  close.textContent = '✕ Close';
  close.onclick = () => overlay.remove();
  bar.appendChild(close);
  overlay.appendChild(bar);

  if (f.kind.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = fileUrl(f.path);
    img.style.cssText = 'flex:1;min-height:0;object-fit:contain;background:#fff;border-radius:8px;';
    overlay.appendChild(img);
  } else {
    const frame = document.createElement('iframe');
    frame.src = fileUrl(f.path);
    // allow-same-origin, but deliberately NOT allow-scripts: with no script
    // execution the same-origin grant is inert (nothing can read localStorage),
    // and the server also sends script-src 'none'. A fully opaque sandbox is
    // not usable here — Chrome's Private Network Access rules block an
    // opaque-origin frame from loading over 127.0.0.1 at all.
    frame.setAttribute('sandbox', 'allow-same-origin')
    frame.style.cssText = 'flex:1;min-height:0;border:none;border-radius:8px;background:#fff;';
    overlay.appendChild(frame);
  }

  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
  });
  document.body.appendChild(overlay);
}

