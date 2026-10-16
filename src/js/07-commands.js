// ── MAIN COMMAND GENERATOR ─────────────────────────────────────────────────
function updateAll() {
  const loc    = val('cfg-loc', '~/Desktop');
  const org    = val('cfg-org-tag', 'organism');
  const base   = `${loc}/RNA-Seq_${org}`;
  const ctrl   = val('cfg-ctrl', 'control');
  const treat  = val('cfg-treat', 'treatment');
  const gUrl   = val('cfg-genome-url', '');
  const gtfUrl = val('cfg-gtf-url', '');
  const paired = val('cfg-readtype', 'single') === 'paired';
  const strand = val('cfg-strand', 'auto');
  const cSamp  = getSamples('ctrl-rows');
  const tSamp  = getSamples('treat-rows');
  const all    = [...cSamp, ...tSamp];
  const isLocal = val('cfg-datasource', 'sra') === 'local';
  const salmonMode = val('cfg-method', 'align') === 'salmon';
  // Starting from someone else's count table skips everything before DE
  const countsMode = val('cfg-datasource', 'sra') === 'counts';
  // miRNA libraries: trimmed, counted on miRBase, then DE on the miRNA table
  const smallMode = !countsMode && val('cfg-method', 'align') === 'smallrna';
  const raw    = rawDir(base);
  const ext    = fqExt();
  const T      = threads();

  // Read paths for a sample, honouring data source + extension + read type
  const r1 = s => paired ? `${raw}/${s}_1${ext}` : `${raw}/${s}${ext}`;
  const r2 = s => `${raw}/${s}_2${ext}`;
  // Quote for the shell but keep a leading ~ outside the quotes: "~/x" is a
  // literal folder called "~", so with the default SRA source and Desktop
  // location FastQC and fastp were handed paths that do not exist.
  const qp = p => p.startsWith('~/') ? `~/"${p.slice(2)}"` : `"${p}"`;

  // Labels
  document.getElementById('ctrl-name-label').textContent = ctrl;
  document.getElementById('treat-name-label').textContent = treat;
  document.getElementById('ctrl-count').textContent = cSamp.length + ' replicate' + (cSamp.length!==1?'s':'');
  document.getElementById('treat-count').textContent = tSamp.length + ' replicate' + (tSamp.length!==1?'s':'');
  document.getElementById('rep-warning').style.display = (cSamp.length<2||tSamp.length<2) ? 'block' : 'none';
  document.querySelectorAll('.ds-ext-hint, #ds-ext-hint').forEach(e => e.textContent = ext);

  // Topbar
  document.getElementById('tb-project').textContent = `RNA-Seq_${org}`;
  const orgKey = val('cfg-organism', 'yeast');
  document.getElementById('tb-organism').textContent = ORG[orgKey]?.tag || org;
  document.getElementById('tb-readtype').textContent = paired ? 'Paired-end' : 'Single-end';

  // Folder preview
  document.getElementById('folder-preview-text').textContent = base;
  document.getElementById('session-cmd-preview').textContent = `conda activate rnaseq && cd ${base}`;

  // Session
  set('cmd-session', `conda activate rnaseq\ncd ${base}`);

  // Mkdir — logs/ included so HPC schedulers have somewhere to write
  set('cmd-mkdir', `mkdir -p ${base}/{raw_data,trimmed,aligned,counts,results,qc,genome,reference,logs}\ncd ${base}\nls`);

  // List local FASTQ files
  set('cmd-list-local', `ls -lh ${raw}/ | head -40`);

  // Download — skipped entirely when the user already has the files
  if (isLocal) {
    set('cmd-download',
      `# Data source is set to "My own FASTQ files" — nothing to download.\n` +
      `# RNAflow reads directly from:\n#   ${raw}\n\n` +
      `# Confirm every sample below is present:\n` +
      (all.length ? all.map(s => paired
        ? `ls -lh ${qp(r1(s))} ${qp(r2(s))}`
        : `ls -lh ${qp(r1(s))}`).join('\n')
        : '# (add your sample names in the Experiment design section)'));
    set('cmd-check-dl', `ls -lh ${raw}/`);
  } else {
    let dl = `cd ${base}/raw_data\n\n# ─── Control samples: ${ctrl} ───\n`;
    cSamp.forEach(s => dl += paired
      ? `fasterq-dump ${s} --outdir ${base}/raw_data --progress --split-files -e ${T}\n`
      : `fasterq-dump ${s} --outdir ${base}/raw_data --progress -e ${T}\n`);
    dl += `\n# ─── Treatment samples: ${treat} ───\n`;
    tSamp.forEach(s => dl += paired
      ? `fasterq-dump ${s} --outdir ${base}/raw_data --progress --split-files -e ${T}\n`
      : `fasterq-dump ${s} --outdir ${base}/raw_data --progress -e ${T}\n`);
    set('cmd-download', envWrap(dl.trim(), 'step2_download'));
    set('cmd-check-dl', `ls -lh ${base}/raw_data/`);
  }

  // FastQC
  let fqc = '';
  // --outdir, not -o: FastQC 0.13 dropped the short form
  all.forEach(s => fqc += paired
    ? `fastqc --outdir ${base}/qc/ -t ${T} ${qp(r1(s))} ${qp(r2(s))}\n`
    : `fastqc --outdir ${base}/qc/ -t ${T} ${qp(r1(s))}\n`);
  set('cmd-fastqc', envWrap(fqc.trim(), 'step3_fastqc'));
  set('cmd-multiqc', envWrap(
    `multiqc ${base}/qc/ -o ${base}/qc/ --force\n\n${openCmd(base + '/qc/multiqc_report.html')}`,
    'step3_multiqc'));

  // Trim
  let trim = '';
  all.forEach(s => {
    if (paired) {
      trim += `fastp -i ${qp(r1(s))} -I ${qp(r2(s))} \\\n`;
      trim += `      -o ${base}/trimmed/${s}_1_trimmed.fastq.gz -O ${base}/trimmed/${s}_2_trimmed.fastq.gz \\\n`;
    } else {
      trim += `fastp -i ${qp(r1(s))} \\\n`;
      trim += `      -o ${base}/trimmed/${s}_trimmed.fastq.gz \\\n`;
    }
    trim += `      --trim_front1 5 --qualified_quality_phred 20 --length_required 36 -w ${Math.min(parseInt(T)||4, 16)} \\\n`;
    trim += `      --html ${base}/qc/${s}_fastp.html -j ${base}/qc/${s}_fastp.json\n\n`;
  });
  set('cmd-trim', envWrap(trim.trim(), 'step4_trim'));
  set('cmd-check-trim', envWrap(`ls -lh ${base}/trimmed/`, 'step4_check'));

  // Reference-URL sanity check — catches a retired Ensembl release in
  // seconds instead of after a failed multi-gigabyte download.
  const cdnaCheck = salmonMode ? cdnaUrlFrom(gUrl) : '';
  set('cmd-check-urls',
    `# 200/206 = the file is there. 404 = the release was retired —\n` +
    `# get a current link from the portals below and paste it on Configure.\n` +
    [['genome FASTA', salmonMode ? (cdnaCheck || gUrl) : gUrl], ['annotation GTF', gtfUrl]]
      .map(([label, u]) => `curl -sIL -o /dev/null -w "%{http_code}  ${label}\\n" "${u}"`)
      .join('\n'));
  const relV = document.getElementById('rel-vert');
  if (relV) {
    relV.textContent = ENSEMBL_RELEASE.vertebrates;
    document.getElementById('rel-genomes').textContent = ENSEMBL_RELEASE.genomes;
    document.getElementById('rel-checked').textContent = ENSEMBL_RELEASE.checked;
  }

  // Genome / transcriptome — depends on the quantification method
  if (salmonMode) {
    const cdna = cdnaUrlFrom(gUrl);
    let gCmd = `# ─── Download the TRANSCRIPTOME (cDNA) ───\n`;
    gCmd += `# Salmon quantifies against transcripts, so no genome index is needed.\n`;
    gCmd += `cd ${base}/genome\n${fetchGz(`${org}_cdna.fa.gz`, cdna || 'PASTE_YOUR_CDNA_URL_HERE')}\n\n`;
    const ncrna = ncrnaUrlFrom(gUrl);
    gCmd += `# ─── Add the non-coding transcripts (rRNA, lncRNA, …) ───\n`;
    gCmd += `# Needed to measure rRNA contamination and to quantify lncRNAs.\n`;
    gCmd += `# A few species have no ncRNA file; the cDNA alone still works.\n`;
    gCmd += `{ ${fetchGz(`${org}_ncrna.fa.gz`, ncrna || 'PASTE_YOUR_NCRNA_URL_HERE')}; } \\\n`;
    gCmd += `  || { echo "No ncRNA file found — continuing with cDNA only"; : > ${org}_ncrna.fa.gz; }\n`;
    gCmd += `cat ${org}_cdna.fa.gz ${org}_ncrna.fa.gz > ${org}_transcriptome.fa.gz\n\n`;
    if (!cdna) {
      gCmd += `# ⚠ Could not derive a cDNA URL from your genome URL.\n`;
      gCmd += `#   Find it on Ensembl under "Download transcript sequences (FASTA)"\n`;
      gCmd += `#   and paste it above — the file ends in .cdna.all.fa.gz\n\n`;
    }
    gCmd += `# ─── Download gene annotation GTF (used for gene-level summaries) ───\n`;
    gCmd += `cd ${base}/reference\n${fetchGunzip(`${org}_annotation.gtf`, gtfUrl)}\n\n`;
    gCmd += geneNamesCmd(base, org);
    gCmd += `# ─── Build the transcript → gene map straight from the FASTA headers ───\n`;
    gCmd += `# Ensembl cDNA headers carry "gene:ENSG….12", so no extra database is needed.\n`;
    gCmd += `# Versions are dropped from both IDs: tximport's ignoreTxVersion strips them\n`;
    gCmd += `# from the Salmon output, so a versioned map matches nothing (v3.0 failed\n`;
    gCmd += `# here), and unversioned gene IDs match annotation databases and the\n`;
    gCmd += `# HISAT2 route.\n`;
    gCmd += `zcat < ${base}/genome/${org}_transcriptome.fa.gz | grep "^>" \\\n`;
    gCmd += `  | sed -E 's/^>([^ ]+).*gene:([^ ]+).*/\\1,\\2/; s/\\.[0-9]+,/,/; s/\\.[0-9]+$//' > ${base}/reference/tx2gene.csv\n`;
    gCmd += `# Transcript biotype and chromosome, for the rRNA / mitochondrial QC\n`;
    gCmd += `# (awk, not sed: macOS sed writes \\t as a literal "t")\n`;
    gCmd += `zcat < ${base}/genome/${org}_transcriptome.fa.gz | awk '/^>/{\n`;
    gCmd += `  split($3, loc, ":"); bt = "";\n`;
    gCmd += `  for (i = 4; i <= NF; i++) if ($i ~ /^transcript_biotype:/) bt = substr($i, 20);\n`;
    gCmd += `  if (bt != "") print substr($1, 2) "\\t" bt "\\t" loc[3] }' > ${base}/reference/tx_info.tsv\n`;
    gCmd += `wc -l < ${base}/reference/tx2gene.csv   # transcripts mapped\nhead -3 ${base}/reference/tx2gene.csv`;
    set('cmd-genome', envWrap(gCmd, 'step5_transcriptome'));

    set('cmd-index', envWrap(
      `# Build the Salmon index — minutes, not hours, and modest on memory\n` +
      `salmon index -t ${base}/genome/${org}_transcriptome.fa.gz \\\n` +
      `             -i ${base}/genome/${org}_salmon_index \\\n` +
      `             -k 31 -p ${T}\n\nls -lh ${base}/genome/${org}_salmon_index/`, 'step5_index'));
  } else {
    let gCmd = `# ─── Download genome FASTA ───\ncd ${base}/genome\n${fetchGunzip(`${org}_genome.fa`, gUrl)}\n\n`;
    gCmd += `# ─── Download gene annotation GTF ───\ncd ${base}/reference\n${fetchGunzip(`${org}_annotation.gtf`, gtfUrl)}\n\n`;
    gCmd += geneNamesCmd(base, org);
    gCmd += `# ─── Verify (genome ~5–800 MB, annotation ~5–50 MB) ───\nls -lh ${base}/genome/ && ls -lh ${base}/reference/`;
    set('cmd-genome', envWrap(gCmd, 'step5_genome'));

    set('cmd-index', envWrap(
      `# Build once — reuse for all future samples with the same organism\nhisat2-build -p ${T} ${base}/genome/${org}_genome.fa \\\n             ${base}/genome/${org}_index\n\n# Verify: should see 8 files ending in .ht2\nls -lh ${base}/genome/`, 'step5_index'));
  }

  // Align / quantify — depends on the quantification method
  if (salmonMode) {
    // Salmon replaces alignment AND counting with one pass per sample
    let q = `# Salmon quantifies each sample directly — no SAM/BAM in between.\n`;
    q += `# -l A lets Salmon detect the library type, including strandedness.\n\n`;
    all.forEach(s => {
      q += `salmon quant -i ${base}/genome/${org}_salmon_index -l A \\\n`;
      q += paired
        ? `             -1 ${base}/trimmed/${s}_1_trimmed.fastq.gz \\\n             -2 ${base}/trimmed/${s}_2_trimmed.fastq.gz \\\n`
        : `             -r ${base}/trimmed/${s}_trimmed.fastq.gz \\\n`;
      q += `             --validateMappings --gcBias --seqBias -p ${T} \\\n`;
      q += `             -o ${base}/counts/quants/${s}\n\n`;
    });
    q += versionsCmd(base);
    set('cmd-align', envWrap(q.trim(), 'step6_quant'));
    set('cmd-bam', envWrap(
      `# Salmon produced no BAM files, so there is nothing to sort or index.\n` +
      `# Check the mapping rate for every sample instead — under ~50% usually\n` +
      `# means the wrong transcriptome or heavy contamination.\n` +
      `grep -H "percent_mapped" ${base}/counts/quants/*/aux_info/meta_info.json`,
      'step6_check'));

    set('cmd-counts', envWrap(
      `# Salmon already produced per-sample transcript quantifications.\n` +
      `# The DESeq2 step sums them to gene level with tximport.\n` +
      `ls -1 ${base}/counts/quants/\n\n` +
      `# Each sample has a quant.sf like this:\n` +
      `head -3 ${base}/counts/quants/${all[0] || 'SAMPLE'}/quant.sf`, 'step7_counts'));
    set('cmd-preview',
      `# Transcript-level TPM for one sample\ncolumn -t < ${base}/counts/quants/${all[0] || 'SAMPLE'}/quant.sf | head -20`);
  } else {
    // Pipe straight into samtools — writing a SAM first then deleting it
    // costs ~100 GB of scratch I/O per human sample for no benefit.
    let align = `# hisat2 streams into samtools, so no .sam file is ever written.\n\n`;
    let bam = '';
    all.forEach(s => {
      align += `# ${s}\n`;
      align += `hisat2 -x ${base}/genome/${org}_index \\\n`;
      align += paired
        ? `       -1 ${base}/trimmed/${s}_1_trimmed.fastq.gz \\\n       -2 ${base}/trimmed/${s}_2_trimmed.fastq.gz \\\n`
        : `       -U ${base}/trimmed/${s}_trimmed.fastq.gz \\\n`;
      align += `       --summary-file ${base}/aligned/${s}_summary.txt -p ${T} \\\n`;
      align += `  | samtools sort -@ ${T} -o ${base}/aligned/${s}.bam -\n`;
      align += `samtools index -@ ${T} ${base}/aligned/${s}.bam\n\n`;
      bam += `samtools flagstat -@ ${T} ${base}/aligned/${s}.bam | head -5\n`;
    });
    align += versionsCmd(base);
    set('cmd-align', envWrap(align.trim(), 'step6_align'));
    set('cmd-bam', envWrap(
      `# Alignment already produced sorted, indexed BAMs.\n` +
      `# Check the mapping rate for each sample — below ~70% usually means\n` +
      `# the wrong genome, the wrong read type, or heavy adapter contamination.\n\n` +
      bam.trim() + `\n\n# Aggregate every alignment summary into one report\n` +
      `multiqc ${base}/aligned/ -o ${base}/qc/ --force`, 'step6_bam'));

    const pe  = paired ? '\n  -p --countReadPairs \\' : '';
    const bams = all.map(s=>`  ${base}/aligned/${s}.bam`).join(' \\\n');
    const gtf  = `${base}/reference/${org}_annotation.gtf`;
    // Counting with the wrong strand setting silently discards up to half the
    // reads (or counts antisense reads as sense), so by default the strand is
    // measured: count the first sample both ways round, the same rule
    // nf-core/rnaseq applies (>= 80% one way means stranded).
    let detect = '';
    if (strand === 'auto') {
      const first = `${base}/aligned/${all[0] || 'SAMPLE'}.bam`;
      detect =
        `# ─── Detect strandedness from ${all[0] || 'the first sample'} ───\n` +
        `mkdir -p ${base}/counts/strand_check\n` +
        `for s in 1 2; do\n` +
        `  featureCounts -a ${gtf} -o ${base}/counts/strand_check/s$s.txt \\\n` +
        `    -T ${T} -s $s ${paired ? '-p --countReadPairs ' : ''}${first} > /dev/null 2>&1\n` +
        `done\n` +
        `fwd=$(awk '$1=="Assigned"{print $2}' ${base}/counts/strand_check/s1.txt.summary)\n` +
        `rev=$(awk '$1=="Assigned"{print $2}' ${base}/counts/strand_check/s2.txt.summary)\n` +
        `STRAND=$(awk -v f="$fwd" -v r="$rev" 'BEGIN{ p = (f+r) ? f/(f+r) : 0.5;\n` +
        `  if (p >= 0.8) print 1; else if (p <= 0.2) print 2; else print 0 }')\n` +
        `echo "Strandedness: forward=$fwd reverse=$rev -> featureCounts -s $STRAND" \\\n` +
        `  | tee ${base}/counts/strandedness.txt\n` +
        `awk -v f="$fwd" -v r="$rev" 'BEGIN{ p = (f+r) ? f/(f+r) : 0.5;\n` +
        `  if ((p > 0.2 && p < 0.4) || (p > 0.6 && p < 0.8))\n` +
        `    print "WARNING: strandedness is ambiguous — check your library kit and set it on Configure" }'\n\n` +
        `# ─── Count every sample ───\n`;
    }
    set('cmd-counts', envWrap(
      `${detect}featureCounts \\\n  -a ${gtf} \\\n  -o ${base}/counts/gene_counts_all.txt \\\n  -T ${T} \\\n  -s ${strand === 'auto' ? '$STRAND' : strand} \\${pe}\n${bams}`, 'step7_counts'));
    set('cmd-preview',
      `grep -v "^#" ${base}/counts/gene_counts_all.txt | awk '{print $1, $7, $8}' | head -20 | column -t`);
  }

  // QC summary — after quantification, before any statistics
  set('cmd-postqc', envWrap(postQcCmd({
    base, all, salmonMode, paired, strand, T,
    gtf: `${base}/reference/${org}_annotation.gtf`
  }), 'step7_qc'));

  if (smallMode) {
    const steps = smallRnaSteps({ base, all, T, orgKey: val('cfg-organism', 'human'),
                                  adapter: val('cfg-adapter', 'auto'), r1, qp });
    Object.entries(steps).forEach(([id, text]) => set(id, envWrap(text, id.replace('cmd-', 'step_'))));
  }

  if (countsMode) {
    const skip = '# Not needed: this project starts from a count table (Configure → Data source).';
    ['cmd-download', 'cmd-check-dl', 'cmd-fastqc', 'cmd-multiqc', 'cmd-trim', 'cmd-check-trim',
     'cmd-check-urls', 'cmd-genome', 'cmd-index', 'cmd-align', 'cmd-bam', 'cmd-counts',
     'cmd-preview', 'cmd-postqc'].forEach(id => set(id, skip));
  }

  // DESeq2
  const nc = all.length;
  const condVec = [...cSamp.map(()=>`"${ctrl}"`), ...tSamp.map(()=>`"${treat}"`)].join(', ');

  // Optional pairing / batch: one label per sample, controls first. Used only
  // when it gives a valid model — otherwise DESeq2 stops with "the model
  // matrix is not full rank" — and the reason is shown on Configure.
  const pairs = val('cfg-pairs', '').split(',').map(x => x.trim()).filter(Boolean);
  let pairNote = '';
  if (pairs.length) {
    const cond = [...cSamp.map(() => 'c'), ...tSamp.map(() => 't')];
    const shared = [...new Set(pairs)].some(p => {
      const inGroups = new Set(pairs.map((q, i) => q === p ? cond[i] : null).filter(Boolean));
      return inGroups.size === 2;
    });
    if (pairs.length !== nc) pairNote = `You gave ${pairs.length} labels for ${nc} samples — one per sample is needed.`;
    else if (new Set(pairs).size === nc) pairNote = 'Every label is different, so nothing is paired.';
    else if (!shared) pairNote = 'No label is shared by a control and a treated sample, so pairing cannot be separated from the treatment.';
  }
  const paired_design = pairs.length > 0 && !pairNote;
  const hint = document.getElementById('pairs-hint');
  if (hint) {
    hint.dataset.base = hint.dataset.base || hint.innerHTML;
    hint.innerHTML = pairNote
      ? `<span style="color:var(--red)">⚠ ${pairNote} DESeq2 will use <code>~ condition</code> until this is fixed.</span>`
      : paired_design ? `<span style="color:var(--green)">✓ Paired design: <code>~ pair + condition</code> with ${new Set(pairs).size} pairs/batches.</span>`
      : hint.dataset.base;
  }
  const pairVec = pairs.map(p => `"${p.replace(/["\\]/g, '')}"`).join(', ');
  const designFormula = paired_design ? '~pair + condition' : '~condition';
  const metaR = rowsExpr =>
    `# Sample metadata\nsample_info <- data.frame(\n  condition = factor(c(${condVec}), levels=c("${ctrl}", "${treat}")),\n` +
    (paired_design ? `  pair = factor(c(${pairVec})),\n` : '') +
    `  row.names = ${rowsExpr}\n)\nprint(sample_info)\n\n` +
    (paired_design ? `# Samples sharing a pair/batch label are compared with each other, so\n# donor-to-donor differences do not hide the treatment effect.\n` : '');
  const colNames = [
    ...cSamp.map((_,i)=>`"${ctrl.substring(0,3).toUpperCase()}_${i+1}"`),
    ...tSamp.map((_,i)=>`"${treat.substring(0,3).toUpperCase()}_${i+1}"`)
  ].join(', ');
  const sampleOrder = all.map(s=>`"${s}"`).join(', ');
  let r;
  if (countsMode || smallMode) {
    r  = `library(DESeq2); library(ggplot2); library(pheatmap); library(ggrepel); library(dplyr)\n\n`;
    r += `# Project path — results are written here\nbase_path <- "${base}"\n`;
    r += `dir.create(file.path(base_path, "results"), recursive=TRUE, showWarnings=FALSE)\n\n`;
    r += countTableLoaderR({
      file: smallMode ? `${base}/counts/mirna_counts.tsv`
                      : (val('cfg-counts-path', '') || 'PASTE_THE_PATH_TO_YOUR_COUNT_TABLE'),
      sheet: smallMode ? '' : val('cfg-counts-sheet', ''), sampleOrder, colNames
    });
    r += metaR('colnames(counts)');
    r += `# Run DESeq2\ndds <- DESeqDataSetFromMatrix(countData=counts, colData=sample_info, design=${designFormula})\ndds <- dds[rowSums(counts(dds)) >= 10, ]\ncat("Genes after filtering:", nrow(dds), "\\n")\ndds <- DESeq(dds)\n\n`;
  } else if (salmonMode) {
    r  = `library(DESeq2); library(tximport); library(ggplot2); library(pheatmap); library(ggrepel); library(dplyr)\n\n`;
    r += `# Project path — matches your folder\nbase_path <- "${base}"\n\n`;
    r += `# Salmon wrote one folder per sample; tximport sums transcripts to genes\n`;
    r += `sample_ids <- c(${sampleOrder})\n`;
    r += `files <- file.path(base_path, "counts", "quants", sample_ids, "quant.sf")\n`;
    r += `names(files) <- c(${colNames})\n`;
    r += `missing <- sample_ids[!file.exists(files)]\n`;
    r += `if (length(missing)) stop("No quant.sf for: ", paste(missing, collapse=", "))\n\n`;
    r += `# Transcript -> gene map built from the cDNA FASTA in the previous step\n`;
    r += `tx2gene <- read.csv(paste0(base_path, "/reference/tx2gene.csv"),\n`;
    r += `                    header=FALSE, col.names=c("TXNAME","GENEID"))\n`;
    r += `cat("Transcripts in map:", nrow(tx2gene), "\\n")\n\n`;
    r += `# ignoreTxVersion handles ENST00000456328.2 vs ENST00000456328\n`;
    r += `txi <- tximport(files, type="salmon", tx2gene=tx2gene, ignoreTxVersion=TRUE)\n`;
    r += `cat("Genes quantified:", nrow(txi$counts), "\\n\\n")\n\n`;
    r += metaR('colnames(txi$counts)');
    r += `# Run DESeq2 — DESeqDataSetFromTximport carries the average transcript\n`;
    r += `# lengths across as offsets, which is why this is not just a count matrix.\n`;
    r += `dds <- DESeqDataSetFromTximport(txi, colData=sample_info, design=${designFormula})\ndds <- dds[rowSums(counts(dds)) >= 10, ]\ncat("Genes after filtering:", nrow(dds), "\\n")\ndds <- DESeq(dds)\n\n`;
  } else {
    r  = `library(DESeq2); library(ggplot2); library(pheatmap); library(ggrepel); library(dplyr)\n\n`;
    r += `# Project path — matches your folder\nbase_path <- "${base}"\n\n`;
    r += `# Load count table\ncounts_raw <- read.table(paste0(base_path, "/counts/gene_counts_all.txt"),\n`;
    r += `                          header=TRUE, skip=1, row.names=1, check.names=FALSE)\n\n`;
    r += `# Pick sample columns by BAM name, not by position — a failed sample can\n`;
    r += `# otherwise shift every column and silently mislabel your conditions.\n`;
    r += `sample_ids <- c(${sampleOrder})\n`;
    r += `bam_cols   <- colnames(counts_raw)[-(1:5)]           # drop Chr/Start/End/Strand/Length\n`;
    r += `idx        <- match(sample_ids, tools::file_path_sans_ext(basename(bam_cols)))\n`;
    r += `if (any(is.na(idx))) stop("Missing count columns for: ",\n`;
    r += `                          paste(sample_ids[is.na(idx)], collapse=", "))\n`;
    r += `counts <- counts_raw[, bam_cols[idx], drop=FALSE]\n`;
    r += `colnames(counts) <- c(${colNames})\nhead(counts)  # check it looks right\n\n`;
    r += metaR('colnames(counts)');
    r += `# Run DESeq2\ndds <- DESeqDataSetFromMatrix(countData=counts, colData=sample_info, design=${designFormula})\ndds <- dds[rowSums(counts(dds)) >= 10, ]\ncat("Genes after filtering:", nrow(dds), "\\n")\ndds <- DESeq(dds)\n\n`;
  }
  r += `# Results: ${treat} vs ${ctrl}\nres <- results(dds, contrast=c("condition", "${treat}", "${ctrl}"), alpha=0.05)\nsummary(res)\n\n`;
  r += `# Shrunken fold changes (apeglm): low-count genes no longer produce huge, noisy\n`;
  r += `# fold changes. Use these for ranking, plots and fold-change cut-offs; padj is\n`;
  r += `# unchanged. "${ctrl}" is the reference level and condition is the last term\n`;
  r += `# of the design, so the last coefficient is ${treat} vs ${ctrl}.\n`;
  r += `res_shrunk <- lfcShrink(dds, coef=tail(resultsNames(dds), 1), type="apeglm", quiet=TRUE)\n\n`;
  r += `# Save to CSV\nres_df <- as.data.frame(res)\nres_df$log2FoldChange_shrunk <- res_shrunk$log2FoldChange\nres_df$gene <- rownames(res_df)\n`;
  r += `# Gene names from the GTF (written by the reference step), when available\n`;
  r += `names_file <- paste0(base_path, "/reference/gene_names.tsv")\n`;
  r += `if (file.exists(names_file)) {\n`;
  r += `  gn <- read.delim(names_file, header=FALSE, col.names=c("id","name"), quote="")\n`;
  r += `  res_df$symbol <- gn$name[match(sub("\\\\.[0-9]+$", "", res_df$gene), gn$id)]\n`;
  r += `  res_df$symbol[is.na(res_df$symbol)] <- res_df$gene[is.na(res_df$symbol)]\n`;
  r += `} else res_df$symbol <- res_df$gene\n`;
  r += `write.csv(res_df, paste0(base_path, "/results/deseq2_results.csv"), row.names=FALSE)\n\n`;
  r += `# Normalised counts and the sample sheet, for the interactive explorer\n`;
  r += `norm <- as.data.frame(counts(dds, normalized=TRUE))\nnorm <- cbind(gene=rownames(norm), round(norm, 2))\n`;
  r += `write.csv(norm, paste0(base_path, "/results/normalized_counts.csv"), row.names=FALSE)\n`;
  r += `write.csv(data.frame(sample=colnames(dds), condition=dds$condition),\n`;
  r += `          paste0(base_path, "/results/samples.csv"), row.names=FALSE)\n`;
  r += `saveRDS(dds, paste0(base_path, "/results/dds.rds"))  # reused by the plot steps\n`;
  r += `writeLines(capture.output(sessionInfo()), paste0(base_path, "/results/R_sessionInfo.txt"))  # exact R package versions\n\n`;
  r += `cat("\\nResults:\\n")\ncat("  Total genes tested: ", nrow(res_df), "\\n")\ncat("  Significant (padj<0.05): ", sum(res_df$padj<0.05, na.rm=TRUE), "\\n")\ncat("  Upregulated: ", sum(res_df$padj<0.05 & res_df$log2FoldChange>0, na.rm=TRUE), "\\n")\ncat("  Downregulated: ", sum(res_df$padj<0.05 & res_df$log2FoldChange<0, na.rm=TRUE), "\\n")`;
  set('cmd-deseq2', r);
  set('cmd-consensus', consensusR(base));

  // Plot steps reload dds so each block runs standalone via Rscript
  const reload = `library(DESeq2); library(ggplot2); library(pheatmap); library(ggrepel); library(dplyr)\nbase_path <- "${base}"\ndds    <- readRDS(paste0(base_path, "/results/dds.rds"))\nres_df <- read.csv(paste0(base_path, "/results/deseq2_results.csv"))\nrownames(res_df) <- res_df$gene\n\n`;

  // Volcano
  let v = reload;
  v += `res_df <- res_df[!is.na(res_df$padj), ]\n`;
  v += `# Shrunken fold changes keep low-count genes from crowding the edges\n`;
  v += `if (!is.null(res_df$log2FoldChange_shrunk)) res_df$log2FoldChange <- res_df$log2FoldChange_shrunk\n`;
  v += `res_df$sig <- "Not significant"\n`;
  v += `res_df$sig[res_df$padj<0.05 & res_df$log2FoldChange > 1]  <- "Up in ${treat}"\n`;
  v += `res_df$sig[res_df$padj<0.05 & res_df$log2FoldChange < -1] <- "Down in ${treat}"\n`;
  v += `top_genes <- res_df %>% filter(padj<0.05) %>% arrange(padj) %>% head(15)\n`;
  v += `# Label with gene names when the results carry them (from v3.2)\n`;
  v += `top_genes$label <- if (!is.null(top_genes$symbol)) top_genes$symbol else top_genes$gene\n\n`;
  v += `p <- ggplot(res_df, aes(log2FoldChange, -log10(padj), color=sig)) +\n`;
  v += `  geom_point(alpha=0.6, size=1.5) +\n`;
  v += `  scale_color_manual(values=c("Up in ${treat}"="#f0883e", "Down in ${treat}"="#58a6ff", "Not significant"="#6e7681")) +\n`;
  v += `  geom_text_repel(data=top_genes, aes(label=label), size=3, max.overlaps=15) +\n`;
  v += `  geom_vline(xintercept=c(-1,1), linetype="dashed", color="#444") +\n`;
  v += `  geom_hline(yintercept=-log10(0.05), linetype="dashed", color="#444") +\n`;
  v += `  labs(title=paste0("Volcano: ${treat} vs ${ctrl}"), x="Log2 fold change (apeglm-shrunken)", y="-Log10 adjusted p-value") +\n`;
  v += `  theme_minimal(base_size=13)\nprint(p)\n`;
  v += `ggsave(paste0(base_path, "/results/volcano_plot.png"), plot=p, width=10, height=7, dpi=300)\ncat("Volcano plot saved!\\n")`;
  set('cmd-volcano', v);

  // Heatmap
  let h = reload;
  h += `top40 <- res_df %>% filter(padj<0.05) %>% arrange(padj) %>% head(40) %>% pull(gene)\n`;
  h += `if (length(top40) < 3) stop("Fewer than 3 significant genes — nothing to draw.")\n`;
  h += `vst_data <- vst(dds, blind=FALSE)\nmat <- assay(vst_data)[top40, ]\nmat_scaled <- t(scale(t(mat)))\n`;
  h += `pheatmap(mat_scaled,\n  cluster_rows=TRUE, cluster_cols=FALSE,\n  color=colorRampPalette(c("#58a6ff","white","#f0883e"))(100),\n`;
  h += `  main="Top 40 most significant genes", fontsize_row=8,\n  filename=paste0(base_path, "/results/heatmap_top40.png"), width=8, height=10)\ncat("Heatmap saved!\\n")`;
  set('cmd-heatmap', h);

  // PCA
  let pc = reload;
  pc += `vst_b <- vst(dds, blind=TRUE)\n`;
  pc += `pca <- plotPCA(vst_b, intgroup="condition") +\n  geom_text_repel(aes(label=name), size=4) +\n  theme_minimal(base_size=13) +\n`;
  pc += `  labs(title="PCA — sample quality check", subtitle="Replicates should cluster together")\nprint(pca)\n`;
  pc += `ggsave(paste0(base_path, "/results/pca_plot.png"), plot=pca, width=8, height=6, dpi=300)\ncat("PCA saved!\\n")`;
  set('cmd-pca', pc);

  syncAdvancedPages(base, ctrl, treat, cSamp.length, tSamp.length, orgKey);
  if (smallMode) set('cmd-fgsea', '# Gene-set enrichment analyses genes, not miRNAs. For miRNA function,\n' +
    '# look up the validated targets of your significant miRNAs (e.g. miRTarBase) and\n# run enrichment on those target genes.');
  updateExports();

  saveConfig();
}



