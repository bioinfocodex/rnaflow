// ── SAMPLE HELPERS ─────────────────────────────────────────────────────────
function addRow(id) {
  const c = document.getElementById(id);
  const r = document.createElement('div');
  r.className = 'sample-row';
  r.innerHTML = `<input type="text" value="" placeholder="SRR/ERR accession" oninput="updateAll()"><button class="del-btn" onclick="delRow(this)">✕</button>`;
  c.appendChild(r);
  updateAll();
}
function delRow(btn) {
  const rows = btn.closest('.sample-rows');
  if (rows.querySelectorAll('.sample-row').length > 1) { btn.closest('.sample-row').remove(); updateAll(); }
}
function getSamples(id) {
  return [...document.querySelectorAll(`#${id} input`)].map(i=>i.value.trim()).filter(v=>v);
}

// ── NAVIGATION ─────────────────────────────────────────────────────────────
function goTo(pageId, navEl) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (navEl) navEl.classList.add('active');
}

const doneSteps = new Set();
// Derived from the sidebar instead of hardcoded — it used to say 13 while the
// sidebar had 15 entries, so a finished project displayed "15 / 13".
const TOTAL_STEPS = document.querySelectorAll('.nav-item:not([data-nostep])').length || 15;

function renderProgress() {
  const n   = doneSteps.size;
  const pct = Math.min(n / TOTAL_STEPS * 100, 100);
  document.getElementById('sb-prog-fill').style.width = pct + '%';
  document.getElementById('sb-prog-label').textContent = n + ' / ' + TOTAL_STEPS;
  document.getElementById('tb-progress').textContent   = n + ' / ' + TOTAL_STEPS;
}

function markDone(navId) {
  doneSteps.add(navId);
  const el = document.getElementById(navId);
  if (el) {
    el.classList.add('done');
    const chk = el.querySelector('.nav-check');
    if (chk) chk.textContent = '✓';
  }
  renderProgress();
  saveConfig();
}

function clearDone(navId) {
  doneSteps.delete(navId);
  const el = document.getElementById(navId);
  if (el) {
    el.classList.remove('done');
    const chk = el.querySelector('.nav-check');
    if (chk) chk.textContent = '○';
  }
  renderProgress();
  saveConfig();
}

// ── PROJECT PERSISTENCE (v3) ──────────────────────────────────────────────
// Everything the user types is restored on reload. Before v3 only the mode,
// server and environment picks survived a refresh — accessions, organism and
// condition names were lost.
const CFG_FIELDS = [
  'cfg-loc','cfg-org-tag','cfg-readtype','cfg-datasource','cfg-fq-ext',
  'cfg-threads','cfg-method','local-fastq-path','cfg-organism','cfg-strand',
  'cfg-genome-url','cfg-gtf-url','cfg-ctrl','cfg-treat','cfg-pairs',
  'cfg-counts-path','cfg-counts-sheet','cfg-adapter',
  'hpc-host','hpc-user','hpc-data-path','hpc-cpus','hpc-mem','hpc-time',
  'hpc-jobname','hpc-partition','hpc-email',
  'cloud-host','cloud-user','cloud-work-dir','cloud-data-path','cloud-out-path'
];

let _restoring = false;

function collectConfig() {
  const fields = {};
  CFG_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) fields[id] = el.value;
  });
  return {
    version: 3,
    savedAt: new Date().toISOString(),
    fields,
    controls:  getSamples('ctrl-rows'),
    treatments: getSamples('treat-rows'),
    done: [...doneSteps],
    env: currentEnv,
    mode: currentMode
  };
}

function saveConfig() {
  if (_restoring) return;
  try { localStorage.setItem('rnaflow-project', JSON.stringify(collectConfig())); }
  catch (e) {}
}

function fillSamples(containerId, names) {
  const c = document.getElementById(containerId);
  if (!c || !names || !names.length) return;
  c.innerHTML = '';
  names.forEach(n => {
    const r = document.createElement('div');
    r.className = 'sample-row';
    r.innerHTML = `<input type="text" value="" placeholder="SRR/ERR accession" oninput="updateAll()"><button class="del-btn" onclick="delRow(this)">✕</button>`;
    r.querySelector('input').value = n;
    c.appendChild(r);
  });
}

function applyProject(p) {
  if (!p || !p.fields) return;
  _restoring = true;
  try {
    Object.entries(p.fields).forEach(([id, v]) => {
      const el = document.getElementById(id);
      if (el && v != null) el.value = v;
    });
    fillSamples('ctrl-rows',  p.controls);
    fillSamples('treat-rows', p.treatments);
    doneSteps.clear();
    (p.done || []).forEach(id => {
      doneSteps.add(id);
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('done');
        const chk = el.querySelector('.nav-check');
        if (chk) chk.textContent = '✓';
      }
    });
  } finally {
    _restoring = false;
  }
  renderProgress();
  applyMethod();
  applyDataSource();
}

function restoreConfig() {
  let raw;
  try { raw = localStorage.getItem('rnaflow-project'); } catch (e) { return; }
  if (!raw) return;
  try { applyProject(JSON.parse(raw)); } catch (e) {}
}

// Save / load a project file so an analysis can be archived or shared
function exportProject() {
  const data = collectConfig();
  const name = (val('cfg-org-tag', 'project')) + '_rnaflow.json';
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function importProject(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const p = JSON.parse(reader.result);
      if (!p.fields) throw new Error('not an RNAflow project file');
      applyProject(p);
      updateAll();
      alert('Project loaded: ' + (p.savedAt || 'unknown date'));
    } catch (e) {
      alert('Could not read that file — ' + e.message);
    }
    input.value = '';
  };
  reader.readAsText(file);
}

function resetProject() {
  if (!confirm('Clear the saved project and start fresh? This only clears the form — no files are deleted.')) return;
  try { localStorage.removeItem('rnaflow-project'); } catch (e) {}
  location.reload();
}

// ── CONFIG ACCESSORS (v3) ─────────────────────────────────────────────────
function val(id, fallback) {
  const el = document.getElementById(id);
  const v  = el ? String(el.value).trim() : '';
  return v || fallback;
}

// Where the FASTQ files live: the user's own folder, or the project raw_data
function rawDir(base) {
  if (val('cfg-datasource', 'sra') === 'local') {
    return (val('local-fastq-path', '').replace(/\/+$/, '')) || `${base}/raw_data`;
  }
  return `${base}/raw_data`;
}

// SRA delivers plain .fastq; for local files the user tells us the extension
function fqExt() {
  return val('cfg-datasource', 'sra') === 'local' ? val('cfg-fq-ext', '.fastq') : '.fastq';
}

// One source of truth for thread count — HPC uses the scheduler allocation
function threads() {
  if (['slurm', 'pbs', 'lsf'].includes(currentEnv)) return val('hpc-cpus', '8');
  return val('cfg-threads', '4');
}

// `open` is macOS-only; keep Linux users working
function openCmd(path) {
  return `# macOS: open ${path}\n# Linux: xdg-open ${path}`;
}

