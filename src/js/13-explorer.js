// ── RESULTS EXPLORER (v3.2) ───────────────────────────────────────────────
// Interactive volcano, gene lookup, top-gene table and enrichment browser,
// read from the project's results/ through the local server. No plotting
// library: a canvas for the ~20k points, SVG for one gene's counts.
const RX = { rows: [], norm: null, samples: [], cond: {}, pts: [], sel: null, sortKey: 'padj', sortAsc: true };

// RFC 4180-ish: quoted fields, doubled quotes, commas and newlines inside quotes
function rxParseCsv(text) {
  const out = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(f); f = ''; if (row.length > 1 || row[0] !== '') out.push(row); row = [];
    } else f += c;
  }
  if (f !== '' || row.length) { row.push(f); out.push(row); }
  const head = out.shift() || [];
  return out.map(r => Object.fromEntries(head.map((h, k) => [h, r[k]])));
}
const rxNum = v => (v === undefined || v === '' || v === 'NA') ? NaN : Number(v);
const rxFmt = (v, d = 3) => Number.isFinite(v) ? (Math.abs(v) < 1e-3 && v !== 0 ? v.toExponential(2) : v.toFixed(d)) : 'NA';
const rxEsc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function rxFetchCsv(path, optional) {
  const r = await fetch(fileUrl(path));
  if (!r.ok) { if (optional) return null; throw new Error(`${path.split('/').pop()}: ${r.status === 404 ? 'not found' : 'HTTP ' + r.status}`); }
  return rxParseCsv(await r.text());
}

async function rxLoad() {
  const say = (h, c) => { const el = document.getElementById('rx-status'); el.innerHTML = h; el.style.color = c || 'var(--text3)'; };
  const base = document.getElementById('folder-preview-text')?.textContent || '';
  if (!connected) { say('The explorer reads files through the local server — connect it first.', 'var(--orange)'); return; }
  say('Loading results…');
  try {
    const reg = await fetch(`${SERVER}/scope`, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ root: base }) });
    if (!reg.ok) throw new Error((await reg.json().catch(() => ({}))).detail || 'project folder not found');
    const root = (await reg.json()).root;
    const res = await rxFetchCsv(`${root}/results/deseq2_results.csv`);
    RX.rows = res.map(r => ({
      gene: r.gene, symbol: r.symbol || r.gene, baseMean: rxNum(r.baseMean),
      lfc: rxNum(r.log2FoldChange), lfcS: rxNum(r.log2FoldChange_shrunk), padj: rxNum(r.padj), pvalue: rxNum(r.pvalue)
    }));
    const hasShrunk = RX.rows.some(r => Number.isFinite(r.lfcS));
    const box = document.getElementById('rx-shrunk'); box.disabled = !hasShrunk; if (!hasShrunk) box.checked = false;
    // Optional extras written from v3.2: per-sample counts and the sample sheet
    const norm = await rxFetchCsv(`${root}/results/normalized_counts.csv`, true);
    const smp = await rxFetchCsv(`${root}/results/samples.csv`, true);
    RX.norm = norm ? Object.fromEntries(norm.map(r => [r.gene, r])) : null;
    RX.samples = norm && norm.length ? Object.keys(norm[0]).filter(k => k !== 'gene') : [];
    RX.cond = smp ? Object.fromEntries(smp.map(r => [r.sample, r.condition])) : {};
    // edgeR / limma-voom comparison, when that step has been run
    const mc = await rxFetchCsv(`${root}/results/method_comparison.csv`, true);
    RX.methods = mc ? Object.fromEntries(mc.map(r => [r.gene, r])) : null;
    RX.root = root;
    document.getElementById('rx-main').style.display = '';
    say(`${RX.rows.length.toLocaleString()} genes from <code>${rxEsc(root)}/results</code>` +
        (RX.norm ? '' : ' — re-run DESeq2 with this version to see per-sample counts.'));
    rxRender();
    rxEnrichList();
  } catch (e) {
    document.getElementById('rx-main').style.display = 'none';
    say(`❌ ${rxEsc(e.message)}. Has the DESeq2 step run for this project?`, 'var(--red)');
  }
}