// R that reads a count table (CSV, TSV, TXT or Excel) into `counts`, with one
// column per sample named as in colNames. Used for imported tables and for
// the small-RNA route, whose counts are assembled into the same shape.
// It refuses what would give silently wrong results: missing samples,
// non-numeric columns, and normalised values passed off as counts.
function countTableLoaderR({ file, sheet, sampleOrder, colNames }) {
  const sheetArg = !sheet ? '1' : /^\d+$/.test(sheet) ? sheet : `"${sheet.replace(/["\\]/g, '')}"`;
  return `# ─── Read the count table ───\n` +
    `counts_file <- "${file.replace(/["\\]/g, '')}"\n` +
    `if (!file.exists(counts_file)) stop("Count table not found: ", counts_file)\n` +
    `ext <- tolower(tools::file_ext(counts_file))\n` +
    `raw <- if (ext %in% c("xlsx", "xls")) {\n` +
    `  as.data.frame(readxl::read_excel(counts_file, sheet=${sheetArg}))\n` +
    `} else {\n` +
    `  # comment="#" skips featureCounts' header line; .csv is comma, anything else tab\n` +
    `  as.data.frame(readr::read_delim(counts_file, delim=if (ext == "csv") "," else "\\t",\n` +
    `                                  comment="#", show_col_types=FALSE))\n` +
    `}\n` +
    `cat("Read", nrow(raw), "rows and", ncol(raw), "columns from", basename(counts_file), "\\n")\n\n` +
    `# Samples are picked by column name, never by position\n` +
    `sample_ids <- c(${sampleOrder})\n` +
    `missing <- setdiff(sample_ids, colnames(raw))\n` +
    `if (length(missing)) stop("These samples are not columns of the table: ", paste(missing, collapse=", "),\n` +
    `                          "\\n  Columns found: ", paste(colnames(raw), collapse=", "))\n` +
    `counts <- as.matrix(raw[, sample_ids, drop=FALSE])\n` +
    `if (!is.numeric(counts)) stop("Sample columns must contain numbers only — check for text or blank cells.")\n` +
    `if (anyNA(counts)) stop("The table has empty cells in sample columns; DESeq2 needs a count for every gene.")\n` +
    `if (any(counts < 0)) stop("The table has negative values — these are not read counts.")\n` +
    `# TPM and CPM sum to one million in every sample; read counts never do\n` +
    `if (all(abs(colSums(counts) / 1e6 - 1) < 0.01))\n` +
    `  stop("Every sample sums to one million: these are TPM or CPM values, not read counts. ",\n` +
    `       "DESeq2 needs the raw counts — ask for the counts file, or use the FASTQ files.")\n` +
    `if (any(counts %% 1 != 0)) {\n` +
    `  warning("Some values are not whole numbers. DESeq2 needs raw read counts; TPM, FPKM or ",\n` +
    `          "normalised values give wrong results. Rounding — only correct for estimated counts ",\n` +
    `          "such as RSEM or Salmon expected counts.")\n` +
    `  counts <- round(counts)\n` +
    `}\n` +
    `storage.mode(counts) <- "integer"\n\n` +
    `# Gene IDs from the first column; repeated IDs are summed\n` +
    `genes <- as.character(raw[[1]])\n` +
    `if (anyDuplicated(genes)) {\n` +
    `  cat("Summing", sum(duplicated(genes)), "repeated gene IDs\\n")\n` +
    `  counts <- rowsum(counts, genes)\n` +
    `} else rownames(counts) <- genes\n` +
    `colnames(counts) <- c(${colNames})\n` +
    `cat("Count matrix:", nrow(counts), "genes x", ncol(counts), "samples\\n\\n")\n\n`;
}

