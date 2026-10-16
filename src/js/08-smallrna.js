// ── SMALL RNA / miRNA ROUTE (v3.2) ───────────────────────────────────────
// miRNA libraries are reads of ~18–30 nt: the adapter is trimmed off, reads
// are counted on the species' mature miRNAs from miRBase with Bowtie 1
// (built for short reads), and the resulting miRNA x sample table goes to
// DESeq2 through the same loader as an imported count table.

// miRBase species prefixes for the organisms RNAflow knows
const MIRBASE_SPECIES = {
  human: 'hsa', mouse: 'mmu', rat: 'rno', zebrafish: 'dre', fly: 'dme', worm: 'cel',
  arabidopsis: 'ath', rice: 'osa', maize: 'zma', soybean: 'gma', tomato: 'sly', wheat: 'tae'
};

// One fixed miRBase release, checked by checksum. mirbase.org's own download
// always serves the latest release (and is often unreachable from scripts),
// so the same reads gave different counts depending on which server answered.
// This is nf-core's copy of release 22.1 at a fixed commit.
const MIRBASE = {
  release: '22.1',
  url: 'https://raw.githubusercontent.com/nf-core/test-datasets/9520f3d8b79c4fa536f229886cb185fe1c806e85/miRBase/mature.fa',
  sha256: '3c521fc9bea3c7993e71cf188b11caf73e2d40ac83454e32876455317cc6d342'
};

// 3' adapters of the common small RNA kits. With the wrong one nothing is
// trimmed, every read stays longer than 35 nt and is discarded, so the
// default is to measure which adapter the reads actually contain.
const SMALL_RNA_ADAPTERS = {
  TGGAATTCTCGGGTGCCAAGG: 'Illumina TruSeq Small RNA',
  AGATCGGAAGAGCACACGTCT: 'NEBNext Small RNA',
  AACTGTAGGCACCATCAAT: 'QIAseq miRNA'
};

