// ── ANNOTATION PACKAGES FOR GSEA (v3) ─────────────────────────────────────
// The GSEA page used to hardcode yeast, so anyone on another organism got
// silently wrong OrgDb / KEGG / Reactome settings.
//
// key is the ID type in RNAflow's own results, which come from an Ensembl
// GTF or cDNA: ENSG…/ENSMUSG… for vertebrates, FBgn… for fly, WBGene… for
// worm, systematic ORF names (YPL071C) for yeast, AGI codes (AT1G01010) for
// Arabidopsis. It was SYMBOL (GENENAME for yeast), which matched none of
// them, so enrichment silently ran on an empty gene list.
const ORG_ANNOT = {
  human:       {db:'org.Hs.eg.db',   key:'ENSEMBL', kegg:'hsa',  react:'human'},
  mouse:       {db:'org.Mm.eg.db',   key:'ENSEMBL', kegg:'mmu',  react:'mouse'},
  rat:         {db:'org.Rn.eg.db',   key:'ENSEMBL', kegg:'rno',  react:'rat'},
  zebrafish:   {db:'org.Dr.eg.db',   key:'ENSEMBL', kegg:'dre',  react:'zebrafish'},
  fly:         {db:'org.Dm.eg.db',   key:'FLYBASE', kegg:'dme',  react:'fly'},
  worm:        {db:'org.Ce.eg.db',   key:'ENSEMBL', kegg:'cel',  react:'celegans'},
  yeast:       {db:'org.Sc.sgd.db',  key:'ORF',     kegg:'sce',  react:'yeast'},
  arabidopsis: {db:'org.At.tair.db', key:'TAIR',    kegg:'ath',  react:''},
  // Species with no Bioconductor OrgDb — clusterProfiler needs a custom
  // TERM2GENE table instead, so say so rather than emit a package name
  // that will simply fail to install.
  yarrowia:    {db:'', key:'', kegg:'yli',  react:''},
  maize:       {db:'', key:'', kegg:'zma',  react:''},
  rice:        {db:'', key:'', kegg:'osa',  react:''},
  wheat:       {db:'', key:'', kegg:'taes', react:''},
  soybean:     {db:'', key:'', kegg:'gmx',  react:''},
  tomato:      {db:'', key:'', kegg:'sly',  react:''},
  custom:      {db:'', key:'', kegg:'',     react:''}
};

// ── PINNED SOFTWARE ENVIRONMENT ───────────────────────────────────────────
// Every tool and R package at a fixed version, so the same FASTQ files give
// the same numbers on every machine and every month. Before this, installs
// were unpinned: a fresh install in October 2026 pulled FastQC 0.13, which
// dropped the -o flag RNAflow used, and Intel/Linux solves quietly chose a
// ten-year-old sva. R and Bioconductor now live in the same environment as
// the command-line tools instead of a separate RStudio install.
//
// The whole set was solved on osx-arm64, osx-64 and linux-64 (WSL2) together.
// Change versions here only after re-solving all three.
const RNAFLOW_ENV = {
  name: 'rnaseq',
  release: '2026.10',
  tools: [
    ['fastqc', '0.13.0', 'FastQC'],
    ['fastp', '1.4.0', 'fastp'],
    ['hisat2', '2.2.3', 'HISAT2'],
    ['samtools', '1.24', 'samtools'],
    ['subread', '2.1.1', 'featureCounts (subread)'],
    ['salmon', '2.8.0', 'Salmon'],
    ['sra-tools', '3.4.1', 'fasterq-dump (sra-tools)'],
    ['multiqc', '1.35', 'MultiQC'],
    ['qualimap', '2.3', 'Qualimap'],
    ['bowtie', '1.3.1', 'Bowtie (small RNA)'],
    ['openjdk', '25.0.2', 'Java (for Qualimap)'],
    ['r-base', '4.5.3', 'R'],
    // Not used by RNAflow directly, but MultiQC runs on it and the solver
    // otherwise picks a different Python per platform
    ['python', '3.14.8', 'Python']
  ],
  rpkgs: [
    ['bioconductor-deseq2', '1.50.2', 'DESeq2'],
    ['bioconductor-tximport', '1.38.2', 'tximport'],
    ['bioconductor-apeglm', '1.32.0', 'apeglm'],
    ['bioconductor-limma', '3.66.0', 'limma'],
    ['bioconductor-edger', '4.8.2', 'edgeR'],
    ['bioconductor-sva', '3.58.0', 'sva'],
    ['bioconductor-clusterprofiler', '4.18.4', 'clusterProfiler'],
    ['bioconductor-enrichplot', '1.30.5', 'enrichplot'],
    ['bioconductor-reactomepa', '1.54.0', 'ReactomePA'],
    ['bioconductor-fgsea', '1.36.2', 'fgsea'],
    // MSigDB gene sets for fgsea; downloads them once on first use
    ['r-msigdbr', '26.1.1', 'msigdbr'],
    ['r-ggplot2', '4.0.3', 'ggplot2'],
    ['r-pheatmap', '1.0.13', 'pheatmap'],
    ['r-ggrepel', '0.9.8', 'ggrepel'],
    ['r-dplyr', '1.2.1', 'dplyr'],
    ['r-patchwork', '1.3.2', 'patchwork'],
    ['r-rcolorbrewer', '1.1_3', 'RColorBrewer'],
    // Reading count tables supplied as CSV / TSV / Excel
    ['r-readr', '2.2.0', 'readr'],
    ['r-readxl', '1.5.0.1', 'readxl']
  ],
  // OrgDb packages download 100–400 MB each after install, so only the one
  // for the project's organism is added (see orgDbInstallCmd).
  orgdb: '3.22.0'
};

