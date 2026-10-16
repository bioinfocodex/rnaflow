/**
 * RNAflow Desktop — Electron main process
 * Wraps RNAflow_App.html into a native desktop application
 * macOS (.dmg) · Windows (.exe) · Linux (.AppImage / .deb)
 */

const { app, BrowserWindow, shell, dialog, Menu, ipcMain, Tray, nativeImage } = require('electron');
const path  = require('path');
const fs    = require('fs');
const http  = require('http');
const { spawn, exec } = require('child_process');
const bootstrap = require('./bootstrap');

// ── CONFIG ──────────────────────────────────────────────────────────────
const APP_NAME    = 'RNAflow';
const APP_VERSION = '3.2.1';
const SERVER_PORT = 7788;
const SERVER_HOST = '127.0.0.1';

// v3: the local server now requires an access token. The desktop app mints
// one, hands it to the server via the environment, and loads the app from the
// server so the page is same-origin and paired with no user action.
const crypto = require('crypto');
const SERVER_TOKEN = crypto.randomBytes(24).toString('base64url');
const APP_URL = `http://${'127.0.0.1'}:${7788}/?token=${SERVER_TOKEN}`;

let mainWindow   = null;
let serverProcess = null;
let tray         = null;
let serverRunning = false;

// ── SINGLE INSTANCE LOCK ────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }
app.on('second-instance', () => {
  if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
});

// ── START LOCAL SERVER ───────────────────────────────────────────────────
function startServer() {
  const python     = bootstrap.findPython();
  // In packaged app, extraResources land in process.resourcesPath
  // In dev (electron .), __dirname works fine
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'rnaflow_server.py')
    : path.join(__dirname, 'rnaflow_server.py');

  if (!python) {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Python not found',
      message: 'Python 3 is required for Run mode.',
      detail: process.platform === 'win32'
        ? 'On Windows, RNAflow runs its tools inside WSL2 (Ubuntu). The app works in Copy mode meanwhile.'
        : 'Install Miniforge, or restart RNAflow to let it install everything for you.\nThe app works in Copy mode meanwhile.',
      buttons: ['Show me how', 'Continue anyway'],
    }).then(({ response }) => {
      if (response === 0) shell.openExternal(process.platform === 'win32'
        ? 'https://learn.microsoft.com/windows/wsl/install'
        : 'https://github.com/conda-forge/miniforge/releases');
    });
    return;
  }

  if (!fs.existsSync(serverPath)) {
    console.warn('rnaflow_server.py not found at', serverPath);
    return;
  }

  serverProcess = spawn(python, [serverPath], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    env: Object.assign({}, process.env, { RNAFLOW_TOKEN: SERVER_TOKEN }),
  });

  serverProcess.stdout.on('data', d => {
    const msg = d.toString();
    console.log('[server]', msg.trim());
    if (msg.includes('ready') || msg.includes('Listening')) {
      serverRunning = true;
      if (mainWindow) mainWindow.webContents.executeJavaScript(
        'document.getElementById("conn-dot") && (document.getElementById("conn-dot").className = "conn-dot connected")'
      ).catch(() => {});
    }
  });

  serverProcess.stderr.on('data', d => console.error('[server err]', d.toString().trim()));

  serverProcess.on('exit', (code) => {
    serverRunning = false;
    console.log('[server] exited with code', code);
  });
}

// Poll /status until the server answers or we give up
function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise(resolve => {
    const attempt = () => {
      const req = http.get(
        { host: SERVER_HOST, port: SERVER_PORT, path: '/status', timeout: 800 },
        res => { res.resume(); resolve(res.statusCode === 200); });
      req.on('error',   () => Date.now() < deadline ? setTimeout(attempt, 300) : resolve(false));
      req.on('timeout', () => { req.destroy(); });
    };
    attempt();
  });
}

function stopServer() {
  if (serverProcess) {
    try { serverProcess.kill('SIGTERM'); } catch (_) {}
    serverProcess = null;
    serverRunning = false;
  }
}

