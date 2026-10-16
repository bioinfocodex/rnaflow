#!/usr/bin/env node
// Builds RNAflow_App.html from src/.
//
// RNAflow ships as one self-contained HTML file — it opens from disk, the
// local server serves it, and the desktop app embeds it. That file is no
// longer edited by hand: the source lives in src/ (one file per page and per
// part of the app), and this script joins the files listed in
// src/manifest.txt, verbatim and in order.
//
//   node tools/build.mjs           write RNAflow_App.html
//   node tools/build.mjs --check   exit 1 if RNAflow_App.html is out of date
//
// No dependencies, no transformation: what is in src/ is what ships.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const out = join(root, 'RNAflow_App.html');

const files = readFileSync(join(src, 'manifest.txt'), 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

const missing = files.filter(f => !existsSync(join(src, f)));
if (missing.length) {
  console.error(`manifest lists files that do not exist:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

const built = Buffer.concat(files.map(f => readFileSync(join(src, f))));

if (process.argv.includes('--check')) {
  const current = existsSync(out) ? readFileSync(out) : Buffer.alloc(0);
  if (!built.equals(current)) {
    console.error('RNAflow_App.html is out of date with src/. Run: node tools/build.mjs');
    process.exit(1);
  }
  console.log(`RNAflow_App.html is up to date (${files.length} source files).`);
} else {
  writeFileSync(out, built);
  console.log(`Built RNAflow_App.html from ${files.length} source files (${(built.length / 1024).toFixed(0)} KB).`);
}
