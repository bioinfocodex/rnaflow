// Tests for the commands RNAflow generates. Each loads the built
// RNAflow_App.html in a simulated browser, sets a project up the way a user
// would, and checks what the app would tell them to run.
//
// Most tests guard a bug that once shipped; the comment says which.
//
//   cd tests && npm ci && npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// RNAFLOW_APP points the suite at another build, e.g. an old release
const HTML = readFileSync(process.env.RNAFLOW_APP || join(ROOT, 'RNAflow_App.html'), 'utf8');

function loadApp() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(HTML, {
    url: 'http://localhost:7788/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      // No server in tests. A fetch that never settles, rather than one that
      // rejects: the app's error handler would otherwise run after close().
      w.fetch = () => new Promise(() => {});
      // The app polls the server and rebuilds Run buttons on timers; tests
      // call the generators directly, and a timer firing after close() fails
      w.setInterval = () => 0;
      w.setTimeout = () => 0;
      w.scrollTo = () => {};
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      w.navigator.clipboard = { writeText: () => Promise.resolve() };
    }
  });
  const w = dom.window, d = w.document;
  // Change a field the way a user does, so its handlers run
  const set = (id, value, event = 'change') => {
    const el = d.getElementById(id);
    assert.ok(el, `#${id} exists`);
    el.value = value;
    el.dispatchEvent(new w.Event(event, { bubbles: true }));
  };
  const samples = (id, names) => {
    const box = d.getElementById(id);
    box.querySelectorAll('.sample-row').forEach((r, i) => { if (i) r.remove(); });
    names.forEach((n, i) => {
      if (i) w.addRow(id);
      box.querySelectorAll('input')[i].value = n;
    });
  };
  const text = id => d.getElementById(id).textContent;
  return { w, d, set, samples, text, errors, close: () => w.close() };
}

function humanProject({ method = 'salmon', source = 'sra', strand = 'auto', readtype = 'paired' } = {}) {
  const app = loadApp();
  app.set('cfg-organism', 'human');
  app.set('cfg-method', method);
  app.set('cfg-datasource', source);
  app.set('cfg-readtype', readtype);
  app.set('cfg-strand', strand);
  app.samples('ctrl-rows', ['SRR1039508', 'SRR1039512']);
  app.samples('treat-rows', ['SRR1039509', 'SRR1039513']);
  app.w.updateAll();
  return app;
}

test('the page loads without script errors', () => {
  const app = loadApp();
  assert.deepEqual(app.errors, []);
  app.close();
});