function rxCuts() {
  return { padj: Number(document.getElementById('rx-padj').value), lfc: Number(document.getElementById('rx-lfc').value),
           shrunk: document.getElementById('rx-shrunk').checked };
}
const rxL = (r, c) => c.shrunk && Number.isFinite(r.lfcS) ? r.lfcS : r.lfc;
function rxClass(r, c) {
  const l = rxL(r, c);
  if (!(r.padj < c.padj) || !(Math.abs(l) > c.lfc)) return 0;
  return l > 0 ? 1 : -1;
}

function rxRender() {
  const c = rxCuts();
  const sig = RX.rows.filter(r => rxClass(r, c) !== 0);
  const up = sig.filter(r => rxL(r, c) > 0).length;
  document.getElementById('rx-summary').innerHTML =
    `<b class="up">${up.toLocaleString()} up</b> · <b class="down">${(sig.length - up).toLocaleString()} down</b> ` +
    `at padj &lt; ${c.padj} and |log2FC| &gt; ${c.lfc} (${c.shrunk ? 'shrunken' : 'unshrunken'} fold changes)`;
  rxVolcano(c);
  rxTable(sig, c);
}

function rxVolcano(c) {
  const cv = document.getElementById('rx-volcano');
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 600, H = 380;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const col = n => css.getPropertyValue(n).trim();
  const pts = RX.rows.filter(r => Number.isFinite(rxL(r, c)) && Number.isFinite(r.padj));
  const ys = pts.map(r => -Math.log10(Math.max(r.padj, 1e-300)));
  const xMax = Math.max(1, ...pts.map(r => Math.abs(rxL(r, c)))) * 1.05;
  const yMax = Math.max(2, ...ys) * 1.05;
  const m = { l: 46, r: 12, t: 12, b: 36 };
  const X = v => m.l + (v + xMax) / (2 * xMax) * (W - m.l - m.r);
  const Y = v => H - m.b - v / yMax * (H - m.t - m.b);
  g.clearRect(0, 0, W, H);
  // axes and threshold lines
  g.strokeStyle = col('--border2'); g.fillStyle = col('--text3'); g.lineWidth = 1; g.font = '11px ' + col('--font');
  g.beginPath(); g.moveTo(m.l, m.t); g.lineTo(m.l, H - m.b); g.lineTo(W - m.r, H - m.b); g.stroke();
  g.setLineDash([4, 4]); g.strokeStyle = col('--border');
  [-c.lfc, c.lfc].forEach(v => { if (c.lfc > 0) { g.beginPath(); g.moveTo(X(v), m.t); g.lineTo(X(v), H - m.b); g.stroke(); } });
  g.beginPath(); g.moveTo(m.l, Y(-Math.log10(c.padj))); g.lineTo(W - m.r, Y(-Math.log10(c.padj))); g.stroke(); g.setLineDash([]);
  g.textAlign = 'center';
  for (let v = -Math.floor(xMax); v <= Math.floor(xMax); v += Math.max(1, Math.floor(xMax / 4))) g.fillText(v, X(v), H - m.b + 14);
  g.fillText('log2 fold change' + (c.shrunk ? ' (shrunken)' : ''), (m.l + W - m.r) / 2, H - 6);
  g.textAlign = 'right';
  const step = Math.max(1, Math.ceil(yMax / 5));
  for (let v = 0; v <= yMax; v += step) g.fillText(v, m.l - 6, Y(v) + 4);
  g.save(); g.translate(12, (m.t + H - m.b) / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('-log10 padj', 0, 0); g.restore();
  // points: not significant first, so coloured ones sit on top
  const colours = { 0: col('--text3'), 1: col('--orange'), '-1': col('--blue') };
  RX.pts = pts.map((r, k) => ({ r, x: X(rxL(r, c)), y: Y(ys[k]), k: rxClass(r, c) }));
  [0, -1, 1].forEach(k => {
    g.fillStyle = colours[k]; g.globalAlpha = k === 0 ? 0.35 : 0.8;
    RX.pts.forEach(p => { if (p.k === k) { g.beginPath(); g.arc(p.x, p.y, k ? 2.4 : 1.6, 0, 6.283); g.fill(); } });
  });
  g.globalAlpha = 1;
  // label the 10 most significant, plus the selected gene
  g.fillStyle = col('--text'); g.font = '600 11px ' + col('--font'); g.textAlign = 'left';
  RX.pts.filter(p => p.k).sort((a, b) => a.r.padj - b.r.padj).slice(0, 10)
    .forEach(p => g.fillText(p.r.symbol, p.x + 4, p.y - 4));
  const s = RX.sel && RX.pts.find(p => p.r.gene === RX.sel);
  if (s) { g.strokeStyle = col('--text'); g.lineWidth = 2; g.beginPath(); g.arc(s.x, s.y, 6, 0, 6.283); g.stroke(); }
  cv.onmousemove = ev => {
    const b = cv.getBoundingClientRect(), x = ev.clientX - b.left, y = ev.clientY - b.top;
    let best = null, bd = 64;
    for (const p of RX.pts) { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = p; } }
    const tip = document.getElementById('rx-tip');
    if (!best) { tip.style.display = 'none'; cv.style.cursor = 'crosshair'; return; }
    cv.style.cursor = 'pointer';
    tip.style.display = 'block'; tip.style.left = best.x + 'px'; tip.style.top = best.y + 'px';
    tip.textContent = `${best.r.symbol}  log2FC ${rxFmt(rxL(best.r, c), 2)}  padj ${rxFmt(best.r.padj)}`;
    cv.onclick = () => rxSelect(best.r.gene);
  };
  cv.onmouseleave = () => { document.getElementById('rx-tip').style.display = 'none'; };
}

