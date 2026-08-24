# RNAflow Desktop App — Build Instructions

Turn RNAflow into a native installable application for macOS, Windows, and Linux.

---

## What this produces

| Platform | Output file | How users install |
|---|---|---|
| **macOS** | `RNAflow-1.0.0.dmg` | Drag app to /Applications |
| **Windows** | `RNAflow-Setup-1.0.0.exe` | Run installer wizard |
| **Linux** | `RNAflow-1.0.0.AppImage` | Make executable, double-click |
| **Linux** | `rnaflow_1.0.0_amd64.deb` | `sudo dpkg -i rnaflow.deb` |

---

## Prerequisites

Install Node.js (v18+) from https://nodejs.org

```bash
node --version    # should show v18+
npm --version     # should show 9+
```

---

## Project structure

```
rnaflow-desktop/
├── main.js                  ← Electron main process (already done)
├── package.json             ← Build configuration (already done)
├── RNAflow_App.html         ← The app (copy from BioInfoCodex download)
├── rnaflow_server.py        ← The server (copy from BioInfoCodex download)
└── assets/
    ├── icon.icns            ← macOS icon (1024×1024, .icns format)
    ├── icon.ico             ← Windows icon (.ico format)
    ├── icon.png             ← Linux icon (512×512 PNG)
    ├── dmg-background.png  ← macOS DMG background (540×380 PNG)
    ├── LICENSE.txt          ← MIT licence text
    └── entitlements.mac.plist ← macOS signing (already done)
```

---

## Step 1 — Set up the project

```bash
# Create project folder
mkdir rnaflow-desktop
cd rnaflow-desktop

# Copy these files into it:
# - main.js
# - package.json
# - RNAflow_App.html
# - rnaflow_server.py
# - assets/ folder

# Install dependencies
npm install
```

---

## Step 2 — Create the app icon

You need icon files in 3 formats. Use your existing BioInfoCodex DNA helix logo.

### macOS (.icns)
```bash
# On macOS, create iconset from a 1024x1024 PNG:
mkdir RNAflow.iconset
sips -z 16 16     icon_1024.png --out RNAflow.iconset/icon_16x16.png
sips -z 32 32     icon_1024.png --out RNAflow.iconset/icon_16x16@2x.png
sips -z 32 32     icon_1024.png --out RNAflow.iconset/icon_32x32.png
sips -z 64 64     icon_1024.png --out RNAflow.iconset/icon_32x32@2x.png
sips -z 128 128   icon_1024.png --out RNAflow.iconset/icon_128x128.png
sips -z 256 256   icon_1024.png --out RNAflow.iconset/icon_128x128@2x.png
sips -z 256 256   icon_1024.png --out RNAflow.iconset/icon_256x256.png
sips -z 512 512   icon_1024.png --out RNAflow.iconset/icon_256x256@2x.png
sips -z 512 512   icon_1024.png --out RNAflow.iconset/icon_512x512.png
cp icon_1024.png               RNAflow.iconset/icon_512x512@2x.png
iconutil -c icns RNAflow.iconset -o assets/icon.icns
```

### Windows (.ico)
Use https://convertico.com to convert your PNG to .ico (include sizes: 16, 32, 48, 64, 128, 256)

### Linux (.png)
Just copy your 512×512 PNG as assets/icon.png

---

## Step 3 — Build for your platform

### Build for macOS (run this ON a Mac)
```bash
npm run build:mac
# Produces: dist/RNAflow-1.0.0.dmg  (Intel + Apple Silicon universal)
```

### Build for Windows (run this ON Windows, or use GitHub Actions)
```bash
npm run build:win
# Produces: dist/RNAflow Setup 1.0.0.exe
```

### Build for Linux (run this ON Linux)
```bash
npm run build:linux
# Produces:
#   dist/RNAflow-1.0.0.AppImage
#   dist/rnaflow_1.0.0_amd64.deb
#   dist/rnaflow-1.0.0.x86_64.rpm
```

### Build all platforms (macOS only — requires Wine for Windows)
```bash
npm run build:all
```

---

## Step 4 — Test before distributing

```bash
# Test the app without building
npm start

# Test in dev mode (shows DevTools)
npm run dev
```

---

## Step 5 — Distribute

### Option A — GitHub Releases (free, recommended)
1. Push your code to github.com/bioinfocodex/rnaflow
2. Create a release: Releases → Draft new release
3. Upload the .dmg, .exe, and .AppImage files
4. Publish — users download directly from GitHub

### Option B — Website download page
Upload the installer files to your GitHub Pages site and link them from bioinfocodex.com/tools/rnaflow

---

## GitHub Actions — Build all platforms automatically (FREE)

Create `.github/workflows/build.yml` to build on every release:

```yaml
name: Build RNAflow installers

on:
  release:
    types: [created]

jobs:
  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm install
      - run: npm run build:mac
      - uses: actions/upload-release-asset@v1
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }
        with:
          upload_url:  "${{ github.event.release.upload_url }}"
          asset_path:  dist/RNAflow-1.0.0.dmg
          asset_name:  RNAflow-mac.dmg
          asset_content_type: application/x-apple-diskimage

  build-win:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm install
      - run: npm run build:win
      - uses: actions/upload-release-asset@v1
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }
        with:
          upload_url:  "${{ github.event.release.upload_url }}"
          asset_path:  "dist/RNAflow Setup 1.0.0.exe"
          asset_name:  RNAflow-windows-setup.exe
          asset_content_type: application/octet-stream

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm install
      - run: npm run build:linux
      - uses: actions/upload-release-asset@v1
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }
        with:
          upload_url:  "${{ github.event.release.upload_url }}"
          asset_path:  dist/RNAflow-1.0.0.AppImage
          asset_name:  RNAflow-linux.AppImage
          asset_content_type: application/octet-stream
```

Push this file to your repo — GitHub will build all 3 installers automatically whenever you publish a new release. **Completely free for public repositories.**

---

## Code signing (optional but professional)

### macOS
Requires an Apple Developer account ($99/year). Without it, users get a Gatekeeper warning but can still open the app by right-clicking → Open.

```bash
# With Apple Developer account:
export APPLE_ID="your@apple.id"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="cert_password"
npm run build:mac
```

### Windows
Requires a code signing certificate (~$100-300/year from DigiCert or Sectigo). Without it, Windows SmartScreen shows a warning but users can click "More info → Run anyway".

---

## App size

| Platform | Approximate install size |
|---|---|
| macOS .dmg | ~180 MB |
| Windows .exe | ~160 MB |
| Linux .AppImage | ~170 MB |

Most of this is the Electron framework. The actual RNAflow app (HTML + Python server) is only ~300 KB.

---

## Updating

To release a new version:
1. Edit `version` in `package.json` (e.g. `"1.1.0"`)
2. Update `RNAflow_App.html` with new features
3. Build and upload the new installers
4. Create a new GitHub Release

Electron can check for updates automatically using `electron-updater` (included in electron-builder). See: https://www.electron.build/auto-update