function envYaml() {
  const dep = ([pkg, ver]) => `  - ${pkg}=${ver}`;
  return [
    `# RNAflow pinned environment, release ${RNAFLOW_ENV.release}`,
    `name: ${RNAFLOW_ENV.name}`,
    'channels:',
    '  - conda-forge',
    '  - bioconda',
    'dependencies:',
    ...RNAFLOW_ENV.tools.map(dep),
    ...RNAFLOW_ENV.rpkgs.map(dep)
  ].join('\n');
}

// Writes the file and creates the environment, or brings an existing one
// exactly in line (--prune removes anything an older install added).
function envInstallCmd() {
  const n = RNAFLOW_ENV.name;
  return [
    `# Write RNAflow's pinned environment file — every version is fixed`,
    `mkdir -p ~/.rnaflow`,
    `cat > ~/.rnaflow/environment.yml <<'EOF'`,
    envYaml(),
    `EOF`,
    ``,
    `# Create the environment, or update an existing one to match exactly`,
    `if conda env list | grep -q "^${n} "; then`,
    `  conda env update -n ${n} -f ~/.rnaflow/environment.yml --prune`,
    `else`,
    `  conda env create -n ${n} -f ~/.rnaflow/environment.yml`,
    `fi`,
    `conda activate ${n}`,
    ``,
    `# Verify — each line should print the version pinned above`,
    `fastqc --version && fastp --version && salmon --version && samtools --version | head -1`,
    `Rscript -e 'cat("R", as.character(getRversion()), "· DESeq2", as.character(packageVersion("DESeq2")), "\\n")'`
  ].join('\n');
}

function orgDbInstallCmd(db) {
  if (!db) return '# No Bioconductor OrgDb exists for this organism — see the note below.';
  return `# One-time: the annotation database for your organism (downloads 100–400 MB)\n` +
         `conda install -n ${RNAFLOW_ENV.name} -c conda-forge -c bioconda -y \\\n` +
         `  bioconductor-${db.toLowerCase()}=${RNAFLOW_ENV.orgdb}`;
}

// Recorded next to the results, so a figure can always be traced back to
// the exact software that produced it.
function versionsCmd(base) {
  return `# Record the exact software behind these results\n` +
         `conda list --explicit > ${base}/results/conda_environment_lock.txt\n` +
         `{ echo "RNAflow environment release ${RNAFLOW_ENV.release}"; date; \\\n` +
         `  fastqc --version; fastp --version 2>&1; salmon --version; hisat2 --version | head -1; \\\n` +
         `  samtools --version | head -1; featureCounts -v 2>&1 | grep -i featurecounts; \\\n` +
         `  multiqc --version; R --version | head -1; } > ${base}/results/software_versions.txt\n` +
         `cat ${base}/results/software_versions.txt`;
}

// MSigDB Hallmark via msigdbr: human sets, mapped to these species through
// orthologs. Plants and Yarrowia are not covered.
const MSIGDB_SPECIES = {
  human: 'Homo sapiens', mouse: 'Mus musculus', rat: 'Rattus norvegicus',
  zebrafish: 'Danio rerio', fly: 'Drosophila melanogaster',
  worm: 'Caenorhabditis elegans', yeast: 'Saccharomyces cerevisiae'
};