function rxTable(sig, c) {
  const k = RX.sortKey, dir = RX.sortAsc ? 1 : -1;
  const val = r => k === 'symbol' ? r.symbol.toLowerCase() : k === 'lfc' ? rxL(r, c) : r[k];
  const rows = sig.slice().sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * dir);
  RX.visible = rows;
  document.getElementById('rx-count').textContent = `${rows.length.toLocaleString()} genes${rows.length > 500 ? ' (first 500 shown)' : ''}`;
  const th = (key, label) => `<th onclick="rxSort('${key}')">${label}${RX.sortKey === key ? (RX.sortAsc ? ' ▲' : ' ▼') : ''}</th>`;
  document.getElementById('rx-table').innerHTML =
    `<thead><tr>${th('symbol', 'Gene')}${th('lfc', 'log2FC')}${th('padj', 'padj')}${th('baseMean', 'Mean count')}</tr></thead><tbody>` +
    rows.slice(0, 500).map(r => `<tr data-g="${rxEsc(r.gene)}" class="${r.gene === RX.sel ? 'sel' : ''}">` +
      `<td>${rxEsc(r.symbol)}</td><td>${rxFmt(rxL(r, c), 2)}</td><td>${rxFmt(r.padj)}</td><td>${rxFmt(r.baseMean, 0)}</td></tr>`).join('') +
    `</tbody>`;
  document.querySelectorAll('#rx-table tbody tr').forEach(tr => tr.onclick = () => rxSelect(tr.dataset.g));
}
function rxSort(key) { RX.sortAsc = RX.sortKey === key ? !RX.sortAsc : key === 'padj' || key === 'symbol'; RX.sortKey = key; rxRender(); }

