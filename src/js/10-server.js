// ── SERVER CONNECTION ─────────────────────────────────────────────────────
// A page served by an RNAflow server talks to that server — including one
// started on another port with RNAFLOW_PORT, which the server injects its
// token into. Opened from disk, it looks for the default port.
const SERVER = (location.protocol === 'http:' && (location.port === '7788' || window.__RNAFLOW_TOKEN__))
  ? location.origin
  : "http://127.0.0.1:7788";
let connected = false;
let serverUp  = false;   // reachable, but perhaps not paired yet
let serverHome = '';     // real home path, so generated files can be absolute

// ── ACCESS TOKEN (v3) ─────────────────────────────────────────────────────
// The server no longer accepts commands from anyone who can reach the port.
// Three ways to get the token, in order of convenience:
//   1. open the URL the server prints  (token injected into the page)
//   2. ?token=... / #token=... in the address bar
//   3. paste it once into the Connect box (stored in localStorage)
function readToken() {
  if (window.__RNAFLOW_TOKEN__) return window.__RNAFLOW_TOKEN__;
  const fromUrl = new URLSearchParams(location.search).get('token')
               || new URLSearchParams(location.hash.replace(/^#/, '')).get('token');
  if (fromUrl) {
    try { localStorage.setItem('rnaflow-token', fromUrl); } catch (e) {}
    // Keep the token out of the visible address bar / browser history
    history.replaceState(null, '', location.pathname);
    return fromUrl;
  }
  try { return localStorage.getItem('rnaflow-token') || ''; } catch (e) { return ''; }
}

let TOKEN = readToken();

function setToken(t) {
  TOKEN = (t || '').trim();
  try { localStorage.setItem('rnaflow-token', TOKEN); } catch (e) {}
  checkServer();
}

function authHeaders(extra) {
  return Object.assign({ 'X-RNAflow-Token': TOKEN }, extra || {});
}

// EventSource cannot send headers, so SSE carries the token in the query
function authUrl(path, params) {
  const u = new URL(SERVER + path);
  u.searchParams.set('token', TOKEN);
  Object.entries(params || {}).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}

function promptForToken() {
  const t = prompt(
    'Paste the access token printed by rnaflow_server.py.\n\n' +
    'It is shown in the Terminal window running the server, just under\n' +
    '"paste this token into the app\'s Connect box".');
  if (t) setToken(t);
}

function setConnected(ok) {
  connected = ok;
  const dot   = document.getElementById('conn-dot');
  const label = document.getElementById('conn-label');
  const pair  = document.getElementById('conn-pair-btn');

  if (ok) {
    dot.className     = 'conn-dot connected';
    label.textContent = 'Terminal connected';
    label.style.color = 'var(--green)';
    if (pair) pair.style.display = 'none';
    // Only enable run buttons if we are in run mode
    if (currentMode === 'run') {
      document.querySelectorAll('.run-btn').forEach(b => b.disabled = false);
    }
  } else {
    dot.className     = 'conn-dot disconnected';
    if (serverUp) {
      label.textContent = 'Server running — needs token';
      label.style.color = 'var(--orange)';
      if (pair) pair.style.display = '';
    } else {
      label.textContent = 'Server not running';
      label.style.color = 'var(--red)';
      if (pair) pair.style.display = 'none';
    }
    document.querySelectorAll('.run-btn').forEach(b => b.disabled = true);
  }
}

let envWarned = false;

async function checkServer() {
  try {
    const r = await fetch(`${SERVER}/status`, {
      headers: authHeaders(), signal: AbortSignal.timeout(1500)
    });
    if (!r.ok) { serverUp = false; setConnected(false); return; }
    const s = await r.json();
    serverUp = true;
    serverHome = s.home || serverHome;
    setConnected(!!s.authed);

    // Tell the user up front that the conda env is missing, rather than
    // letting every command fail with "command not found"
    if (s.authed && s.env_present === false && !envWarned) {
      envWarned = true;
      const label = document.getElementById('conn-label');
      if (label) label.title = `conda env "${s.env}" not found — run the Install Tools step`;
      if (new URLSearchParams(location.search).get('setup') === '1') {
        // First launch of the desktop app: go straight to installing
        goTo('page-install', document.getElementById('nav-install'));
        setTimeout(() => {
          const btn = document.querySelector('#cmd-install-env')
            ?.closest('.code-block')?.querySelector('.run-btn');
          if (btn && !btn.disabled) btn.click();
        }, 400);
      } else {
        showToast('The analysis tools are not installed yet. Install them in one click.',
                  'page-install', 'nav-install');
      }
    }
    if (s.env_present === true) envWarned = false;
  } catch {
    serverUp = false;
    setConnected(false);
  }
}
checkServer();
setInterval(checkServer, 3000);

// ── CODE BLOCK RUN BUTTON BUILDER ─────────────────────────────────────────
// Called after every updateAll() to wrap <pre> elements with Run buttons.
// `lang` matters: R blocks used to be piped into a shell, which always failed.
const SETUP_BLOCKS = ['cmd-install-env', 'cmd-fix-env', 'cmd-recreate-env'];
const STEP_MAP = {
  'cmd-install-env': { step: 'nav-install', next: ['page-download','nav-download'], lang: 'bash' },
  'cmd-fix-env':     { step: null,          next: null, lang: 'bash' },
  'cmd-recreate-env':{ step: null,          next: null, lang: 'bash' },
  'cmd-session':    { step: null,          next: null, lang: 'bash' },
  'cmd-mkdir':      { step: null,          next: null, lang: 'bash' },
  'cmd-list-local': { step: null,          next: null, lang: 'bash' },
  'cmd-download':   { step: 'nav-download',next: null, lang: 'bash' },
  'cmd-check-dl':   { step: null,          next: null, lang: 'bash' },
  'cmd-fastqc':     { step: null,          next: null, lang: 'bash' },
  'cmd-multiqc':    { step: 'nav-qc',      next: ['page-trim','nav-trim'], lang: 'bash' },
  'cmd-trim':       { step: null,          next: null, lang: 'bash' },
  'cmd-check-trim': { step: 'nav-trim',    next: ['page-genome','nav-genome'], lang: 'bash' },
  'cmd-check-urls': { step: null,          next: null, lang: 'bash' },
  'cmd-genome':     { step: null,          next: null, lang: 'bash' },
  'cmd-index':      { step: 'nav-genome',  next: ['page-align','nav-align'], lang: 'bash' },
  'cmd-align':      { step: null,          next: null, lang: 'bash' },
  'cmd-bam':        { step: 'nav-align',   next: ['page-counts','nav-counts'], lang: 'bash' },
  'cmd-counts':     { step: 'nav-counts',  next: ['page-genefamily','nav-genefamily'], lang: 'bash' },
  'cmd-preview':    { step: null,          next: null, lang: 'bash' },
  'cmd-postqc':     { step: null,          next: null, lang: 'bash' },
  'cmd-deseq2':     { step: 'nav-deseq2',  next: ['page-plots','nav-plots'], lang: 'r' },
  'cmd-consensus':  { step: null,          next: null, lang: 'r' },
  'cmd-fgsea':      { step: null,          next: null, lang: 'r' },
  'cmd-volcano':    { step: null,          next: null, lang: 'r' },
  'cmd-heatmap':    { step: null,          next: null, lang: 'r' },
  'cmd-pca':        { step: 'nav-plots',   next: null, lang: 'r' },
  'gf-cmd-whole':   { step: null,          next: null, lang: 'r' },
  'gf-cmd-filter':  { step: null,          next: null, lang: 'r' },
  'gf-cmd-analysis':{ step: null,          next: null, lang: 'r' },
  'gf-cmd-plots':   { step: null,          next: null, lang: 'r' },
};

function buildRunButton(preId) {
  const pre = document.getElementById(preId);
  if (!pre || pre.dataset.runBuilt) return;
  pre.dataset.runBuilt = '1';

  const info = STEP_MAP[preId] || {};
  const block = pre.closest('.code-block');
  if (!block) return;

  // Get or create toolbar
  let toolbar = block.querySelector('.code-toolbar') || block.querySelector('.code-toolbar-run');
  if (!toolbar) return;

  // Stop button
  const stopBtn = document.createElement('button');
  stopBtn.className = 'stop-btn';
  stopBtn.textContent = '■ Stop';
  stopBtn.dataset.jobId = '';
  stopBtn.onclick = () => {
    if (stopBtn.dataset.jobId) {
      fetch(`${SERVER}/kill/${stopBtn.dataset.jobId}`, { headers: authHeaders() }).catch(()=>{});
    }
  };

  // Run button
  const runBtn = document.createElement('button');
  runBtn.className = 'run-btn';
  runBtn.innerHTML = info.lang === 'r' ? '▶ Run in R' : '▶ Run';
  runBtn.disabled = !connected;
  runBtn.title = info.lang === 'r'
    ? 'Execute with Rscript (requires R installed)'
    : 'Execute in terminal';
  runBtn.onclick = () => {
    if (!connected) {
      if (serverUp) { promptForToken(); return; }
      alert('Start the server first:\n\npython3 rnaflow_server.py\n\nThen open the URL it prints, or paste its token into the Connect box.');
      return;
    }
    const cmd = pre.textContent.trim();
    runCommand(cmd, runBtn, stopBtn, termPanel, info.step, info.next, info.lang || 'bash', preId);
  };

  toolbar.appendChild(stopBtn);
  toolbar.appendChild(runBtn);

  // Terminal output panel
  const termPanel = document.createElement('div');
  termPanel.className = 'term-panel';
  termPanel.innerHTML = `
    <div class="term-header">
      <div class="term-dots">
        <span style="background:#f85149"></span>
        <span style="background:#e3b341"></span>
        <span style="background:#3fb950"></span>
      </div>
      <span style="margin-left:4px; font-size:0.85em;">Terminal output — ${preId}</span>
    </div>
    <div class="term-scroll" id="ts-${preId}"></div>`;
  block.appendChild(termPanel);
}

function buildAllRunButtons() {
  Object.keys(STEP_MAP).forEach(id => buildRunButton(id));
}