// Preranked GSEA on the 50 Hallmark processes, with an enrichment ranking
// plot (running score, hits, ranked metric) for each top pathway.
function fgseaR(base, orgKey) {
  const species = MSIGDB_SPECIES[orgKey];
  if (!species) return `# MSigDB Hallmark gene sets cover animals and yeast only, not this organism.\n` +
    `# Use the GO and KEGG analyses above instead.`;
  return `library(fgsea); library(msigdbr); library(ggplot2); library(patchwork)\n` +
    `base_path <- "${base}"\n\n` +
    `# Rank every tested gene by the DESeq2 Wald statistic. Hallmark sets use gene\n` +
    `# symbols, so genes are named by the symbol column the DESeq2 step writes.\n` +
    `res <- read.csv(paste0(base_path, "/results/deseq2_results.csv"))\n` +
    `sym <- if (!is.null(res$symbol)) res$symbol else res$gene\n` +
    `ok <- !is.na(res$stat) & !is.na(sym) & sym != "" & !grepl("^ENS", sym)\n` +
    `if (sum(ok) < 1000) stop("Fewer than 1,000 genes have a gene symbol. Re-run the reference and ",\n` +
    `                         "DESeq2 steps with this version so results carry gene names.")\n` +
    `ranks <- tapply(res$stat[ok], sym[ok], function(x) x[which.max(abs(x))])  # one value per symbol\n` +
    `ranks <- sort(setNames(as.numeric(ranks), names(ranks)), decreasing=TRUE)\n` +
    `cat(length(ranks), "genes ranked\\n")\n\n` +
    `# The 50 Hallmark processes (MSigDB). msigdbr downloads them once, on first use.\n` +
    `hs <- msigdbr(db_species="HS", species="${species}", collection="H")\n` +
    `pathways <- split(hs$gene_symbol, hs$gs_name)\n` +
    `set.seed(42)\n` +
    `fg <- fgsea(pathways, ranks, minSize=15, maxSize=500)\n` +
    `fg <- fg[order(fg$padj), ]\n` +
    `cat("Hallmark pathways at padj < 0.05:", sum(fg$padj < 0.05, na.rm=TRUE), "\\n")\n` +
    `print(head(fg[, c("pathway", "NES", "padj", "size")], 10))\n` +
    `out <- as.data.frame(fg)\n` +
    `out$leadingEdge <- vapply(fg$leadingEdge, paste, "", collapse="/")\n` +
    `write.csv(out, paste0(base_path, "/results/fgsea_Hallmark.csv"), row.names=FALSE)\n\n` +
    `# Normalised enrichment scores of the significant pathways\n` +
    `top <- head(out[!is.na(out$padj) & out$padj < 0.05, ], 25)\n` +
    `if (nrow(top)) {\n` +
    `  top$label <- gsub("_", " ", sub("^HALLMARK_", "", top$pathway))\n` +
    `  p <- ggplot(top, aes(NES, reorder(label, NES), fill = NES > 0)) + geom_col() +\n` +
    `    scale_fill_manual(values = c("TRUE" = "#c94e00", "FALSE" = "#0969da"),\n` +
    `                      labels = c("TRUE" = "up", "FALSE" = "down"), name = NULL) +\n` +
    `    labs(x = "Normalised enrichment score", y = NULL, title = "MSigDB Hallmark, padj < 0.05") +\n` +
    `    theme_minimal(base_size = 12)\n` +
    `  ggsave(paste0(base_path, "/results/fgsea_Hallmark_NES.png"), p, width = 9, height = 7, dpi = 300)\n\n` +
    `  # Enrichment ranking plots: running score, gene hits and ranked metric,\n` +
    `  # on one shared rank axis (the standard three-panel GSEA figure)\n` +
    `  rank_plot <- function(pw) {\n` +
    `    d <- plotEnrichmentData(pathways[[pw]], ranks)\n` +
    `    x <- scale_x_continuous(limits = c(0, length(ranks)), expand = c(0, 0))\n` +
    `    bare <- theme(axis.text.x = element_blank(), axis.title.x = element_blank(), panel.grid.minor = element_blank())\n` +
    `    es <- ggplot(d$curve, aes(rank, ES)) + geom_hline(yintercept = 0, colour = "grey60") +\n` +
    `      geom_line(colour = "#1a7f37", linewidth = 0.8) + x +\n` +
    `      labs(title = gsub("_", " ", sub("^HALLMARK_", "", pw)), y = "Enrichment\\nscore") +\n` +
    `      theme_minimal(base_size = 9) + bare\n` +
    `    hits <- ggplot(d$ticks, aes(rank, 0)) + geom_segment(aes(xend = rank, yend = 1), linewidth = 0.2) + x +\n` +
    `      scale_y_continuous(breaks = NULL) + labs(y = "Hits") + theme_minimal(base_size = 9) + bare +\n` +
    `      theme(panel.grid = element_blank())\n` +
    `    metric <- ggplot(d$stats, aes(rank, stat, fill = stat > 0)) + geom_col(width = 1) + x +\n` +
    `      scale_fill_manual(values = c("TRUE" = "#c94e00", "FALSE" = "#0969da"), guide = "none") +\n` +
    `      labs(x = "Rank in ordered gene list", y = "Ranked\\nmetric") + theme_minimal(base_size = 9) +\n` +
    `      theme(panel.grid.minor = element_blank())\n` +
    `    es / hits / metric + plot_layout(heights = c(3, 0.6, 1.4))\n` +
    `  }\n` +
    `  ggsave(paste0(base_path, "/results/fgsea_Hallmark_ranking.png"),\n` +
    `         wrap_plots(lapply(head(top$pathway, 6), rank_plot), ncol = 2), width = 11, height = 12, dpi = 300)\n` +
    `  cat("Saved fgsea_Hallmark.csv, fgsea_Hallmark_NES.png and fgsea_Hallmark_ranking.png\\n")\n` +
    `} else cat("No Hallmark pathway reached padj < 0.05.\\n")\n`;
}
