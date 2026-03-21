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

// ── CONFIG ──────────────────────────────────────────────────────────────
const APP_NAME    = 'RNAflow';
const APP_VERSION = '1.0.0';
const SERVER_PORT = 7788;
const SERVER_HOST = '127.0.0.1';

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

// ── FIND PYTHON ─────────────────────────────────────────────────────────
function findPython() {
  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py']
    : ['python3', 'python'];
  for (const cmd of candidates) {
    try {
      require('child_process').execSync(`${cmd} --version`, { stdio: 'ignore' });
      return cmd;
    } catch (_) {}
  }
  return null;
}

// ── START LOCAL SERVER ───────────────────────────────────────────────────
function startServer() {
  const python     = findPython();
  const serverPath = path.join(__dirname, 'rnaflow_server.py');

  if (!python) {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Python not found',
      message: 'Python 3 is required for Run mode.',
      detail: 'Install Python from python.org or via Miniforge/Anaconda.\nThe app will work in Copy mode without Python.',
      buttons: ['Download Python', 'Continue anyway'],
    }).then(({ response }) => {
      if (response === 0) shell.openExternal('https://github.com/conda-forge/miniforge/releases');
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

function stopServer() {
  if (serverProcess) {
    try { serverProcess.kill('SIGTERM'); } catch (_) {}
    serverProcess = null;
    serverRunning = false;
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

  // Load the app HTML file directly
  mainWindow.loadFile(path.join(__dirname, 'RNAflow_App.html'));

  // Show when ready to avoid flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Start server after window is visible
    setTimeout(startServer, 500);
  });

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