// ── FIRST-LAUNCH SETUP ──────────────────────────────────────────────────
// A plain page shown while Miniforge installs; status() updates it.
const SETUP_PAGE = 'data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { margin:0; height:100vh; display:grid; place-items:center; background:#03080f;
         color:#e6edf3; font:15px/1.5 -apple-system, system-ui, sans-serif; }
  .box { width:440px; text-align:center; }
  h1 { font-size:22px; font-weight:600; margin:0 0 6px; }
  p { color:#8b949e; margin:0 0 22px; }
  .bar { height:6px; background:#161b22; border-radius:3px; overflow:hidden; }
  .bar i { display:block; height:100%; width:0; background:#3fb950; transition:width .3s; }
  #msg { margin-top:12px; color:#c9d1d9; min-height:1.5em; }
</style></head><body><div class="box">
  <h1>Setting up RNAflow</h1>
  <p>One-time install of conda and the analysis tools. Nothing outside ~/.rnaflow is changed.</p>
  <div class="bar"><i id="bar"></i></div><div id="msg">Starting…</div>
</div></body></html>`);

function setupStatus(text, fraction) {
  if (!mainWindow) return;
  if (fraction != null) mainWindow.setProgressBar(fraction);
  mainWindow.webContents.executeJavaScript(
    `document.getElementById('msg').textContent = ${JSON.stringify(text)};` +
    (fraction != null ? `document.getElementById('bar').style.width = '${Math.round(fraction * 100)}%';` : '')
  ).catch(() => {});
}

// 'present' when conda was already there, 'installed' when it was just
// installed (the user agreed to the tools too), 'skipped' otherwise
async function firstLaunchSetup() {
  if (!bootstrap.needsBootstrap()) return 'present';
  // No parent window: it is not shown yet, and a sheet on a hidden window
  // never appears on macOS
  const { response } = await dialog.showMessageBox({
    type: 'question',
    title: 'Install the analysis tools?',
    message: 'RNAflow needs conda and its RNA-seq tools to run analyses.',
    detail: 'It can install them for you now: about 400 MB in total, usually 5–15 minutes. ' +
            'Everything goes into ~/.rnaflow, needs no administrator password, and does not ' +
            'change your shell settings. You can still browse and copy commands without it.',
    buttons: ['Install', 'Not now'],
    defaultId: 0, cancelId: 1,
  });
  if (response !== 0) return 'skipped';

  await mainWindow.loadURL(SETUP_PAGE);
  mainWindow.show();
  try {
    await bootstrap.installMiniforge(bootstrap.PRIVATE_CONDA, setupStatus);
    setupStatus('Conda is ready. Opening RNAflow to install the RNA-seq tools…', 1);
    mainWindow.setProgressBar(-1);
    return 'installed';
  } catch (err) {
    mainWindow.setProgressBar(-1);
    await dialog.showMessageBox(mainWindow, {
      type: 'error', title: 'Setup did not finish',
      message: 'RNAflow could not install conda.',
      detail: `${err.message}\n\nCheck your internet connection and restart RNAflow to try again. ` +
              'The app still works in Copy mode.',
      buttons: ['OK'],
    });
    return 'skipped';
  }
}

// ── CREATE WINDOW ────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1400,
    height: 900,
    minWidth:  900,
    minHeight: 600,
    title: APP_NAME,
    backgroundColor: '#03080f',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
    // icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
  });

  // v3: start the server first, then load the page it serves — that page
  // arrives with the access token already injected, so Run works immediately.
  // On a machine with no conda, first install it; the page then opens with
  // setup=1 and installs the pinned tools through the server by itself.
  firstLaunchSetup().then(setup => {
    startServer();
    return waitForServer(8000).then(up => ({ up, setup }));
  }).then(({ up, setup }) => {
    if (up) {
      // Only a user who just agreed to the install gets it started for them;
      // everyone else sees a prompt if the tools are missing
      mainWindow.loadURL(APP_URL + (setup === 'installed' ? '&setup=1' : ''));
    } else {
      // Server could not start (no Python?) — fall back to the local file.
      // Copy mode still works; Run mode will ask for a token.
      mainWindow.loadFile(path.join(__dirname, 'RNAflow_App.html'));
    }
  });

  // Show when ready to avoid flash
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Open external links in browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── APP MENU ─────────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: APP_NAME,
      submenu: [
        { label: `About ${APP_NAME}`, role: 'about' },
        { type: 'separator' },
        { label: 'Check for Updates…', click: () => shell.openExternal('https://bioinfocodex.com') },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Project Folder…',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Select your RNA-seq project folder',
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.executeJavaScript(
                `document.getElementById('cfg-basefolder') && (document.getElementById('cfg-basefolder').value = ${JSON.stringify(result.filePaths[0])}, updateAll())`
              );
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(process.env.NODE_ENV === 'development' ? [
          { type: 'separator' },
          { role: 'toggleDevTools' },
        ] : []),
      ],
    },
    {
      label: 'Server',
      submenu: [
        {
          label: 'Start Local Server',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => { if (!serverRunning) startServer(); },
        },
        {
          label: 'Stop Local Server',
          click: () => stopServer(),
        },
        { type: 'separator' },
        {
          label: 'Server Status',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Server Status',
              message: serverRunning ? '✅ Server is running' : '❌ Server is not running',
              detail: serverRunning
                ? `Listening on ${SERVER_HOST}:${SERVER_PORT}\nRun mode is available.`
                : 'Start the server to enable Run mode.\nCopy mode is always available without the server.',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'BioInfoCodex Website', click: () => shell.openExternal('https://bioinfocodex.com') },
        { label: 'RNAflow Manual', click: () => shell.openExternal('https://bioinfocodex.com/tools/rnaflow') },
        { type: 'separator' },
        { label: 'Report a Bug', click: () => shell.openExternal('https://bioinfocodex.com/contact') },
        { label: 'GitHub Repository', click: () => shell.openExternal('https://github.com/bioinfocodex') },
        ...(!isMac ? [
          { type: 'separator' },
          { label: `About ${APP_NAME} v${APP_VERSION}`, click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: `About ${APP_NAME}`,
              message: `${APP_NAME} v${APP_VERSION}`,
              detail: 'Free, open-source RNA-seq analysis pipeline.\n© 2025 BioInfoCodex · bioinfocodex.com\nMIT Licence',
              buttons: ['OK'],
            });
          }},
        ] : []),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── APP LIFECYCLE ────────────────────────────────────────────────────────
app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => stopServer());

app.on('will-quit', () => stopServer());

// Handle uncaught errors gracefully
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