test('default (SRA) paths keep ~ outside the quotes so the shell expands it', () => {
  // v3.0: fastqc "~/Desktop/…" — a literal folder called "~", so QC and
  // trimming failed with "file doesn't exist" on default settings
  const app = humanProject();
  for (const id of ['cmd-fastqc', 'cmd-trim']) {
    assert.doesNotMatch(app.text(id), /"~\//, `${id} quotes a ~ path`);
    assert.match(app.text(id), /~\/"Desktop\/RNA-Seq_human\/raw_data\//);
  }
  app.close();
});

test('FastQC uses --outdir, which FastQC 0.13 still accepts', () => {
  // v3.0 used -o, removed in FastQC 0.13
  const app = humanProject();
  assert.match(app.text('cmd-fastqc'), /--outdir /);
  assert.doesNotMatch(app.text('cmd-fastqc'), / -o /);
  app.close();
});

test('the Salmon transcript-to-gene map drops versions from both IDs', () => {
  // v3.0: tximport(ignoreTxVersion=TRUE) stripped them from Salmon's output
  // but not from the map, so DESeq2 failed on every Salmon project
  const app = humanProject();
  const g = app.text('cmd-genome');
  assert.match(g, /s\/\\\.\[0-9\]\+,\/,\//, 'transcript version stripped');
  assert.match(g, /s\/\\\.\[0-9\]\+\$\/\//, 'gene version stripped');
  assert.match(g, /ncrna\/Homo_sapiens\.GRCh38\.ncrna\.fa\.gz/, 'ncRNA added to the index');
  assert.match(app.text('cmd-index'), /_transcriptome\.fa\.gz/);
  // the sed itself, run on two real Ensembl headers
  const sed = g.match(/sed -E '([^']+)'/)[1];
  const out = execFileSync('sed', ['-E', sed], { input:
    '>ENST00000632585.1 cdna chromosome:GRCh38:21:1:2:1 gene:ENSG00000282172.1 gene_biotype:protein_coding\n' +
    '>YAL001C_mRNA cdna chromosome:R64-1-1:I:1:2:-1 gene:YAL001C gene_biotype:protein_coding\n' }).toString();
  assert.equal(out, 'ENST00000632585,ENSG00000282172\nYAL001C_mRNA,YAL001C\n');
  app.close();
});

test('DESeq2 adds shrunken fold changes, gene names and explorer files', () => {
  const app = humanProject();
  const r = app.text('cmd-deseq2');
  assert.match(r, /lfcShrink\(dds, coef=tail\(resultsNames\(dds\), 1\), type="apeglm"/);
  assert.match(r, /res_df\$symbol/);
  assert.match(r, /normalized_counts\.csv/);
  assert.match(r, /R_sessionInfo\.txt/);
  assert.match(app.text('cmd-volcano'), /log2FoldChange_shrunk/);
  app.close();
});

test('a valid pairing gives a paired design; an invalid one falls back with a reason', () => {
  // airway-style: two donors, each untreated and treated
  const app = humanProject();
  const design = () => app.text('cmd-deseq2').match(/design=(~[^)]+)\)/)[1];
  assert.equal(design(), '~condition');
  app.set('cfg-pairs', 'd1, d2, d1, d2', 'input');
  assert.equal(design(), '~pair + condition');
  assert.match(app.text('cmd-deseq2'), /pair = factor\(c\("d1", "d2", "d1", "d2"\)\)/);
  assert.match(app.text('pairs-hint'), /Paired design/);
  // wrong count, all unique, or confounded with the treatment: not usable
  for (const bad of ['d1, d2, d1', 'a, b, c, d', 'd1, d1, d2, d2']) {
    app.set('cfg-pairs', bad, 'input');
    assert.equal(design(), '~condition', bad);
    assert.match(app.text('pairs-hint'), /⚠/, bad);
  }
  app.close();
});

test('a count table goes straight to DESeq2, read by column name', () => {
  const app = humanProject({ source: 'counts' });
  app.set('cfg-counts-path', '/data/counts.xlsx', 'input');
  app.set('cfg-counts-sheet', 'counts', 'input');
  const r = app.text('cmd-deseq2');
  assert.match(r, /readxl::read_excel\(counts_file, sheet="counts"\)/);
  assert.match(r, /setdiff\(sample_ids, colnames\(raw\)\)/, 'samples picked by name');
  assert.match(r, /TPM or CPM values/, 'normalised tables are refused');
  assert.match(r, /DESeqDataSetFromMatrix\(countData=counts/);
  assert.doesNotMatch(r, /tximport\(|quant\.sf|gene_counts_all\.txt/, "no FASTQ-route inputs");
  for (const id of ['cmd-fastqc', 'cmd-trim', 'cmd-index', 'cmd-align', 'cmd-postqc'])
    assert.match(app.text(id), /^# Not needed/, `${id} skipped`);
  app.set('cfg-counts-sheet', '2', 'input');
  assert.match(app.text('cmd-deseq2'), /sheet=2\)/, 'numeric sheet passed as a number');
  app.close();
});

test("edgeR and limma-voom reuse DESeq2's samples and design", () => {
  const app = humanProject();
  app.set('cfg-pairs', 'd1, d2, d1, d2', 'input');
  const r = app.text('cmd-consensus');
  assert.match(r, /readRDS\(paste0\(base_path, "\/results\/dds\.rds"\)\)/);
  assert.match(r, /model\.matrix\(design\(dds\), info\)/, 'same design, pairing included');
  assert.match(r, /glmQLFTest/);
  assert.match(r, /voomWithQualityWeights/);
  assert.match(r, /scaleOffset/, 'Salmon length offsets for edgeR');
  assert.match(r, /method_comparison\.csv/);
  assert.match(r, /method_venn\.png/);
  app.close();
});

test('fgsea uses Hallmark sets for the project species, and says so when there are none', () => {
  const app = humanProject();
  const r = app.text('cmd-fgsea');
  assert.match(r, /msigdbr\(db_species="HS", species="Homo sapiens", collection="H"\)/);
  assert.match(r, /plotEnrichmentData/, 'three-panel enrichment ranking plots');
  assert.match(r, /fgsea_Hallmark\.csv/);
  app.set('cfg-organism', 'mouse'); app.w.updateAll();
  assert.match(app.text('cmd-fgsea'), /species="Mus musculus"/);
  app.set('cfg-organism', 'arabidopsis'); app.w.updateAll();
  assert.match(app.text('cmd-fgsea'), /cover animals and yeast only/);
  app.close();
});

test('the small RNA route trims for miRNAs, pins miRBase and counts with Bowtie', () => {
  const app = humanProject({ method: 'smallrna', source: 'local', readtype: 'single' });
  const trim = app.text('cmd-trim');
  assert.match(trim, /--length_required 16 --length_limit 35/);
  assert.doesNotMatch(trim, /--trim_front1/, 'a 22-nt miRNA cannot lose 5 bases');
  assert.match(trim, /ADAPTER=\$\(for a in TGGAATTCTCGGGTGCCAAGG AGATCGGAAGAGCACACGTCT AACTGTAGGCACCATCAAT/, 'adapter measured by default');
  const ref = app.text('cmd-genome');
  assert.match(ref, /test-datasets\/9520f3d8b79c4fa536f229886cb185fe1c806e85\/miRBase\/mature\.fa/, 'pinned release');
  assert.match(ref, /3c521fc9bea3c7993e71cf188b11caf73e2d40ac83454e32876455317cc6d342/, 'checksum checked');
  assert.match(ref, /sp="hsa-"/);
  const align = app.text('cmd-align');
  assert.match(align, /bowtie .*--norc --best -k 1 -S/);
  assert.doesNotMatch(align, /--strata/, 'bowtie 1.3.1 stops on --strata with -k 1');
  assert.match(align, /survived trimming — check the adapter/);
  assert.match(app.text('cmd-deseq2'), /counts_file <- "~\/Desktop\/RNA-Seq_human\/counts\/mirna_counts\.tsv"/);
  assert.match(app.text('cmd-fgsea'), /genes, not miRNAs/);
  app.set('cfg-organism', 'yeast'); app.w.updateAll();
  assert.match(app.text('cmd-genome'), /miRBase has no miRNAs for this organism/);
  app.close();
});

test('adapter detection picks the kit whose adapter is in the reads', () => {
  const app = humanProject({ method: 'smallrna', source: 'local', readtype: 'single' });
  const snippet = app.text('cmd-trim').split('\n\nfastp')[0];
  app.close();
  const dir = mkdtempSync(join(tmpdir(), 'rnaflow-adapter-'));
  const reads = Array.from({ length: 200 }, (_, i) =>
    `@r${i}\nTGAGGTAGTAGGTTGTATAGTTAGATCGGAAGAGCACACGTCTGAACTCCAGTC\n+\n${'F'.repeat(54)}`).join('\n') + '\n';
  const fq = join(dir, 'sample.fastq');
  writeFileSync(fq, reads);
  const script = snippet.replace(/(~\/)?"[^"]*SRR1039508[^"]*"/, `"${fq}"`) + '\n';
  writeFileSync(join(dir, 'detect.sh'), script);
  assert.match(execFileSync('bash', [join(dir, 'detect.sh')]).toString(), /Adapter found in the reads: AGATCGGAAGAGCACACGTCT/);
});

test('GSEA uses the ID type the results actually carry', () => {
  // v3.0: SYMBOL for human (results are ENSG…), GENENAME for yeast, and the
  // yeast database was loaded whatever the organism
  const app = humanProject();
  assert.equal(app.text('gs-keytype'), 'ENSEMBL');
  assert.equal(app.text('gs-orgdb-lib'), 'org.Hs.eg.db');
  assert.match(app.text('gs-install'), /bioconductor-org\.hs\.eg\.db=\d/);
  app.set('cfg-organism', 'yeast'); app.w.updateAll();
  assert.equal(app.text('gs-keytype'), 'ORF');
  assert.equal(app.text('gs-orgdb-lib'), 'org.Sc.sgd.db');
  app.close();
});

test('strandedness is measured by default on the genome route', () => {
  const auto = humanProject({ method: 'align' });
  assert.match(auto.text('cmd-counts'), /strand_check/);
  assert.match(auto.text('cmd-counts'), /-s \$STRAND/);
  auto.close();
  const fixed = humanProject({ method: 'align', strand: '2' });
  assert.doesNotMatch(fixed.text('cmd-counts'), /strand_check/);
  assert.match(fixed.text('cmd-counts'), /-s 2 /);
  fixed.close();
});

test('strand detection picks the right setting', () => {
  // Runs the app's own detection snippet against a stand-in featureCounts
  const app = humanProject({ method: 'align', readtype: 'single' });
  const snippet = app.text('cmd-counts').split('# ─── Count every sample')[0];
  app.close();
  const dir = mkdtempSync(join(tmpdir(), 'rnaflow-strand-'));
  const run = (fwd, rev) => {
    const fake = `featureCounts() { local o s; while [ $# -gt 0 ]; do case $1 in -o) o=$2; shift;; -s) s=$2; shift;; esac; shift; done
  if [ "$s" = 1 ]; then n=${fwd}; else n=${rev}; fi; printf 'Status\\tx\\nAssigned\\t%s\\n' $n > "$o.summary"; }
`;
    const script = fake + snippet.replaceAll('~/Desktop/RNA-Seq_human', dir);
    writeFileSync(join(dir, 'detect.sh'), script);
    return execFileSync('bash', [join(dir, 'detect.sh')]).toString();
  };
  assert.match(run(950, 50), /-s 1\b/);
  assert.match(run(30, 970), /-s 2\b/);
  assert.match(run(500, 500), /-s 0\b/);
  const ambiguous = run(700, 300);
  assert.match(ambiguous, /-s 0\b/);
  assert.match(ambiguous, /WARNING: strandedness is ambiguous/);
});

test('every tool and R package is pinned, and the server accepts the file', () => {
  const app = loadApp();
  const yaml = app.w.envYaml();
  const deps = yaml.split('\n').filter(l => l.startsWith('  - ') && !/^  - (conda-forge|bioconda)$/.test(l));
  assert.ok(deps.length >= 20);
  for (const d of deps) assert.match(d, /^  - [a-z0-9][a-z0-9._-]*=[A-Za-z0-9._]+$/, `unpinned: ${d}`);
  const names = deps.map(d => d.slice(4).split('=')[0]);
  assert.equal(new Set(names).size, names.length, 'no package listed twice');
  for (const must of ['r-base', 'bioconductor-deseq2', 'salmon', 'fastqc', 'qualimap'])
    assert.ok(names.includes(must), `${must} is in the environment`);
  // The same text must pass the server's /setup validator
  const verdict = execFileSync('python3', ['-c',
    'import sys; sys.path.insert(0, sys.argv[1]); import rnaflow_server as s; print(s.validate_env_yaml(sys.stdin.read()))', ROOT],
    { input: yaml }).toString().trim();
  assert.equal(verdict, 'None');
  // All three install blocks show the same command
  const install = app.text('cmd-install-env');
  assert.equal(app.text('cmd-fix-env'), install);
  assert.equal(app.text('cmd-recreate-env'), install);
  assert.ok(install.includes(yaml));
  app.close();
});

test('the QC summary is generated for both routes', () => {
  for (const method of ['salmon', 'align']) {
    const app = humanProject({ method });
    const qc = app.text('cmd-postqc');
    assert.match(qc, /rnaflow_qc_mqc\.tsv/);
    assert.match(qc, /multiqc .* --filename rnaflow_final_qc/);
    if (method === 'align') assert.match(qc, /qualimap rnaseq/);
    else assert.match(qc, /tx_info\.tsv/);
    app.close();
  }
});

test('the results explorer reads quoted CSV correctly', () => {
  const app = loadApp();
  const rows = app.w.rxParseCsv('ID,Description,p.adjust\r\nGO:1,"response to cortisol, and ""stress""",0.01\nGO:2,plain,NA\n');
  assert.deepEqual(JSON.parse(JSON.stringify(rows)), [
    { ID: 'GO:1', Description: 'response to cortisol, and "stress"', 'p.adjust': '0.01' },
    { ID: 'GO:2', Description: 'plain', 'p.adjust': 'NA' }
  ]);
  app.close();
});
