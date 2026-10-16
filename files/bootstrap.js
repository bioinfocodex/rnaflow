/**
 * First-launch bootstrap for RNAflow Desktop.
 *
 * RNAflow's local server needs Python, and its tools need conda. When the
 * machine has neither, this installs Miniforge privately into
 * ~/.rnaflow/miniforge3: no admin rights, no change to the user's shell
 * configuration, and nothing outside that folder. Its Python then runs the
 * server, and the app builds the pinned `rnaseq` environment through the
 * server's /setup endpoint.
 *
 * Plain Node (no Electron imports) so it can be tested on its own:
 *   node bootstrap.js --install /tmp/some-prefix
 */

const https  = require('https');
const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');

const STATE_DIR      = path.join(os.homedir(), '.rnaflow');
const PRIVATE_CONDA  = path.join(STATE_DIR, 'miniforge3');

// Pinned release, with checksums written here rather than fetched from the
// same place as the installer — a tampered download is refused.
const MINIFORGE_VERSION = '26.7.2-0';
const MINIFORGE_SHA256 = {
  'MacOSX-arm64':  'd70bfa2e97afcda96927c9b9ca0e2316cb7750e4ce651c94388267cbe9588711',
  'MacOSX-x86_64': 'b00e7798658f92721a3ae2f6b9832695ffc6baf07758894d726268055359f6c5',
  'Linux-x86_64':  '281b0ac7d550802efc81af633225a5e6116d29ae72f3ab4eae7168c3931a4c05',
  'Linux-aarch64': '89b786c8d2c8b0fda7553914c1314ae4ddaa094503802f279377b19ac4463cb2',
};

// Same search order as rnaflow_server.py's find_conda()
function condaCandidates() {
  const h = os.homedir();
  if (process.platform === 'win32') return [];
  return [
    path.join(PRIVATE_CONDA, 'bin', 'conda'),
    path.join(h, 'miniforge3', 'bin', 'conda'),
    path.join(h, 'miniconda3', 'bin', 'conda'),
    path.join(h, 'anaconda3', 'bin', 'conda'),
    path.join(h, 'opt', 'miniforge3', 'bin', 'conda'),
    path.join(h, 'opt', 'miniconda3', 'bin', 'conda'),
    '/opt/miniforge3/bin/conda', '/opt/miniconda3/bin/conda', '/opt/anaconda3/bin/conda',
    '/usr/local/bin/conda',
    '/usr/local/Caskroom/miniforge/base/bin/conda',
    '/usr/local/Caskroom/miniconda/base/bin/conda',
    '/opt/homebrew/Caskroom/miniforge/base/bin/conda',
  ];
}

function findConda() {
  return condaCandidates().find(p => fs.existsSync(p)) || null;
}

// The server runs on a conda Python when there is one: RNAflow's own first,
// then the user's. macOS ships a python3 stub that opens an "install
// developer tools" dialog instead of running, so PATH comes last.
function findPython() {
  const conda = findConda();
  const condaPy = conda ? path.join(path.dirname(conda), 'python3') : null;
  for (const p of [path.join(PRIVATE_CONDA, 'bin', 'python3'), condaPy]) {
    if (p && fs.existsSync(p)) return p;
  }
  const candidates = process.platform === 'win32' ? ['python', 'python3', 'py'] : ['python3', 'python'];
  for (const cmd of candidates) {
    try { execFileSync(cmd, ['--version'], { stdio: 'ignore', timeout: 5000 }); return cmd; } catch (_) {}
  }
  return null;
}

// No conda anywhere means no tools and possibly no usable Python
function needsBootstrap() {
  if (process.platform === 'win32') return false;   // Windows uses WSL2
  return !findConda();
}

function installerKey() {
  const osName = { darwin: 'MacOSX', linux: 'Linux' }[process.platform];
  const arch = process.arch === 'arm64'
    ? (process.platform === 'linux' ? 'aarch64' : 'arm64')
    : 'x86_64';
  return osName ? `${osName}-${arch}` : null;
}

// GitHub release assets redirect to a CDN; follow up to five hops
function download(url, dest, onProgress, hops = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'RNAflow' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && hops < 5) {
        res.resume();
        return resolve(download(res.headers.location, dest, onProgress, hops + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Download failed: HTTP ${res.statusCode} for ${url}`));
      }
      const total = Number(res.headers['content-length']) || 0;
      let got = 0;
      const out = fs.createWriteStream(dest);
      res.on('data', chunk => { got += chunk.length; if (onProgress) onProgress(got, total); });
      res.pipe(out);
      out.on('finish', () => out.close(resolve));
      out.on('error', reject);
    }).on('error', reject);
  });
}

function sha256(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    fs.createReadStream(file).on('data', d => h.update(d)).on('end', () => resolve(h.digest('hex'))).on('error', reject);
  });
}

/**
 * Download, verify and install Miniforge into `prefix`.
 * onStatus(text, fraction|null) is called as it goes.
 * Resolves to the installed Python path.
 */
async function installMiniforge(prefix = PRIVATE_CONDA, onStatus = () => {}) {
  const key = installerKey();
  if (!key || !MINIFORGE_SHA256[key]) throw new Error(`No Miniforge build for ${process.platform}/${process.arch}`);
  const name = `Miniforge3-${MINIFORGE_VERSION}-${key}.sh`;
  const url  = `https://github.com/conda-forge/miniforge/releases/download/${MINIFORGE_VERSION}/${name}`;
  fs.mkdirSync(path.dirname(prefix), { recursive: true });
  const installer = path.join(path.dirname(prefix), name);

  onStatus('Downloading Miniforge (conda)…', 0);
  await download(url, installer, (got, total) =>
    onStatus(`Downloading Miniforge (conda)… ${(got / 1e6).toFixed(0)} MB`, total ? got / total : null));

  onStatus('Verifying the download…', null);
  const digest = await sha256(installer);
  if (digest !== MINIFORGE_SHA256[key]) {
    fs.rmSync(installer, { force: true });
    throw new Error(`Checksum mismatch for ${name} — the download was refused.`);
  }

  onStatus('Installing Miniforge — about a minute…', null);
  await new Promise((resolve, reject) => {
    // -b batch (no prompts, no shell-rc edits), -p private prefix, -u reuse a
    // half-finished folder from an interrupted earlier attempt
    const p = spawn('bash', [installer, '-b', '-u', '-p', prefix], { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(`Miniforge installer exited ${code}: ${err.slice(-400)}`)));
    p.on('error', reject);
  });
  fs.rmSync(installer, { force: true });

  const py = path.join(prefix, 'bin', 'python3');
  if (!fs.existsSync(py)) throw new Error('Miniforge installed, but its Python is missing.');
  onStatus('Miniforge is ready.', 1);
  return py;
}

module.exports = {
  PRIVATE_CONDA, MINIFORGE_VERSION, findConda, findPython, needsBootstrap, installMiniforge,
};

// Standalone test: node bootstrap.js --install /tmp/prefix
if (require.main === module) {
  const i = process.argv.indexOf('--install');
  if (i > 0) {
    installMiniforge(process.argv[i + 1], (t, f) => process.stdout.write(`\r${t}${f != null ? ` ${(f * 100).toFixed(0)}%` : ''}      `))
      .then(py => { console.log(`\nOK: ${py}`); })
      .catch(e => { console.error(`\nFAILED: ${e.message}`); process.exit(1); });
  } else {
    console.log(JSON.stringify({ conda: findConda(), python: findPython(), needsBootstrap: needsBootstrap() }, null, 2));
  }
}
