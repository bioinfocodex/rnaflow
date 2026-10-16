// ── PUBLIC ACCESSION IMPORT (v3) ──────────────────────────────────────────
// GEO series and SRA/ENA studies resolve to a run list, so a user pastes one
// accession instead of typing twenty. Both APIs send CORS headers, so this
// works from the browser with no local server involved.
const ENA_API    = 'https://www.ebi.ac.uk/ena/portal/api/filereport';
const EUTILS_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

let accRuns = [];

function accStatus(msg, colour) {
  const el = document.getElementById('acc-status');
  if (el) { el.innerHTML = msg; el.style.color = colour || 'var(--text3)'; }
}

// GEO series are not valid ENA search accessions — resolve GSE to its
// BioProject through NCBI first.
async function resolveGeoSeries(gse) {
  accStatus(`Resolving ${gse} through NCBI…`);
  const s = await fetch(`${EUTILS_API}/esearch.fcgi?db=gds&term=${encodeURIComponent(gse)}%5BACCN%5D&retmode=json`);
  if (!s.ok) throw new Error('NCBI lookup failed (' + s.status + ')');
  const ids = (await s.json())?.esearchresult?.idlist || [];
  // Series records are the ones prefixed 200…
  const seriesId = ids.find(i => i.startsWith('200')) || ids[0];
  if (!seriesId) throw new Error(`${gse} not found at NCBI`);

  const d = await fetch(`${EUTILS_API}/esummary.fcgi?db=gds&id=${seriesId}&retmode=json`);
  if (!d.ok) throw new Error('NCBI summary failed (' + d.status + ')');
  const rec = (await d.json())?.result?.[seriesId] || {};
  const sra = (rec.extrelations || []).find(r => r.relationtype === 'SRA');
  const target = rec.bioproject || sra?.targetobject;
  if (!target) throw new Error(`${gse} has no linked SRA data (it may be array-based, not RNA-seq)`);
  return { accession: target, title: rec.title || '' };
}

function parseTsv(text) {
  const rows = text.trim().split('\n');
  if (rows.length < 2) return [];
  const head = rows[0].split('\t');
  return rows.slice(1).map(line => {
    const cells = line.split('\t');
    const o = {};
    head.forEach((h, i) => o[h] = (cells[i] || '').trim());
    return o;
  });
}

async function lookupAccession() {
  const btn = document.getElementById('acc-btn');
  const raw = val('acc-input', '');
  if (!raw) { accStatus('Enter an accession first.', 'var(--orange)'); return; }

  btn.disabled = true;
  document.getElementById('acc-results').style.display = 'none';
  accStatus('Looking up…');

  try {
    let acc = raw.toUpperCase().trim();
    let title = '';
    if (/^GSE\d+$/.test(acc)) {
      const r = await resolveGeoSeries(acc);
      title = r.title;
      accStatus(`${acc} → ${r.accession}. Fetching run list from ENA…`);
      acc = r.accession;
    } else {
      accStatus(`Fetching run list for ${acc} from ENA…`);
    }

    const fields = 'run_accession,sample_title,sample_alias,library_layout,read_count,scientific_name,fastq_ftp,library_strategy';
    const url = `${ENA_API}?accession=${encodeURIComponent(acc)}&result=read_run&fields=${fields}&format=tsv&limit=1000`;
    const res = await fetch(url);
    const body = await res.text();
    if (!res.ok || body.startsWith('Accession')) {
      throw new Error(body.split('\n')[0] || ('ENA returned ' + res.status));
    }
    accRuns = parseTsv(body);
    if (!accRuns.length) throw new Error('No sequencing runs found for ' + acc);

    renderAccessionTable(title);
    accStatus(`Found <strong style="color:var(--green)">${accRuns.length}</strong> runs in ${acc}` +
              (title ? ` — ${title}` : ''), 'var(--text2)');
  } catch (e) {
    accStatus('❌ ' + e.message +
      '<br><span style="color:var(--text3)">Check the accession, or your internet connection. ' +
      'You can still type accessions manually below.</span>', 'var(--red)');
  } finally {
    btn.disabled = false;
  }
}

