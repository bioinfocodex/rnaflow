// ── NF-CORE / SCRIPT EXPORT (v3) ──────────────────────────────────────────
// RNAflow is a teaching tool; nf-core/rnaseq is what you want once the design
// is settled. Exporting the config means the two do not have to be re-entered.
function nfStrandedness() {
  // nf-core wording, mapped from the featureCounts -s value used elsewhere
  return { '0': 'unstranded', '1': 'forward', '2': 'reverse' }[val('cfg-strand', 'auto')] || 'auto';
}

// Nextflow does not expand "~" inside a samplesheet field, so paths handed to
// another tool must be absolute. The server reports the real home path.
function absPath(p) {
  if (!p.startsWith('~')) return p;
  return serverHome ? serverHome + p.slice(1) : p;
}

function buildSamplesheet() {
  const base   = document.getElementById('folder-preview-text')?.textContent || '';
  const paired = val('cfg-readtype', 'single') === 'paired';
  const isLocal = val('cfg-datasource', 'sra') === 'local';
  const raw    = rawDir(base);
  const ext    = fqExt();
  const strand = nfStrandedness();
  const ctrl   = getSamples('ctrl-rows');
  const treat  = getSamples('treat-rows');

  const rows = ['sample,fastq_1,fastq_2,strandedness'];
  const rawAbs = absPath(raw);
  const add = s => {
    const f1 = paired ? `${rawAbs}/${s}_1${ext}` : `${rawAbs}/${s}${ext}`;
    const f2 = paired ? `${rawAbs}/${s}_2${ext}` : '';
    rows.push(`${s},${f1},${f2},${strand}`);
  };
  ctrl.forEach(add);
  treat.forEach(add);
  return { csv: rows.join('\n'), n: ctrl.length + treat.length, isLocal, strand, base };
}

function updateExports() {
  const sheet = buildSamplesheet();
  set('nf-samplesheet', sheet.csv);

  const note = document.getElementById('nf-sheet-note');
  if (note) {
    const bits = [`${sheet.n} samples · strandedness <code>${sheet.strand}</code>.`];
    if (!sheet.isLocal) {
      bits.push('Your data source is SRA, so these paths only exist after the download step. ' +
                'nf-core can also fetch from SRA itself with <code>nf-core/fetchngs</code>.');
    }
    if (!serverHome && sheet.csv.includes('~/')) {
      bits.push('⚠️ Start the local server so RNAflow can resolve <code>~</code> to a real path — ' +
                'Nextflow does not expand it inside a samplesheet.');
    }
    if (sheet.strand === 'unstranded') {
      bits.push('“Unstranded” is RNAflow’s default — if you are unsure, use <code>auto</code> and let the workflow detect it.');
    }
    note.innerHTML = bits.join(' ');
  }

  const base   = sheet.base;
  const org    = val('cfg-org-tag', 'organism');
  const gUrl   = val('cfg-genome-url', '');
  const gtfUrl = val('cfg-gtf-url', '');
  const T      = threads();
  const salmon = val('cfg-method', 'align') === 'salmon';

  // Flags verified against the nf-core/rnaseq 3.26.0 schema. Note that
  // --max_cpus was removed from nf-core; resource ceilings now go through
  // Nextflow's resourceLimits, and passing the old flag fails validation.
  const NF_VERSION = '3.26.0';
  const route = salmon
    ? '  --pseudo_aligner salmon --skip_alignment \\\n'   // no genome index, matches RNAflow's Salmon route
    : '  --aligner hisat2 \\\n';                          // matches HISAT2 + featureCounts

  const baseAbs = absPath(base);
  let cmd = `# 1. Samplesheet (or use the Download button above)\n`;
  cmd += `mkdir -p ${baseAbs}/nfcore\ncat > ${baseAbs}/nfcore/samplesheet.csv <<'CSV'\n${sheet.csv}\nCSV\n\n`;
  cmd += `# 2. Cap the resources Nextflow may ask for on this machine\n`;
  cmd += `cat > ${baseAbs}/nfcore/resources.config <<'CFG'\n`;
  cmd += `process.resourceLimits = [ cpus: ${T}, memory: '${Math.max(8, parseInt(T) * 4)}.GB', time: '48.h' ]\n`;
  cmd += `CFG\n\n`;
  cmd += `# 3. Run it. -resume makes a repeat run pick up where it stopped.\n`;
  cmd += `nextflow run nf-core/rnaseq -r ${NF_VERSION} \\\n`;
  cmd += `  --input ${baseAbs}/nfcore/samplesheet.csv \\\n`;
  cmd += `  --outdir ${baseAbs}/nfcore/results \\\n`;
  cmd += `  --fasta "${gUrl}" \\\n`;
  cmd += `  --gtf "${gtfUrl}" \\\n`;
  cmd += route;
  cmd += `  -c ${baseAbs}/nfcore/resources.config \\\n`;
  cmd += `  -profile docker \\\n`;
  cmd += `  -resume\n\n`;
  cmd += `# No Docker? swap -profile docker for singularity, or conda.\n`;
  cmd += `# nf-core builds its own index from the FASTA/GTF above, so RNAflow's\n`;
  cmd += `# genome and index steps are not needed for this route.`;
  set('nf-command', cmd);

  const rnote = document.getElementById('runall-note');
  if (rnote) rnote.textContent = `${sheet.n} samples · ${salmon ? 'Salmon' : 'HISAT2'} route · ${T} threads`;
}

