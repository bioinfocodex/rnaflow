// ── TOAST ─────────────────────────────────────────────────────────────────
function showToast(msg, nextPageId, nextNavId) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  toastNextFn = () => goTo(nextPageId, document.getElementById(nextNavId));
  setTimeout(() => toast.classList.remove('show'), 7000);
}
function toastNext() {
  document.getElementById('toast').classList.remove('show');
  if (toastNextFn) { toastNextFn(); toastNextFn = null; }
}

// ── REBUILD RUN BUTTONS WHENEVER updateAll IS CALLED ─────────────────────
const _origUpdate = updateAll;
window.updateAll = function() {
  _origUpdate();
  setTimeout(buildAllRunButtons, 80);
};

// ── SETTINGS BAR ─────────────────────────────────────────────────────────

// Toggle a detail panel open/closed
function toggleDetail(which) {
  ['mode','server','env'].forEach(id => {
    const panel = document.getElementById('sbar-detail-' + id);
    const btn   = document.querySelector('#sbar-item-' + id + ' .sbar-help');
    if (id === which) {
      const isOpen = panel && panel.classList.contains('open');
      if (panel) panel.classList.toggle('open', !isOpen);
      if (btn)   btn.classList.toggle('active', !isOpen);
    } else {
      if (panel) panel.classList.remove('open');
      if (btn)   btn.classList.remove('active');
    }
  });
}

// Keep old toggleAcc/toggleBanner as no-ops (referenced in old HTML that may still exist)
function toggleAcc(which) { toggleDetail(which); }
function toggleBanner()   { toggleDetail('mode'); }

// ── MODE SELECT (dropdown) ────────────────────────────────────────────────
function onModeSelect(val) {
  if (!val) return;
  selectMode(val);
  // Sync the dropdown
  const sel = document.getElementById('sbar-mode-select');
  if (sel) sel.value = val;
  // Close detail panel after selection
  setTimeout(() => {
    const p = document.getElementById('sbar-detail-mode');
    const b = document.querySelector('#sbar-item-mode .sbar-help');
    if (p) p.classList.remove('open');
    if (b) b.classList.remove('active');
  }, 600);
}

// ── HOW SELECT (dropdown) ─────────────────────────────────────────────────
function onHowSelect(val) {
  showHow(val, null);
  const sel = document.getElementById('sbar-how-select');
  if (sel) sel.value = val;
}

// ── ENV SELECT (dropdown) ─────────────────────────────────────────────────
function onEnvSelect(val) {
  selectEnv(val);
  const sel = document.getElementById('sbar-env-select');
  if (sel) sel.value = val;
}

// ── MODE SELECTION ────────────────────────────────────────────────────────
let currentMode = 'none';

function selectMode(mode) {
  currentMode = mode;
  const runCard  = document.getElementById('mode-card-run');
  const copyCard = document.getElementById('mode-card-copy');
  if (runCard)  { runCard.classList.remove('selected-run','selected-copy'); }
  if (copyCard) { copyCard.classList.remove('selected-run','selected-copy'); }

  const ind   = document.getElementById('mode-indicator');
  const icon  = document.getElementById('mode-indicator-icon');
  const label = document.getElementById('mode-indicator-label');
  const sel   = document.getElementById('sbar-mode-select');

  if (mode === 'run') {
    if (runCard)  runCard.classList.add('selected-run');
    if (ind)   ind.className     = 'mode-indicator run-mode';
    if (icon)  icon.textContent  = '⚡';
    if (label) label.textContent = 'Run from app';
    if (sel)   sel.value         = 'run';
    // Show Run buttons only — hide Copy buttons
    document.querySelectorAll('.run-btn').forEach(b  => { b.style.display = ''; if (connected) b.disabled = false; });
    document.querySelectorAll('.stop-btn').forEach(b => b.style.display = '');
    document.querySelectorAll('.copy-btn').forEach(b => b.style.display = 'none');
    // Auto-open server instructions
    const srvPanel = document.getElementById('sbar-detail-server');
    const srvBtn   = document.querySelector('#sbar-item-server .sbar-help');
    if (srvPanel && !srvPanel.classList.contains('open')) {
      srvPanel.classList.add('open');
      if (srvBtn) srvBtn.classList.add('active');
    }
  } else {
    // Mode B — Run on terminal: show Copy buttons only, hide Run buttons
    if (copyCard) copyCard.classList.add('selected-copy');
    if (ind)   ind.className     = 'mode-indicator copy-mode';
    if (icon)  icon.textContent  = '📋';
    if (label) label.textContent = 'Terminal';
    if (sel)   sel.value         = 'copy';
    document.querySelectorAll('.run-btn').forEach(b  => b.style.display = 'none');
    document.querySelectorAll('.stop-btn').forEach(b => { b.style.display = 'none'; b.classList.remove('show'); });
    document.querySelectorAll('.copy-btn').forEach(b => b.style.display = '');
  }

  try { localStorage.setItem('rnaflow-mode', mode); } catch(e) {}
}