function smallRnaSteps({ base, all, T, orgKey, adapter, r1, qp }) {
  const sp = MIRBASE_SPECIES[orgKey];
  const samples = all.length ? all : ['SAMPLE'];
  const ref = `${base}/reference/mirna_mature_${sp || 'xxx'}.fa`;
  const idx = `${base}/genome/mirna_${sp || 'xxx'}`;
  const steps = {};

  // Count each kit's adapter (first 12 nt) in 100,000 reads of the first sample
  const detect = adapter !== 'auto' ? '' :
    `# ─── Which kit? Count each known adapter in the first 100,000 reads ───\n` +
    `ADAPTER=$(for a in ${Object.keys(SMALL_RNA_ADAPTERS).join(' ')}; do\n` +
    `  printf '%s %s\\n' "$(gzip -cdf ${qp(r1(samples[0]))} | head -400000 | awk 'NR % 4 == 2' | grep -c "\${a:0:12}")" "$a"\n` +
    `done | sort -k1,1nr | head -1 | cut -d' ' -f2)\n` +
    `echo "Adapter found in the reads: $ADAPTER"\n\n`;
  const adapterArg = adapter === 'auto' ? '$ADAPTER' : adapter;
  steps['cmd-trim'] = detect + samples.map(s =>
    `fastp -i ${qp(r1(s))} -o ${base}/trimmed/${s}_trimmed.fastq.gz \\\n` +
    `      --adapter_sequence ${adapterArg} --length_required 16 --length_limit 35 \\\n` +
    `      --qualified_quality_phred 20 -w ${Math.min(parseInt(T) || 4, 16)} \\\n` +
    `      --html ${base}/qc/${s}_fastp.html -j ${base}/qc/${s}_fastp.json`).join('\n\n') +
    `\n\n# Unlike the mRNA route, nothing is clipped from the 5′ end: a mature miRNA\n` +
    `# is only ~22 nt, so every base is needed to identify it.`;

  if (!sp) {
    const none = `# miRBase has no miRNAs for this organism. Choose another organism on Configure.`;
    ['cmd-genome', 'cmd-index', 'cmd-align', 'cmd-bam', 'cmd-counts', 'cmd-preview', 'cmd-postqc']
      .forEach(id => { steps[id] = none; });
    return steps;
  }

  steps['cmd-genome'] =
    `# ─── Mature miRNA sequences, miRBase release ${MIRBASE.release} ───\n` +
    `cd ${base}/reference\n` +
    `sha() { (sha256sum "$1" 2>/dev/null || shasum -a 256 "$1") | cut -d' ' -f1; }\n` +
    `[ -s mature.fa ] && [ "$(sha mature.fa)" = "${MIRBASE.sha256}" ] && echo "Already have miRBase ${MIRBASE.release}" \\\n` +
    `  || curl -fL -o mature.fa "${MIRBASE.url}"\n` +
    `[ "$(sha mature.fa)" = "${MIRBASE.sha256}" ] \\\n` +
    `  || { echo "mature.fa does not match miRBase ${MIRBASE.release} (checksum) — delete it and re-run." >&2; exit 1; }\n` +
    `echo "miRBase ${MIRBASE.release}" > mirbase_release.txt\n` +
    `grep -c "^>" mature.fa    # all species\n\n` +
    `# Keep this species (${sp}-), and write DNA letters (U -> T) for Bowtie\n` +
    `awk -v sp="${sp}-" '/^>/ { keep = index($1, ">" sp) == 1; if (keep) print $1; next }\n` +
    `                   keep  { gsub(/U/, "T"); gsub(/u/, "t"); print }' mature.fa > ${ref}\n` +
    `grep -c "^>" ${ref}    # ${sp} mature miRNAs`;

  steps['cmd-index'] = `bowtie-build --threads ${T} ${ref} ${idx}\nls -lh ${base}/genome/`;

  steps['cmd-align'] =
    `# Bowtie 1 for ~22 nt reads: at most one mismatch, sense strand only (--norc),\n` +
    `# best hit kept. Its summary goes to <sample>_bowtie.log.\n\n` +
    samples.map(s =>
      `[ -n "$(gzip -cd ${base}/trimmed/${s}_trimmed.fastq.gz | head -4)" ] \\\n` +
      `  || { echo "No reads of ${s} survived trimming — check the adapter on Configure." >&2; exit 1; }\n` +
      `bowtie -p ${T} -q -n 1 -l 15 --norc --best -k 1 -S -x ${idx} \\\n` +
      `       ${base}/trimmed/${s}_trimmed.fastq.gz 2> ${base}/aligned/${s}_bowtie.log \\\n` +
      `  | samtools sort -@ ${T} -o ${base}/aligned/${s}.bam -\n` +
      `samtools index ${base}/aligned/${s}.bam`).join('\n\n') +
    `\n\n` + versionsCmd(base);

  steps['cmd-bam'] =
    `# Share of trimmed reads that matched a mature miRNA. 30–80% is typical;\n` +
    `# much lower usually means the wrong adapter or degraded RNA.\n` +
    `grep -H "at least one" ${base}/aligned/*_bowtie.log`;

  steps['cmd-counts'] =
    `# ─── miRNA x sample count table ───\n` +
    `for s in ${samples.join(' ')}; do\n` +
    `  samtools idxstats ${base}/aligned/$s.bam | awk -v s=$s '$1 != "*" { print s "\\t" $1 "\\t" $3 }'\n` +
    `done > ${base}/counts/mirna_long.tsv\n` +
    `awk -F'\\t' '{ c[$2, $1] = $3; rows[$2] = 1; if (!($1 in seen)) { seen[$1] = 1; cols[++n] = $1 } }\n` +
    `  END { printf "mirna"; for (i = 1; i <= n; i++) printf "\\t%s", cols[i]; print ""\n` +
    `        for (r in rows) { printf "%s", r; for (i = 1; i <= n; i++) printf "\\t%d", c[r, cols[i]]; print "" } }' \\\n` +
    `  ${base}/counts/mirna_long.tsv > ${base}/counts/mirna_counts.tsv\n` +
    `echo "$(($(wc -l < ${base}/counts/mirna_counts.tsv) - 1)) miRNAs counted"`;

  steps['cmd-preview'] =
    `# The most abundant miRNAs in the first sample\n` +
    `sort -t "$(printf '\\t')" -k2,2nr ${base}/counts/mirna_counts.tsv | head -15 | column -t`;

  const table = `${base}/qc/rnaflow_qc_mqc.tsv`;
  steps['cmd-postqc'] =
    `# ─── Reads kept after trimming and share matching a mature miRNA ───\n` +
    `{ echo "# id: 'rnaflow_qc'"\n` +
    `  echo "# section_name: 'RNAflow small RNA QC'"\n` +
    `  echo "# description: 'PASS needs at least 20% of trimmed reads on mature miRNAs.'"\n` +
    `  echo "# plot_type: 'table'"\n` +
    `  printf 'Sample\\tReads after trimming\\tOn miRNAs (%%)\\tVerdict\\n'\n` +
    `  for s in ${samples.join(' ')}; do\n` +
    `    log=${base}/aligned/\${s}_bowtie.log\n` +
    `    n=$(grep -o 'reads processed: [0-9]*' $log | grep -o '[0-9]*$')\n` +
    `    pct=$(grep 'at least one' $log | grep -o '([0-9.]*%)' | tr -d '(%)')\n` +
    `    awk -v s=$s -v n="$n" -v p="$pct" 'BEGIN { v = (p + 0 >= 20) ? "PASS" : "WARN: few reads on miRNAs"\n` +
    `      printf "%s\\t%d\\t%.1f\\t%s\\n", s, n, p, v }'\n` +
    `  done; } > ${table}\n` +
    `echo; grep -v '^#' ${table} | column -t -s "$(printf '\\t')"\n` +
    `grep -q WARN ${table} && echo "⚠ Some samples need a look — see the Verdict column." || echo "✓ All samples pass."\n\n` +
    `multiqc ${base}/qc ${base}/aligned -o ${base}/qc --filename rnaflow_final_qc --force\n` +
    openCmd(`${base}/qc/rnaflow_final_qc.html`);

  return steps;
}