function saveTextFile(name, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function downloadSamplesheet() {
  saveTextFile('samplesheet.csv', buildSamplesheet().csv + '\n', 'text/csv');
}

// Every generated bash step, in order, as one script
const RUNALL_STEPS = [
  ['Create the project folders',        'cmd-mkdir'],
  ['Check the reference URLs resolve',  'cmd-check-urls'],
  ['Download raw data',                 'cmd-download'],
  ['Quality control',                   'cmd-fastqc'],
  ['Aggregate QC reports',              'cmd-multiqc'],
  ['Trim reads',                        'cmd-trim'],
  ['Download genome / transcriptome',   'cmd-genome'],
  ['Build the index',                   'cmd-index'],
  ['Align / quantify',                  'cmd-align'],
  ['Post-alignment checks',             'cmd-bam'],
  ['Count reads per gene',              'cmd-counts'],
  ['QC summary (rRNA, mapping, coverage)', 'cmd-postqc'],
];

function downloadRunAll() {
  const base   = document.getElementById('folder-preview-text')?.textContent || '';
  const salmon = val('cfg-method', 'align') === 'salmon';
  const stamp  = new Date().toISOString().slice(0, 19).replace('T', ' ');

  let sh = `#!/usr/bin/env bash\n`;
  sh += `# ─────────────────────────────────────────────────────────────────\n`;
  sh += `# RNAflow v3 — generated ${stamp}\n`;
  sh += `# Project : ${base}\n`;
  sh += `# Route   : ${salmon ? 'Salmon (transcriptome)' : 'HISAT2 + featureCounts (genome)'}\n`;
  sh += `#\n`;
  sh += `# Runs every command RNAflow generated, in order. The R analysis is\n`;
  sh += `# deliberately not included — read the QC and PCA before running it.\n`;
  sh += `# ─────────────────────────────────────────────────────────────────\n`;
  sh += `set -euo pipefail\n\n`;
  sh += `# Stop at the first failure rather than carrying on with bad inputs.\n`;
  sh += `# Re-running is safe: finished steps simply redo their work.\n\n`;
  sh += `source "$(conda info --base)/etc/profile.d/conda.sh"\n`;
  sh += `conda activate rnaseq\n\n`;

  RUNALL_STEPS.forEach(([label, id], i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const body = el.textContent.trim();
    if (!body || body === '...') return;
    sh += `# ── ${i + 1}. ${label} ${'─'.repeat(Math.max(2, 52 - label.length))}\n`;
    sh += `echo "[$(date +%H:%M:%S)] ${label}"\n`;
    sh += body + '\n\n';
  });

  sh += `echo\necho "Pipeline finished. Next: open the QC report, then run the R analysis."\n`;
  saveTextFile('run_all.sh', sh, 'text/x-shellscript');
}