function restoreMode() {
  let saved;
  try { saved = localStorage.getItem('rnaflow-mode'); } catch(e) {}
  if (saved === 'run' || saved === 'copy') {
    setTimeout(() => { selectMode(saved); onModeSelect(saved); }, 150);
  }
}

// ── REBUILD RUN BUTTONS WHENEVER updateAll IS CALLED ─────────────────────
// ── OS TAB SWITCHING ──────────────────────────────────────────────────────
function showOS(os, btn) {
  document.querySelectorAll('#how-html .os-panel').forEach(p => {
    if (p.id && p.id.startsWith('os-')) p.style.display = 'none';
  });
  document.querySelectorAll('#os-tabs .os-tab').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('os-' + os);
  if (panel) panel.style.display = '';
  if (btn) btn.classList.add('active');
}

// ── HOW ARE YOU RUNNING RNAFLOW ───────────────────────────────────────────
const OS_SERVER_INSTRUCTIONS = {
  mac: {
    icon: '🍎', name: 'macOS',
    steps: [
      ['Open <strong>Terminal</strong>', 'Cmd+Space &rarr; type Terminal &rarr; Enter'],
      ['Navigate to where you saved the files', '<div class="os-cmd">cd ~/Desktop <span style="color:var(--text3)"># or wherever you saved it</span></div>'],
      ['Start the server', '<div class="os-cmd os-cmd-main">python3 rnaflow_server.py <button class="mode-copy-cmd-btn" onclick="copyText(\'python3 rnaflow_server.py\',this)">Copy</button></div>'],
      ['Keep Terminal open', 'The <strong style="color:var(--green)">green dot</strong> in the top bar confirms connection &#x2705;']
    ],
    note: '&#x1F4A1; Python not installed? Run: <code>brew install miniforge</code> or download from <strong>github.com/conda-forge/miniforge</strong>'
  },
  linux: {
    icon: '🐧', name: 'Linux',
    steps: [
      ['Open your terminal', 'GNOME Terminal, Konsole, xterm, etc.'],
      ['Navigate to the files', '<div class="os-cmd">cd ~/Desktop</div>'],
      ['Start the server', '<div class="os-cmd os-cmd-main">python3 rnaflow_server.py <button class="mode-copy-cmd-btn" onclick="copyText(\'python3 rnaflow_server.py\',this)">Copy</button></div>'],
      ['Keep terminal open', '<strong style="color:var(--green)">Green dot</strong> confirms connection &#x2705;']
    ],
    note: '&#x1F4A1; Python not found? <code>sudo apt install python3</code> (Ubuntu) &middot; <code>sudo dnf install python3</code> (Fedora)'
  },
  win: {
    icon: '🪟', name: 'Windows (WSL2)',
    steps: [
      ['Open <strong>Ubuntu / WSL</strong>', 'Search Start menu for &ldquo;Ubuntu&rdquo; or &ldquo;WSL&rdquo;'],
      ['Navigate to Windows Desktop from WSL', '<div class="os-cmd">cd /mnt/c/Users/$USER/Desktop</div>'],
      ['Start the server', '<div class="os-cmd os-cmd-main">python3 rnaflow_server.py <button class="mode-copy-cmd-btn" onclick="copyText(\'python3 rnaflow_server.py\',this)">Copy</button></div>'],
      ['Open HTML in Windows browser', 'Chrome/Edge &mdash; WSL2 and Windows share localhost &#x2705;']
    ],
    note: '&#x2705; WSL2 is the best option on Windows &mdash; all bioinformatics tools run perfectly inside Ubuntu. &nbsp; WSL2 not installed? In PowerShell (Admin): <code>wsl --install</code>'
  }
};

