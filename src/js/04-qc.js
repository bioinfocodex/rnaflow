// ── POST-QUANTIFICATION QC ────────────────────────────────────────────────
// FastQC only looks at reads. These checks look at where the reads went:
// mapping rate, rRNA and mitochondrial share, and (genome route) read origin
// and 5'–3' coverage bias. Everything lands in one MultiQC report with an
// RNAflow summary table carrying a PASS / WARN verdict per sample.
const QC_LIMITS = { mapped: 70, rrna: 10, mito: 30 };

function postQcCmd({ base, all, salmonMode, paired, strand, gtf, T }) {
  const samples = all.length ? all.join(' ') : 'SAMPLE';
  const table = `${base}/qc/rnaflow_qc_mqc.tsv`;
  const L = QC_LIMITS;
  // MultiQC reads this header and shows the file as a table
  const header =
    `{ echo "# id: 'rnaflow_qc'"\n` +
    `  echo "# section_name: 'RNAflow QC summary'"\n` +
    `  echo "# description: 'PASS needs mapped >= ${L.mapped}%, rRNA < ${L.rrna}%, mitochondrial < ${L.mito}% of reads.'"\n` +
    `  echo "# plot_type: 'table'"\n` +
    `  printf 'Sample\\tMapped (%%)\\trRNA (%%)\\tMito (%%)\\tVerdict\\n'\n`;
  const verdict =
    `v = "PASS"; if (map < ${L.mapped}) v = "WARN: low mapping"; ` +
    `else if (rp >= ${L.rrna}) v = "WARN: rRNA"; else if (mp >= ${L.mito}) v = "WARN: mitochondrial"; ` +
    `printf "%s\\t%.1f\\t%.2f\\t%.2f\\t%s\\n", s, map, rp, mp, v`;
  const show =
    `\necho; grep -v '^#' ${table} | column -t -s "$(printf '\\t')"\n` +
    `grep -q WARN ${table} && echo "⚠ Some samples need a look — see the Verdict column." || echo "✓ All samples pass."\n`;

  if (salmonMode) {
    return `# ─── Mapping, rRNA and mitochondrial share per sample ───\n` +
      `# rRNA = reads on rRNA / Mt_rRNA transcripts; mito = reads on the mitochondrial chromosome\n` +
      header +
      `  for s in ${samples}; do\n` +
      `    q=${base}/counts/quants/$s\n` +
      `    map=$(grep -o '"percent_mapped": *[0-9.]*' $q/aux_info/meta_info.json | grep -o '[0-9.]*$')\n` +
      `    awk -v s=$s -v map="$map" -F'\\t' '\n` +
      `      NR == FNR { bt[$1] = $2; chr[$1] = $3; next }\n` +
      `      FNR > 1   { t += $5; if (bt[$1] ~ /rRNA/) r += $5\n` +
      `                  if (chr[$1] ~ /^(MT|Mt|M|chrM|Mito|mitochondrion_genome)$/) m += $5 }\n` +
      `      END { rp = t ? 100 * r / t : 0; mp = t ? 100 * m / t : 0; ${verdict} }' \\\n` +
      `      ${base}/reference/tx_info.tsv $q/quant.sf\n` +
      `  done; } > ${table}\n` +
      show +
      `\n# ─── One report: reads, trimming, Salmon and the summary above ───\n` +
      `multiqc ${base}/qc ${base}/counts/quants -o ${base}/qc --filename rnaflow_final_qc --force\n` +
      openCmd(`${base}/qc/rnaflow_final_qc.html`);
  }

  // Genome route. Qualimap needs the protocol spelled out; with auto
  // detection the counts step already wrote what it measured.
  const proto = { '0': 'non-strand-specific', '1': 'strand-specific-forward', '2': 'strand-specific-reverse' };
  const strandLine = strand === 'auto'
    ? `STRAND=$(grep -o -- '-s [012]' ${base}/counts/strandedness.txt | tail -1 | cut -c4)\n`
    : `STRAND=${strand}\n`;
  return `${strandLine}` +
    `case $STRAND in 1) PROTO=${proto['1']};; 2) PROTO=${proto['2']};; *) PROTO=${proto['0']};; esac\n\n` +
    `# ─── Where reads land, and 5'–3' coverage bias (Qualimap) ───\n` +
    `# Exonic should be well above 60%; high intronic suggests pre-mRNA or DNA contamination.\n` +
    `mkdir -p ${base}/qc/qualimap\n` +
    `for s in ${samples}; do\n` +
    `  qualimap rnaseq -bam ${base}/aligned/$s.bam -gtf ${gtf} \\\n` +
    `    -outdir ${base}/qc/qualimap/$s -p $PROTO ${paired ? '-pe ' : ''}--java-mem-size=4G \\\n` +
    `    > ${base}/qc/qualimap/$s.log 2>&1 || echo "Qualimap failed for $s — see ${base}/qc/qualimap/$s.log"\n` +
    `done\n\n` +
    `# ─── rRNA share: count reads per gene biotype ───\n` +
    `featureCounts -a ${gtf} -g gene_biotype -o ${base}/counts/biotype_counts.txt \\\n` +
    `  -T ${T} -s $STRAND ${paired ? '-p --countReadPairs ' : ''}\\\n` +
    `  ${all.map(s => `${base}/aligned/${s}.bam`).join(' ') || base + '/aligned/SAMPLE.bam'} > /dev/null 2>&1\n\n` +
    `# ─── Mapping, rRNA and mitochondrial share per sample ───\n` +
    header +
    `  col=7\n` +
    `  for s in ${samples}; do\n` +
    `    map=$(grep -o '[0-9.]*% overall alignment rate' ${base}/aligned/\${s}_summary.txt | grep -o '^[0-9.]*')\n` +
    `    mito=$(samtools idxstats ${base}/aligned/$s.bam | awk '$1 ~ /^(MT|Mt|M|chrM|Mito|mitochondrion_genome)$/ {m += $3} {t += $3} END {print t ? 100 * m / t : 0}')\n` +
    `    awk -v s=$s -v map="$map" -v mp="$mito" -v c=$col -F'\\t' '\n` +
    `      NR > 2 { t += $c; if ($1 ~ /rRNA/) r += $c }\n` +
    `      END { rp = t ? 100 * r / t : 0; ${verdict} }' ${base}/counts/biotype_counts.txt\n` +
    `    col=$((col + 1))\n` +
    `  done; } > ${table}\n` +
    show +
    `\n# ─── One report: reads, trimming, alignment, Qualimap and the summary above ───\n` +
    `multiqc ${base}/qc ${base}/aligned ${base}/counts -o ${base}/qc --filename rnaflow_final_qc --force\n` +
    openCmd(`${base}/qc/rnaflow_final_qc.html`);
}