function rxSearch(q) {
  q = q.trim().toLowerCase(); if (q.length < 2) return;
  const hit = RX.rows.find(r => r.symbol.toLowerCase() === q || r.gene.toLowerCase() === q)
           || RX.rows.find(r => r.symbol.toLowerCase().startsWith(q) || r.gene.toLowerCase().startsWith(q));
  if (hit) rxSelect(hit.gene);
}

function rxSelect(gene) {
  RX.sel = gene; rxRender();
  const r = RX.rows.find(x => x.gene === gene); if (!r) return;
  const c = rxCuts(), k = rxClass(r, c);
  let html = `<h4>${rxEsc(r.symbol)}</h4><div class="id">${rxEsc(r.gene)}</div>` +
    `<dl><dt>log2FC</dt><dd>${rxFmt(r.lfc, 3)}</dd>` +
    (Number.isFinite(r.lfcS) ? `<dt>shrunken</dt><dd>${rxFmt(r.lfcS, 3)}</dd>` : '') +
    `<dt>padj</dt><dd>${rxFmt(r.padj)}</dd><dt>mean count</dt><dd>${rxFmt(r.baseMean, 1)}</dd>` +
    `<dt>call</dt><dd>${k === 1 ? 'up' : k === -1 ? 'down' : 'not significant'}</dd>` +
    rxMethodsRow(gene) + `</dl>`;
  const n = RX.norm && RX.norm[gene];
  if (n) {
    // one dot per sample, grouped by condition, on a log scale
    const groups = [...new Set(RX.samples.map(s => RX.cond[s] || '?'))];
    const vals = RX.samples.map(s => ({ s, g: RX.cond[s] || '?', v: Number(n[s]) }));
    const lg = v => Math.log10(v + 1), vmax = Math.max(1, ...vals.map(d => lg(d.v)));
    const W = 300, H = 170, ml = 40, mb = 26;
    const gx = gi => ml + (gi + 0.5) * (W - ml - 10) / groups.length;
    const y = v => H - mb - lg(v) / vmax * (H - mb - 10);
    const colr = gi => gi === 0 ? 'var(--ctrl)' : 'var(--treat)';
    html += `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Normalised counts per sample for ${rxEsc(r.symbol)}">` +
      `<line x1="${ml}" y1="10" x2="${ml}" y2="${H - mb}" stroke="var(--border2)"/>` +
      `<text x="${ml - 6}" y="${y(0) + 4}" text-anchor="end" font-size="10" fill="var(--text3)">0</text>` +
      `<text x="${ml - 6}" y="14" text-anchor="end" font-size="10" fill="var(--text3)">${Math.round(10 ** vmax - 1).toLocaleString()}</text>` +
      groups.map((gname, gi) => `<text x="${gx(gi)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--text2)">${rxEsc(gname)}</text>`).join('') +
      vals.map((d, i) => { const gi = groups.indexOf(d.g), same = vals.filter(e => e.g === d.g), j = same.indexOf(d);
        const x = gx(gi) + (j - (same.length - 1) / 2) * 9;
        return `<circle cx="${x}" cy="${y(d.v)}" r="4.5" fill="${colr(gi)}" fill-opacity="0.85"><title>${rxEsc(d.s)}: ${d.v.toLocaleString()}</title></circle>`; }).join('') +
      `</svg><div style="font-size:0.72em;color:var(--text3);">Normalised counts per sample (log scale). Hover a dot for its value.</div>`;
  }
  document.getElementById('rx-gene').innerHTML = html;
}

// "3 of 3 — DESeq2, edgeR, limma-voom" from method_comparison.csv
function rxMethodsRow(gene) {
  const m = RX.methods && RX.methods[gene];
  if (!m) return '';
  const yes = [['DESeq2', m.DESeq2], ['edgeR', m.edgeR], ['limma-voom', m.limma]]
    .filter(([, v]) => v === 'TRUE').map(([n]) => n);
  return `<dt>methods</dt><dd>${yes.length} of 3${yes.length ? ' — ' + yes.join(', ') : ''}</dd>`;
}

