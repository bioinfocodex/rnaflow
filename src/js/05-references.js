// ── QUANTIFICATION METHOD (v3) ────────────────────────────────────────────
// Salmon quantifies straight against the transcriptome, so a laptop never has
// to build a genome index — the step that stops most beginners on human data.
const METHOD_BLURB = {
  align:  'Splice-aware genome alignment. Needed for novel transcripts, coverage tracks or variant work. Building the index needs a lot of RAM and time.',
  salmon: 'Quantifies against the transcriptome. Roughly 20× faster, runs on a laptop, no genome index. Gene-level counts come through tximport.',
  smallrna: 'For miRNA libraries (reads of ~18–30 nt). Trims the kit adapter, counts reads on the mature miRNAs in miRBase with Bowtie, then runs DESeq2 on the miRNA counts. Single-end; read 2 is not used.'
};

// Ensembl publishes cDNA next to the DNA it already has a URL for, so the
// transcriptome URL can be derived instead of maintained as a second table.
function cdnaUrlFrom(genomeUrl) {
  if (!genomeUrl || !/ensembl/i.test(genomeUrl)) return '';
  return genomeUrl
    .replace('/dna/', '/cdna/')
    .replace(/\.dna\.(toplevel|primary_assembly)\.fa\.gz$/, '.cdna.all.fa.gz');
}

// Non-coding transcripts (rRNA, lncRNA, snoRNA…) sit in a separate Ensembl
// file. Without them rRNA contamination cannot be measured and lncRNAs are
// never quantified.
function ncrnaUrlFrom(genomeUrl) {
  if (!genomeUrl || !/ensembl/i.test(genomeUrl)) return '';
  return genomeUrl
    .replace('/dna/', '/ncrna/')
    .replace(/\.dna\.(toplevel|primary_assembly)\.fa\.gz$/, '.ncrna.fa.gz');
}

// Reference downloads are slow (Ensembl often serves ~100 KB/s), so a re-run
// keeps any file that is already complete. gzip -t catches a download that
// was cut off, which is then fetched again.
function fetchGz(file, url) {
  return `[ -s ${file} ] && gzip -t ${file} 2>/dev/null && echo "Already have ${file}" \\\n` +
         `  || curl -fL -o ${file} "${url}"`;
}
// Same, for files RNAflow unpacks after download (genome FASTA, GTF)
function fetchGunzip(file, url) {
  return `[ -s ${file} ] && echo "Already have ${file}" \\\n` +
         `  || { curl -fL -o ${file}.gz "${url}" && gunzip -f ${file}.gz; }`;
}

// gene_id -> gene name from the GTF, so results, plots and the explorer show
// DUSP1 rather than ENSG00000120129. Genes without a name keep their ID.
// grep first: macOS awk takes ~50 s to split a human GTF, grep + awk 0.6 s.
function geneNamesCmd(base, org) {
  return `# ─── Gene names, for readable results and plots ───\n` +
    `grep "$(printf '\\tgene\\t')" ${base}/reference/${org}_annotation.gtf | awk -F'\\t' '$3 == "gene" { a = $9\n` +
    `  i = index(a, "gene_id \\""); id = substr(a, i + 9); id = substr(id, 1, index(id, "\\"") - 1)\n` +
    `  nm = id; j = index(a, "gene_name \\""); if (j) { nm = substr(a, j + 11); nm = substr(nm, 1, index(nm, "\\"") - 1) }\n` +
    `  print id "\\t" nm }' > ${base}/reference/gene_names.tsv\n` +
    `wc -l < ${base}/reference/gene_names.tsv   # genes named\n\n`;
}

function applyMethod() {
  const m = val('cfg-method', 'align');
  const blurb = document.getElementById('method-blurb');
  if (blurb) blurb.textContent = METHOD_BLURB[m] || '';

  // Steps that only make sense for one of the two routes
  const alignOnly = ['nav-align'];
  alignOnly.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = m === 'salmon' ? '0.55' : '';
  });
  const af = document.getElementById('adapter-field');
  if (af) af.style.display = m === 'smallrna' ? '' : 'none';
  updateAll();
}

function applyDataSource() {
  const ds = val('cfg-datasource', 'sra');
  const show = (id, on) => { const el = document.getElementById(id); if (el) el.style.display = on ? '' : 'none'; };
  show('ds-local-box', ds === 'local');
  show('ds-counts-box', ds === 'counts');
  show('ds-sra-box', ds === 'sra');
  // Sample inputs mean different things in each mode
  const hint = { local: 'file name, no extension', counts: 'column name in your table', sra: 'SRR/ERR accession' }[ds];
  document.querySelectorAll('#ctrl-rows input, #treat-rows input').forEach(i => { i.placeholder = hint; });
  // A count table skips everything up to differential expression
  const fastqSteps = ['nav-download', 'nav-qc', 'nav-trim', 'nav-genome', 'nav-align', 'nav-counts'];
  fastqSteps.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = (ds === 'counts' || (ds === 'local' && id === 'nav-download')) ? '0.55' : '';
  });
  updateAll();
}