function showHow(which, btn) {
  const desktopDiv = document.getElementById('how-desktop');
  const htmlDiv    = document.getElementById('how-html');
  if (desktopDiv) desktopDiv.style.display = which === 'desktop' ? '' : 'none';
  if (htmlDiv)    htmlDiv.style.display    = which === 'html'    ? '' : 'none';

  // Sync the sbar dropdown
  const sel = document.getElementById('sbar-how-select');
  if (sel) sel.value = which;

  // Fill OS-specific instructions for HTML mode
  if (which === 'html') {
    const os      = autoDetectOS();
    const info    = OS_SERVER_INSTRUCTIONS[os] || OS_SERVER_INSTRUCTIONS.mac;
    const content = document.getElementById('server-os-content');
    if (content) {
      let html = '<div style="margin-bottom:10px;display:flex;align-items:center;gap:8px;">';
      html += '<span style="font-size:1.3em;">' + info.icon + '</span>';
      html += '<strong style="font-size:0.9em;">' + info.name + ' detected</strong>';
      html += '<span style="font-size:0.72em;color:var(--text3);margin-left:4px;">(instructions match your OS)</span></div>';
      info.steps.forEach((s, i) => {
        html += '<div class="os-step-row"><span class="os-step-num">' + (i+1) + '</span><div>';
        html += '<strong>' + s[0] + '</strong>';
        if (s[1]) html += '<div style="margin-top:4px;">' + s[1] + '</div>';
        html += '</div></div>';
      });
      if (info.note) html += '<div class="os-note">' + info.note + '</div>';
      content.innerHTML = html;
    }
  }

  try { localStorage.setItem('rnaflow-how', which); } catch(e) {}
}

