// Pulls the exact commands RNAflow would show a user, by loading the real
// RNAflow_App.html in a simulated browser with a project preloaded.
//
// The benchmark must test what the app generates, not a hand-written copy of
// it — otherwise a bug in the app's command builder would never show up here.
//
//   node benchmark/extract_commands.mjs --method salmon|align --threads N \
//        [--loc '~'] [--tag airway_bench] [--datasource local|sra] [--out DIR]
//
// --loc must be one of the app's own choices (~/Desktop, ~/Documents, ~):
// the field is a drop-down, so any other value is silently discarded.
//
// Writes one file per step into --out (00_mkdir.sh … 08_deseq2.R).

import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) =>
    a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc, []));

const loc        = args.loc        || '~';
const tag        = args.tag        || 'airway_bench';
const datasource = args.datasource || 'local';
const method     = args.method     || 'salmon';
// The project folder exactly as RNAflow names it, plus its expanded form
const base       = `${loc}/RNA-Seq_${tag}`;
const work       = base.replace(/^~/, homedir());
const fastq      = resolve(args.fastq || join(work, 'raw_data'));
const threads = args.threads || '8';
const out     = resolve(args.out     || join(work, `commands_${method}_${datasource}`));
const appFile = resolve(args.app     || join(here, '..', 'RNAflow_App.html'));

// The airway study (GSE52778): four airway smooth-muscle cell lines, each
// untreated and treated with dexamethasone. Ordered by cell line so that
// CTRL_i and TRE_i come from the same donor.
// --ctrl / --treat (comma-separated) run another dataset, e.g. small RNA tests
const controls   = args.ctrl  ? args.ctrl.split(',')  : ['SRR1039508', 'SRR1039512', 'SRR1039516', 'SRR1039520'];
const treatments = args.treat ? args.treat.split(',') : ['SRR1039509', 'SRR1039513', 'SRR1039517', 'SRR1039521'];

const project = {
  version: 3,
  fields: {
    'cfg-loc': loc,
    'cfg-org-tag': tag,
    'cfg-organism': 'human',
    'cfg-readtype': args.readtype || 'paired',
    'cfg-datasource': datasource,
    'local-fastq-path': fastq,
    'cfg-fq-ext': '.fastq.gz',
    'cfg-threads': threads,
    'cfg-method': method,
    // airway is unstranded (Illumina TruSeq v1, 2013). "auto" is the default
    // from v3.2; older builds have no such option and fall back to 0.
    'cfg-strand': args.strand || 'auto',
    // Cell line of each sample, controls first: airway is paired by donor.
    // --pairs none runs the unpaired design instead.
    'cfg-pairs': args.pairs === 'none' ? '' :
      (args.pairs || 'N61311, N052611, N080611, N061011, N61311, N052611, N080611, N061011'),
    // --datasource counts: start from a count table instead of FASTQ
    'cfg-counts-path': args['counts-path'] || '',
    'cfg-counts-sheet': args['counts-sheet'] || '',
    'cfg-adapter': args.adapter || 'auto',
    'cfg-ctrl': 'untreated',
    'cfg-treat': 'dex'
  },
  controls,
  treatments,
  done: [],
  env: 'local',
  mode: 'none'
};

const html = readFileSync(appFile, 'utf8');
const vc = new VirtualConsole();
const errors = [];
vc.on('jsdomError', e => errors.push(e.message));

const dom = new JSDOM(html, {
  url: 'http://localhost:7788/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.localStorage.setItem('rnaflow-project', JSON.stringify(project));
    // No server during extraction: every network call fails fast and quietly.
    window.fetch = () => Promise.reject(new Error('offline'));
    window.navigator.clipboard = { writeText: () => Promise.resolve() };
    window.scrollTo = () => {};
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {},
                                 addEventListener() {}, removeEventListener() {} });
  }
});

const { document } = dom.window;

// Choose the organism the way a user does. Its change handler is what fills
// in the genome and annotation URLs (and resets the folder tag), so setting
// the field directly would leave the yeast demo references in place.
const pick = (id, value, event) => {
  const el = document.getElementById(id);
  el.value = value;
  el.dispatchEvent(new dom.window.Event(event, { bubbles: true }));
};
pick('cfg-organism', 'human', 'change');
pick('cfg-org-tag', tag, 'input');
const read = id => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`RNAflow page has no #${id} — did the app change?`);
  return el.textContent.trim();
};

// Fail loudly if the project did not take: a silent fallback to the yeast
// demo would make every downstream number meaningless.
const loaded = read('cmd-mkdir');
if (!loaded.includes(base)) {
  console.error('Project was not applied. cmd-mkdir reads:\n' + loaded);
  process.exit(1);
}
if (datasource !== 'counts' && method !== 'smallrna' && !read('cmd-genome').includes('homo_sapiens')) {
  console.error('Human references were not selected. cmd-genome reads:\n' + read('cmd-genome'));
  process.exit(1);
}

const steps = [
  ['00_mkdir.sh',   'cmd-mkdir'],
  ['01_fastqc.sh',  'cmd-fastqc'],
  ['02_trim.sh',    'cmd-trim'],
  ['03_genome.sh',  'cmd-genome'],
  ['04_index.sh',   'cmd-index'],
  ['05_quant.sh',   'cmd-align'],
  ['06_check.sh',   'cmd-bam'],
  ['07_counts.sh',  'cmd-counts'],
  ['07b_postqc.sh', 'cmd-postqc', 'optional'],   // from v3.2
  ['08_deseq2.R',   'cmd-deseq2'],
  ['08b_consensus.R', 'cmd-consensus', 'optional'],  // from v3.2
  ['09_fgsea.R',    'cmd-fgsea', 'optional']        // from v3.2
];

mkdirSync(out, { recursive: true });
for (const [file, id, optional] of steps) {
  if (optional && !document.getElementById(id)) continue;
  const body = read(id);
  const header = file.endsWith('.R')
    ? `# Extracted verbatim from RNAflow_App.html #${id}\n`
    : `#!/usr/bin/env bash\n# Extracted verbatim from RNAflow_App.html #${id}\nset -euo pipefail\n`;
  writeFileSync(join(out, file), header + body + '\n');
}

// What the GSEA page will hand clusterProfiler, so compare.R can check the
// results' gene IDs actually map with it
project.gsea = {
  orgdb: document.getElementById('gs-orgdb')?.textContent.trim(),
  keytype: document.getElementById('gs-keytype')?.textContent.trim()
};
writeFileSync(join(out, 'project.json'), JSON.stringify(project, null, 2) + '\n');

// The pinned environment, from the same code that renders the install page.
// Older builds of the app have neither, so these are optional.
const install = document.getElementById('cmd-install-env');
if (install) {
  writeFileSync(join(out, 'install_env.sh'),
    '#!/usr/bin/env bash\n# Extracted verbatim from RNAflow_App.html #cmd-install-env\n' +
    install.textContent.trim() + '\n');
}
if (typeof dom.window.envYaml === 'function') {
  writeFileSync(join(out, 'environment.yml'), dom.window.envYaml() + '\n');
}
if (errors.length) console.error('Page script errors (non-fatal):\n  ' + errors.join('\n  '));
console.log(`Wrote ${steps.length} RNAflow steps (${method}, ${datasource}) to ${out}`);
// The app starts polling timers on load; close the page so node can exit.
dom.window.close();
process.exit(0);