// edgeR and limma-voom on DESeq2's own dataset (same samples, filtering
// and design), then a three-way comparison. For Salmon projects each method
// gets the input its authors recommend with tximport: transcript-length
// offsets for edgeR, length-scaled counts for limma-voom.
function consensusR(base) {
  return `library(DESeq2); library(edgeR); library(limma); library(ggplot2)\n` +
    `base_path <- "${base}"\n` +
    `padj_cut <- 0.05; lfc_cut <- 1     # the same cut-offs as the volcano plot\n\n` +
    `dds <- readRDS(paste0(base_path, "/results/dds.rds"))\n` +
    `deseq <- read.csv(paste0(base_path, "/results/deseq2_results.csv"))\n` +
    `cts <- counts(dds)\n` +
    `info <- as.data.frame(colData(dds))\n` +
    `mm <- model.matrix(design(dds), info)    # DESeq2's design, pairing included\n` +
    `coef <- ncol(mm)                          # condition is the last term\n` +
    `cat("Design:", deparse(design(dds)), "| testing", colnames(mm)[coef], "\\n\\n")\n\n` +
    `salmon <- "avgTxLength" %in% assayNames(dds)\n` +
    `y <- DGEList(cts)\n` +
    `if (salmon) {\n` +
    `  # tximport vignette, edgeR section: average transcript lengths as offsets\n` +
    `  len <- assays(dds)[["avgTxLength"]]\n` +
    `  len <- len / exp(rowMeans(log(len)))\n` +
    `  eff_lib <- calcNormFactors(cts / len) * colSums(cts / len)\n` +
    `  y <- scaleOffset(y, log(sweep(len, 2, eff_lib, "*")))\n` +
    `}\n` +
    `keep <- filterByExpr(y, mm)\n` +
    `cat("Genes kept by filterByExpr:", sum(keep), "of", length(keep), "\\n")\n\n` +
    `# ─── edgeR: quasi-likelihood F-test ───\n` +
    `ye <- y[keep, , keep.lib.sizes=FALSE]\n` +
    `if (!salmon) ye <- normLibSizes(ye)          # TMM\n` +
    `ye <- estimateDisp(ye, mm)\n` +
    `et <- topTags(glmQLFTest(glmQLFit(ye, mm), coef=coef), n=Inf)$table\n` +
    `et$gene <- rownames(et)\n` +
    `write.csv(et, paste0(base_path, "/results/edgeR_results.csv"), row.names=FALSE)\n\n` +
    `# ─── limma-voom with sample quality weights ───\n` +
    `vc <- cts\n` +
    `if (salmon) {\n` +
    `  # tximport's "lengthScaledTPM": length-corrected, back on the count scale\n` +
    `  len <- assays(dds)[["avgTxLength"]]\n` +
    `  vc <- (cts / len) * rowMeans(len)\n` +
    `  vc <- sweep(vc, 2, colSums(cts) / colSums(vc), "*")\n` +
    `}\n` +
    `yl <- normLibSizes(DGEList(vc)[keep, , keep.lib.sizes=FALSE])\n` +
    `v <- voomWithQualityWeights(yl, mm)\n` +
    `lt <- topTable(eBayes(lmFit(v, mm)), coef=coef, number=Inf)\n` +
    `lt$gene <- rownames(lt)\n` +
    `write.csv(lt, paste0(base_path, "/results/limma_voom_results.csv"), row.names=FALSE)\n` +
    `cat("Sample quality weights:", paste(sprintf("%s %.2f", colnames(v), v$targets$sample.weights), collapse=", "), "\\n\\n")\n\n` +
    `# ─── Compare ───\n` +
    `cmp <- data.frame(gene=deseq$gene, symbol=if (is.null(deseq$symbol)) deseq$gene else deseq$symbol,\n` +
    `                  deseq2_lfc=deseq$log2FoldChange, deseq2_padj=deseq$padj)\n` +
    `cmp$edger_lfc  <- et$logFC[match(cmp$gene, et$gene)];  cmp$edger_fdr  <- et$FDR[match(cmp$gene, et$gene)]\n` +
    `cmp$limma_lfc  <- lt$logFC[match(cmp$gene, lt$gene)];  cmp$limma_padj <- lt$adj.P.Val[match(cmp$gene, lt$gene)]\n` +
    `sig <- function(p, l) !is.na(p) & p < padj_cut & !is.na(l) & abs(l) > lfc_cut\n` +
    `cmp$DESeq2 <- sig(cmp$deseq2_padj, cmp$deseq2_lfc)\n` +
    `cmp$edgeR  <- sig(cmp$edger_fdr, cmp$edger_lfc)\n` +
    `cmp$limma  <- sig(cmp$limma_padj, cmp$limma_lfc)\n` +
    `cmp$n_methods <- cmp$DESeq2 + cmp$edgeR + cmp$limma\n` +
    `cmp <- cmp[order(-cmp$n_methods, cmp$deseq2_padj), ]\n` +
    `write.csv(cmp, paste0(base_path, "/results/method_comparison.csv"), row.names=FALSE)\n\n` +
    `# Venn diagram: seven regions of three circles, counted directly\n` +
    `A <- cmp$DESeq2; B <- cmp$edgeR; C <- cmp$limma\n` +
    `n <- sapply(list(A & !B & !C, !A & B & !C, !A & !B & C, A & B & !C, A & !B & C, !A & B & C, A & B & C), sum)\n` +
    `circ <- function(x, y, g) data.frame(x = x + 1.2 * cos(seq(0, 2 * pi, length.out = 200)),\n` +
    `                                    y = y + 1.2 * sin(seq(0, 2 * pi, length.out = 200)), g = g)\n` +
    `circles <- rbind(circ(-0.65, 0.4, "DESeq2"), circ(0.65, 0.4, "edgeR"), circ(0, -0.7, "limma-voom"))\n` +
    `lab <- data.frame(x = c(-1.2, 1.2, 0, 0, -0.65, 0.65, 0), y = c(0.75, 0.75, -1.35, 0.75, -0.3, -0.3, 0.05), n = n)\n` +
    `p <- ggplot(circles, aes(x, y)) +\n` +
    `  geom_polygon(aes(fill = g, group = g), alpha = 0.25, colour = "grey30") +\n` +
    `  geom_text(data = lab, aes(label = format(n, big.mark = ",")), size = 5) +\n` +
    `  annotate("text", x = c(-1.6, 1.6, 0), y = c(1.85, 1.85, -2.15), size = 5, fontface = "bold",\n` +
    `           label = c(paste0("DESeq2 (", sum(A), ")"), paste0("edgeR (", sum(B), ")"), paste0("limma-voom (", sum(C), ")"))) +\n` +
    `  scale_fill_manual(values = c("#0969da", "#c94e00", "#1a7f37"), guide = "none") +\n` +
    `  coord_equal() + theme_void() +\n` +
    `  labs(title = paste0("Significant genes (padj < ", padj_cut, ", |log2FC| > ", lfc_cut, ")"))\n` +
    `ggsave(paste0(base_path, "/results/method_venn.png"), p, width = 7, height = 7, dpi = 300)\n\n` +
    `cat("Significant — DESeq2:", sum(A), " edgeR:", sum(B), " limma-voom:", sum(C), "\\n")\n` +
    `cat("Called by all three:", n[7], "  by exactly one:", sum(n[1:3]), "\\n")\n` +
    `cat("Of DESeq2's genes, also called by edgeR:", round(100 * mean(B[A]), 1), "%, by limma-voom:",\n` +
    `    round(100 * mean(C[A]), 1), "%\\n")\n`;
}