// ── DESKTOP OS TABS ───────────────────────────────────────────────────────
function showOSDesktop(os, btn) {
  ['mac-app','win-app','linux-app'].forEach(id => {
    const el = document.getElementById('os-' + id);
    if (el) el.style.display = id === os ? '' : 'none';
  });
  document.querySelectorAll('#os-tabs-desktop .os-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ── LINUX FORMAT TABS ─────────────────────────────────────────────────────
function showLinuxFmt(fmt, btn) {
  ['appimage','deb','rpm'].forEach(id => {
    const el = document.getElementById('linux-' + id);
    if (el) el.style.display = id === fmt ? '' : 'none';
  });
  const parent = btn?.closest('.os-panel');
  if (parent) parent.querySelectorAll('.os-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function autoDetectOS() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'win';
  if (ua.includes('linux')) return 'linux';
  return 'mac';
}


// ── COMPUTE ENVIRONMENT ───────────────────────────────────────────────────
let currentEnv = 'local';  // local | slurm | pbs | lsf | aws | gcp | azure

const ENV_COLORS = {
  local:'green', slurm:'purple', pbs:'blue', lsf:'orange',
  aws:'#ff9900', gcp:'#4285f4', azure:'#0078d4'
};
const ENV_LABELS = {
  local:'Local', slurm:'SLURM HPC', pbs:'PBS HPC', lsf:'LSF HPC',
  aws:'AWS Cloud', gcp:'GCP Cloud', azure:'Azure Cloud'
};
const ENV_ICONS = {
  local:'💻', slurm:'🏢', pbs:'🏗️', lsf:'🔵',
  aws:'☁️', gcp:'🌐', azure:'🔷'
};

function selectEnv(env) {
  currentEnv = env;

  // Update card highlighting
  document.querySelectorAll('.env-card').forEach(c => c.className = 'env-card');
  const card = document.getElementById('env-card-' + env);
  if (card) card.classList.add('sel-' + env);

  // Show correct sub-panel in env detail
  const isHPC   = ['slurm','pbs','lsf'].includes(env);
  const isCloud = ['aws','gcp','azure'].includes(env);
  const isLocal = env === 'local';

  const localPanel = document.getElementById('env-local-panel');
  const hpcPanel   = document.getElementById('env-hpc-panel');
  const cloudPanel = document.getElementById('env-cloud-panel');
  if (localPanel) localPanel.style.display = isLocal ? '' : 'none';
  if (hpcPanel)   hpcPanel.style.display   = isHPC   ? '' : 'none';
  if (cloudPanel) cloudPanel.style.display = isCloud ? '' : 'none';

  // Update SSH preview line
  if (isHPC) {
    const user = document.getElementById('hpc-user')?.value || 'user';
    const host = document.getElementById('hpc-host')?.value || 'hpc.university.edu';
    const prev = document.getElementById('hpc-ssh-preview');
    if (prev) prev.textContent = user + '@' + host;
  }

  // Update cloud note text
  if (isCloud) {
    const notes = {
      aws:   '&#x2601;&#xFE0F; Commands include <code>aws s3 sync</code> to pull from S3 and push results back. Install: <code>pip install awscli</code> then <code>aws configure</code>.',
      gcp:   '&#x2601;&#xFE0F; Commands include <code>gsutil rsync</code> to pull from GCS and push results back. Install: <code>gcloud components install gsutil</code>.',
      azure: '&#x2601;&#xFE0F; Commands include <code>azcopy sync</code> to pull from Azure Blob and push results back. Download AzCopy from microsoft.com/azcopy.'
    };
    const noteEl = document.getElementById('cloud-env-note');
    if (noteEl) noteEl.innerHTML = notes[env] || '';
  }

  // Update badge on sbar
  const badge = document.getElementById('acc-env-badge');
  if (badge) {
    badge.textContent = ENV_ICONS[env] + ' ' + ENV_LABELS[env];
    badge.className   = 'acc-header-badge ' + (isHPC ? 'purple' : isCloud ? 'blue' : 'green');
    badge.style.display = 'inline-block';
  }

  // Auto-open env detail if HPC or Cloud so user fills in settings
  if (isHPC || isCloud) {
    const envDetail = document.getElementById('sbar-detail-env');
    const envBtn    = document.querySelector('#sbar-item-env .sbar-help');
    if (envDetail && !envDetail.classList.contains('open')) {
      envDetail.classList.add('open');
      if (envBtn) envBtn.classList.add('active');
    }
  }

  updateAll();
  try { localStorage.setItem('rnaflow-env', env); } catch(e) {}
}

// Browse local folder (Electron desktop app) or show path hint (HTML browser)
function browseLocalFolder() {
  // If running inside Electron, use native dialog via IPC
  if (window.electronAPI && window.electronAPI.openFolder) {
    window.electronAPI.openFolder().then(path => {
      if (path) document.getElementById('local-fastq-path').value = path;
    });
    return;
  }
  // In browser — show instruction
  const inp = document.getElementById('local-fastq-path');
  if (inp) {
    inp.placeholder = 'Type your full folder path here, e.g. /Users/you/Desktop/fastq/';
    inp.focus();
    // Show a helper note
    const note = document.createElement('div');
    note.style.cssText = 'font-size:0.73em;color:var(--blue);margin-top:5px;';
    note.textContent = 'In the browser version, type the path manually. In the desktop app, the Browse button opens a native folder picker.';
    inp.parentNode.appendChild(note);
    setTimeout(() => note.remove(), 5000);
  }
}

function restoreEnv() {
  let saved;
  try { saved = localStorage.getItem('rnaflow-env'); } catch(e) {}
  if (saved && ENV_LABELS[saved]) setTimeout(() => selectEnv(saved), 200);
}