function rxDownload() {
  const c = rxCuts(), rows = RX.visible || [];
  const csv = ['gene,symbol,log2FoldChange,log2FoldChange_shrunk,padj,baseMean',
    ...rows.map(r => [r.gene, `"${r.symbol.replace(/"/g, '""')}"`, r.lfc, r.lfcS, r.padj, r.baseMean].join(','))].join('\n');
  saveTextFile(`significant_padj${c.padj}_lfc${c.lfc}.csv`, csv + '\n', 'text/csv');
}

// Enrichment tables written by the GSEA page, when they exist
const RX_ENRICH = [
  ['GO_BP_ORA.csv', 'GO biological process — ORA'], ['GO_MF_ORA.csv', 'GO molecular function — ORA'],
  ['GO_CC_ORA.csv', 'GO cellular component — ORA'], ['GSEA_GO_BP.csv', 'GO biological process — GSEA'],
  ['KEGG_ORA.csv', 'KEGG — ORA'], ['KEGG_GSEA.csv', 'KEGG — GSEA'],
  ['Reactome_ORA.csv', 'Reactome — ORA'], ['Reactome_GSEA.csv', 'Reactome — GSEA'],
  ['fgsea_Hallmark.csv', 'MSigDB Hallmark — fgsea']
];
async function rxEnrichList() {
  const box = document.getElementById('rx-enrich');
  const listing = await resList(`${RX.root}/results`).catch(() => ({ entries: [] }));
  const have = RX_ENRICH.filter(([f]) => listing.entries.some(e => e.name === f));
  if (!have.length) { box.innerHTML = `<div style="font-size:0.8em;color:var(--text3);">No enrichment tables yet — run the GSEA &amp; Pathway page to browse them here.</div>`; return; }
  box.innerHTML = `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:6px;"><h3 style="margin:0;">Pathways &amp; gene sets</h3>` +
    `<select id="rx-en-file" onchange="rxEnrichShow()">${have.map(([f, l]) => `<option value="${f}">${l}</option>`).join('')}</select>` +
    `<input type="search" id="rx-en-q" placeholder="Filter terms or genes" oninput="rxEnrichShow()" style="flex:1 1 160px;font:inherit;padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);"></div>` +
    `<div class="rx-table-wrap"><table class="ref-table rx-table" id="rx-en-table"></table></div>`;
  rxEnrichShow();
}
async function rxEnrichShow() {
  const f = document.getElementById('rx-en-file').value, q = (document.getElementById('rx-en-q').value || '').toLowerCase();
  RX.enrich = RX.enrich || {};
  if (!RX.enrich[f]) RX.enrich[f] = await rxFetchCsv(`${RX.root}/results/${f}`, true) || [];
  const rows = RX.enrich[f].filter(r => !q || (r.Description || r.pathway || '').toLowerCase().includes(q) || (r.core_enrichment || r.geneID || r.leadingEdge || '').toLowerCase().includes(q));
  const gsea = rows.length && 'NES' in rows[0];
  document.getElementById('rx-en-table').innerHTML =
    `<thead><tr><th>Term</th><th>${gsea ? 'NES' : 'Genes'}</th><th>padj</th></tr></thead><tbody>` +
    rows.slice(0, 300).map(r => `<tr title="${rxEsc((r.geneID || r.core_enrichment || r.leadingEdge || '').split('/').slice(0, 30).join(', '))}"><td>${rxEsc(r.Description || (r.pathway || '').replace(/^HALLMARK_/, '').replace(/_/g, ' ') || r.ID)}</td>` +
      `<td>${gsea ? rxFmt(rxNum(r.NES), 2) : rxEsc(r.Count || '')}</td><td>${rxFmt(rxNum(r['p.adjust'] ?? r.padj))}</td></tr>`).join('') +
    `</tbody>`;
}
window.addEventListener('resize', () => { if (RX.rows.length && document.getElementById('rx-main').style.display !== 'none') rxRender(); });