function renderEnvBlocks() {
  const install = envInstallCmd();
  ['cmd-install-env', 'cmd-fix-env', 'cmd-recreate-env'].forEach(id => set(id, install));
  const rows = document.getElementById('env-version-rows');
  if (rows) {
    rows.innerHTML = [...RNAFLOW_ENV.tools, ...RNAFLOW_ENV.rpkgs.slice(0, 2)]
      .map(([, ver, label]) => `<tr><td>${label}</td><td>${ver}</td><td>Run the fix command below</td></tr>`)
      .join('');
  }
}

// Keep the advanced pages (multi-factor, batch, GSEA) in step with the
// project instead of leaving them pinned to the yeast demo values.
function syncAdvancedPages(base, ctrl, treat, nCtrl, nTreat, orgKey) {
  const put = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  put('mf-base', base);   put('bc-base', base);   put('gs-base', base);
  put('mf-ctrl', ctrl);   put('mf-treat', treat);
  put('mf-nctrl', nCtrl); put('mf-ntreat', nTreat);

  const a = ORG_ANNOT[orgKey] || ORG_ANNOT.custom;
  put('gs-orgdb',   a.db    || 'NULL');
  put('gs-orgdb-lib',  a.db || 'clusterProfiler');
  put('gs-orgdb-name', a.db || 'no OrgDb');
  put('gs-keytype', a.key   || 'SYMBOL');
  put('gs-kegg',    a.kegg  || 'PASTE_KEGG_CODE');
  put('gs-react',   a.react || 'NOT_SUPPORTED');
  // clusterProfiler, enrichplot, ReactomePA and fgsea ship with the pinned
  // environment; only the organism's annotation database is added here.
  put('gs-install', orgDbInstallCmd(a.db));
  put('cmd-fgsea', fgseaR(base, orgKey));

  const warn = document.getElementById('gs-orgdb-warning');
  if (warn) {
    warn.style.display = a.db ? 'none' : '';
    warn.innerHTML = a.db ? '' :
      '<span class="alert-icon">⚠️</span><div>Bioconductor has no <code>OrgDb</code> package for this organism, ' +
      'so <code>enrichGO()</code> will not work. Build a <code>TERM2GENE</code> table (from a GAF file or BioMart) ' +
      'and pass it to <code>enricher()</code> instead. KEGG enrichment still works with the code above.</div>';
  }
}