function renderAccessionTable(title) {
  const t = document.getElementById('acc-table');
  const layouts = new Set(accRuns.map(r => r.library_layout).filter(Boolean));
  const species = new Set(accRuns.map(r => r.scientific_name).filter(Boolean));
  const strategies = new Set(accRuns.map(r => r.library_strategy).filter(Boolean));

  let html = '<tr><th style="width:34px;"></th><th>Run</th><th>Sample</th>' +
             '<th style="width:88px;">Layout</th><th style="width:92px;">Reads</th>' +
             '<th style="width:150px;">Assign to</th></tr>';
  accRuns.forEach((r, i) => {
    const reads = r.read_count ? Number(r.read_count).toLocaleString() : '—';
    const name  = r.sample_title || r.sample_alias || '';
    html += `<tr>
      <td><input type="checkbox" class="acc-pick" data-i="${i}" checked></td>
      <td><code>${r.run_accession}</code></td>
      <td style="font-size:0.9em;">${name.replace(/[<>]/g, '')}</td>
      <td style="font-size:0.85em;">${r.library_layout || '—'}</td>
      <td style="font-size:0.85em;text-align:right;">${reads}</td>
      <td>
        <select class="acc-group" data-i="${i}" style="width:100%;padding:3px 6px;font-size:0.82em;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text);">
          <option value="ctrl">Control</option>
          <option value="treat">Treatment</option>
          <option value="skip">Skip</option>
        </select>
      </td></tr>`;
  });
  t.innerHTML = html;
  document.getElementById('acc-results').style.display = '';

  const notes = [];
  if (layouts.size === 1) notes.push(`Read type will be set to <strong>${[...layouts][0] === 'PAIRED' ? 'paired-end' : 'single-end'}</strong>.`);
  if (layouts.size > 1)  notes.push(`⚠️ This study mixes ${[...layouts].join(' and ')} runs — RNAflow handles one read type at a time, so import them separately.`);
  if (species.size === 1) notes.push(`Organism: <strong>${[...species][0]}</strong>.`);
  if (strategies.size && ![...strategies].includes('RNA-Seq')) {
    notes.push(`⚠️ Library strategy is ${[...strategies].join(', ')} — check this is RNA-seq before running the pipeline.`);
  }
  document.getElementById('acc-note').innerHTML = notes.join(' ');
}

function accAssignAll(group) {
  document.querySelectorAll('.acc-group').forEach(s => s.value = group);
}

function applyAccession() {
  const picks = { ctrl: [], treat: [] };
  document.querySelectorAll('.acc-pick').forEach(cb => {
    if (!cb.checked) return;
    const i = cb.dataset.i;
    const g = document.querySelector(`.acc-group[data-i="${i}"]`)?.value;
    if (g === 'ctrl' || g === 'treat') picks[g].push(accRuns[i].run_accession);
  });

  if (!picks.ctrl.length && !picks.treat.length) {
    accStatus('Nothing selected — tick some runs and assign them to a group.', 'var(--orange)');
    return;
  }

  // Importing means the data comes from SRA, not a local folder
  const ds = document.getElementById('cfg-datasource');
  if (ds) ds.value = 'sra';

  const layouts = new Set(accRuns.map(r => r.library_layout).filter(Boolean));
  if (layouts.size === 1) {
    document.getElementById('cfg-readtype').value =
      [...layouts][0] === 'PAIRED' ? 'paired' : 'single';
  }

  if (picks.ctrl.length)  fillSamples('ctrl-rows',  picks.ctrl);
  if (picks.treat.length) fillSamples('treat-rows', picks.treat);

  applyDataSource();
  updateAll();

  accStatus(`✅ Added ${picks.ctrl.length} control and ${picks.treat.length} treatment runs. ` +
            `Now set the condition names below, then work through the pipeline.`, 'var(--green)');
  document.getElementById('cfg-ctrl')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

