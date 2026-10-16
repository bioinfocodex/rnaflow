# RNAflow source

`RNAflow_App.html` at the repository root is built from this folder. Edit
here, then build:

```bash
node tools/build.mjs
```

The build joins the files in `manifest.txt` verbatim, in order: no bundler,
no transformation. The output is still one self-contained HTML file, so it
opens from disk, the local server serves it, and the desktop app embeds it.

| Folder | What is in it |
|---|---|
| `shell/` | The document around everything else: `<head>`, the `<script>` tag, the closing tags |
| `styles.css` | All styles, including the light and dark colour tokens |
| `pages/` | One file per page of the app, in sidebar order; `00-layout.html` is the sidebar and top bar |
| `js/` | The app's script, split by job; files share one global scope and load in manifest order |

Main entry points in `js/`:

- `07-commands.js` — `updateAll()`, which generates every command and R script from the Configure page
- `03-environment.js` — the pinned software environment (`RNAFLOW_ENV`) and the GSEA annotation table
- `04-qc.js` — the QC summary step
- `10-server.js`, `11-runner.js` — talking to `rnaflow_server.py` and running steps
- `13-explorer.js` — the interactive results explorer

After building, run the tests and copy the result to the desktop and website
folders:

```bash
cd tests && npm ci && npm test && cd ..
python3 -m unittest discover tests
./sync.sh
```

CI (`.github/workflows/test.yml`) fails when `RNAflow_App.html` does not match
`src/`, so a hand edit to the built file is caught. Make the change here.

The end-to-end check against real data, which takes an hour and about 3 GB,
is separate: see `benchmark/README.md`.
