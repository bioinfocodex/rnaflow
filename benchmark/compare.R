# Scores an RNAflow run on the airway subset against independent references.
#
#   Rscript benchmark/compare.R PROJECT_DIR OUT_DIR [COMMANDS_DIR]
#
# COMMANDS_DIR is the extracted step folder; its project.json says which ID
# type the app's GSEA page uses. Defaults to the newest commands_* folder.
#
# Three questions, kept separate so a failure points at its cause:
#
#   1. Quantification — do RNAflow's gene counts agree with the published
#      airway counts (TopHat2 + summarizeOverlaps, full depth)?
#   2. Analysis code — does RNAflow's generated DESeq2 script give the same
#      answer as a reference script written from the DESeq2 vignette, run on
#      the same quantifications? This isolates bugs in the generated R.
#   3. Biology — does RNAflow recover the reference differential expression,
#      judged against what is achievable at the depth it was given? The
#      reference counts are binomially thinned to RNAflow's library sizes, so
#      lost power from subsampling is not mistaken for an RNAflow error.

suppressPackageStartupMessages({
  library(DESeq2); library(tximport); library(airway); library(jsonlite)
})

args    <- commandArgs(trailingOnly = TRUE)
project <- normalizePath(args[1])
out_dir <- if (length(args) > 1) args[2] else file.path(project, "benchmark_report")
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)
set.seed(20261014)

strip_ver <- function(x) sub("\\.[0-9]+$", "", x)
checks <- list()
check <- function(id, label, value, pass, threshold) {
  checks[[id]] <<- list(label = label, value = value, threshold = threshold, pass = isTRUE(pass))
}

# ── Sample sheet: must match extract_commands.mjs ─────────────────────────
samples <- data.frame(
  run  = c("SRR1039508","SRR1039512","SRR1039516","SRR1039520",
           "SRR1039509","SRR1039513","SRR1039517","SRR1039521"),
  name = c(paste0("UNT_", 1:4), paste0("DEX_", 1:4)),
  dex  = factor(rep(c("untreated","dex"), each = 4), levels = c("untreated","dex")),
  cell = factor(rep(c("N61311","N052611","N080611","N061011"), 2))
)

# ── RNAflow outputs ───────────────────────────────────────────────────────
rf_res <- read.csv(file.path(project, "results", "deseq2_results.csv"))
rf_dds <- readRDS(file.path(project, "results", "dds.rds"))
rf_res$id <- strip_ver(rf_res$gene)
versioned <- mean(grepl("\\.[0-9]+$", rf_res$gene))
check("gene_ids_unversioned",
      "Result gene IDs carry no version suffix (needed for org.Hs.eg.db / GSEA mapping)",
      round(versioned, 3), versioned < 0.01, "< 1% versioned")

# Salmon mapping rates
meta <- file.path(project, "counts", "quants", samples$run, "aux_info", "meta_info.json")
map_rate <- setNames(sapply(meta, function(f) fromJSON(f)$percent_mapped), samples$run)
check("mapping_rate", "Salmon mapping rate, lowest sample (%)",
      round(min(map_rate), 1), min(map_rate) >= 70, ">= 70")

# ── 1. Quantification vs published airway counts ──────────────────────────
data(airway)
ref_counts <- assay(airway)[, samples$run]
rf_counts  <- counts(rf_dds, normalized = FALSE)
rownames(rf_counts) <- strip_ver(rownames(rf_counts))
colnames(rf_counts) <- samples$run[match(colnames(rf_counts), samples$name)]
shared <- intersect(rownames(ref_counts), rownames(rf_counts))
expressed <- shared[rowMeans(ref_counts[shared, ]) >= 10]
cpm <- function(m) log2(t(t(m) / colSums(m)) * 1e6 + 1)
rho <- sapply(samples$run, function(s)
  cor(rf_counts[expressed, s], ref_counts[expressed, s], method = "spearman"))
r_cpm <- sapply(samples$run, function(s)
  cor(cpm(rf_counts[expressed, ])[, s], cpm(ref_counts[expressed, ])[, s]))
check("count_spearman", "Gene-count Spearman vs published airway, lowest sample",
      round(min(rho), 3), min(rho) >= 0.85, ">= 0.85")
check("count_logcpm_pearson", "log2 CPM Pearson vs published airway, lowest sample",
      round(min(r_cpm), 3), min(r_cpm) >= 0.90, ">= 0.90")

# ── 2. Generated R code vs a reference script on the same quantifications ─
files <- setNames(file.path(project, "counts", "quants", samples$run, "quant.sf"), samples$name)
tx2gene <- read.csv(file.path(project, "reference", "tx2gene.csv"),
                    header = FALSE, col.names = c("TXNAME", "GENEID"))
txi <- tximport(files, type = "salmon", tx2gene = tx2gene, ignoreTxVersion = TRUE)
# Match RNAflow's design: paired by cell line when the project gave a pairing
paired <- "pair" %in% colnames(colData(rf_dds))
cd  <- data.frame(dex = samples$dex, pair = samples$cell, row.names = samples$name)
own <- DESeqDataSetFromTximport(txi, cd, if (paired) ~ pair + dex else ~ dex)
own <- own[rowSums(counts(own)) >= 10, ]
own <- DESeq(own, quiet = TRUE)
own_res <- as.data.frame(results(own, contrast = c("dex", "dex", "untreated"), alpha = 0.05))
common <- intersect(rownames(own_res), rf_res$gene)
d_lfc <- max(abs(own_res[common, "log2FoldChange"] -
                 rf_res$log2FoldChange[match(common, rf_res$gene)]), na.rm = TRUE)
check("code_equivalence", "Max |log2FC| difference, RNAflow script vs reference script",
      signif(d_lfc, 3), d_lfc < 1e-6 && length(common) == nrow(own_res), "< 1e-6, same genes")

# ── 3. Biology vs reference DE, judged at RNAflow's depth ─────────────────
de <- function(counts, design_df, design) {
  d <- DESeqDataSetFromMatrix(counts, design_df, design)
  d <- d[rowSums(counts(d)) >= 10, ]
  d <- DESeq(d, quiet = TRUE)
  r <- as.data.frame(results(d, contrast = c("dex", "dex", "untreated"), alpha = 0.05))
  r[!is.na(r$padj), ]
}
cd_ref <- data.frame(dex = samples$dex, cell = samples$cell, row.names = samples$run)
ref_design <- if (paired) ~ cell + dex else ~ dex   # same design RNAflow uses
ref_full <- de(ref_counts, cd_ref, ref_design)
truth <- rownames(ref_full)[ref_full$padj < 0.05 & abs(ref_full$log2FoldChange) > 1]

# Thin the reference to RNAflow's per-sample depth: the best any pipeline
# could do with this many reads
depth <- colSums(rf_counts[shared, ])
p <- pmin(1, depth / colSums(ref_counts[shared, ]))
thin <- ref_counts[shared, ]
for (j in seq_len(ncol(thin))) thin[, j] <- rbinom(nrow(thin), thin[, j], p[j])
ref_thin <- de(thin, cd_ref, ref_design)

recall <- function(r) {
  sig <- rownames(r)[r$padj < 0.05]
  mean(truth %in% sig)
}
rf_by_id <- rf_res[!is.na(rf_res$padj), ]; rownames(rf_by_id) <- rf_by_id$id
rec_rf   <- recall(rf_by_id)
rec_thin <- recall(ref_thin)
check("de_recall", "Recall of reference DE genes (padj<0.05, |LFC|>1), relative to depth-matched ceiling",
      round(rec_rf / rec_thin, 3), rec_rf / rec_thin >= 0.80,
      sprintf(">= 0.80 (RNAflow %.2f, ceiling %.2f)", rec_rf, rec_thin))

sig_rf <- rownames(rf_by_id)[rf_by_id$padj < 0.05 & abs(rf_by_id$log2FoldChange) > 1]
sig_rf <- intersect(sig_rf, rownames(ref_full))
prec <- mean(ref_full[sig_rf, "padj"] < 0.05)
check("de_precision", "RNAflow DE genes also significant in the reference",
      round(prec, 3), prec >= 0.90, ">= 0.90")

both <- intersect(truth, rownames(rf_by_id))
r_lfc <- cor(rf_by_id[both, "log2FoldChange"], ref_full[both, "log2FoldChange"])
check("lfc_agreement", "log2FC Pearson on reference DE genes",
      round(r_lfc, 3), r_lfc >= 0.90, ">= 0.90")

# Well-established glucocorticoid-induced genes (Himes et al. 2014 and the
# DESeq2 / airway vignettes): all should be significantly up with dex.
known <- c(DUSP1 = "ENSG00000120129", KLF15 = "ENSG00000163884",
           PER1 = "ENSG00000179094", TSC22D3 = "ENSG00000157514",
           FKBP5 = "ENSG00000096060", ZBTB16 = "ENSG00000109906",
           CRISPLD2 = "ENSG00000103196")
kn <- rf_by_id[known[known %in% rownames(rf_by_id)], c("log2FoldChange", "padj")]
ok_known <- sum(kn$log2FoldChange > 0 & kn$padj < 0.05)
check("known_targets", "Known dex-induced genes recovered as up and significant",
      sprintf("%d / %d", ok_known, length(known)), ok_known == length(known), "7 / 7")

# GSEA: do the result IDs map in the annotation database with the key type
# the app's GSEA page uses? A mismatch gives empty enrichment, not an error.
proj_files <- if (length(args) > 2) file.path(args[3], "project.json") else
  Sys.glob(file.path(project, "commands_*", "project.json"))
gsea <- if (length(proj_files)) fromJSON(proj_files[which.max(file.mtime(proj_files))])$gsea else NULL
if (!is.null(gsea$keytype) && requireNamespace("org.Hs.eg.db", quietly = TRUE)) {
  keys_ok <- tryCatch(
    AnnotationDbi::keys(org.Hs.eg.db::org.Hs.eg.db, keytype = gsea$keytype),
    error = function(e) character(0))
  frac <- mean(rf_res$gene %in% keys_ok)
  check("gsea_id_mapping",
        sprintf("Result gene IDs found in org.Hs.eg.db as keyType \"%s\" (the GSEA page's setting)", gsea$keytype),
        round(frac, 3), frac >= 0.6, ">= 0.60")
}

# Shrunken fold changes, from v3.2
if (!is.null(rf_res$log2FoldChange_shrunk)) {
  big_raw <- sum(abs(rf_res$log2FoldChange) > 5 & rf_res$baseMean < 10, na.rm = TRUE)
  big_shr <- sum(abs(rf_res$log2FoldChange_shrunk) > 5 & rf_res$baseMean < 10, na.rm = TRUE)
  check("lfc_shrinkage", "Low-count genes (baseMean < 10) with |log2FC| > 5, unshrunk -> shrunk",
        sprintf("%d -> %d", big_raw, big_shr), big_shr < max(1, big_raw), "fewer after shrinkage")
}

# Three-method comparison, from v3.2: edgeR and limma-voom should confirm
# most of DESeq2's genes and all of the known targets
mc_file <- file.path(project, "results", "method_comparison.csv")
if (file.exists(mc_file)) {
  mc <- read.csv(mc_file)
  agree <- min(mean(mc$edgeR[mc$DESeq2]), mean(mc$limma[mc$DESeq2]))
  check("method_agreement", "DESeq2 genes also called by edgeR and by limma-voom, lower of the two",
        round(agree, 3), agree >= 0.80, ">= 0.80")
  kn3 <- sum(mc$n_methods[sub("\\.[0-9]+$", "", mc$gene) %in% known] == 3)
  check("known_targets_all_methods", "Known dex-induced genes called by all three methods",
        sprintf("%d / %d", kn3, length(known)), kn3 == length(known), "7 / 7")
}

# fgsea Hallmark, from v3.2: all 50 sets tested, and the steroid-response
# programmes glucocorticoids are known to drive come out activated
fg_file <- file.path(project, "results", "fgsea_Hallmark.csv")
if (file.exists(fg_file)) {
  fg <- read.csv(fg_file)
  up <- fg$NES[match(c("HALLMARK_ADIPOGENESIS", "HALLMARK_ANDROGEN_RESPONSE"), fg$pathway)]
  sig_up <- sum(up > 0 & fg$padj[match(c("HALLMARK_ADIPOGENESIS", "HALLMARK_ANDROGEN_RESPONSE"), fg$pathway)] < 0.05, na.rm = TRUE)
  check("fgsea_hallmark", "Hallmark sets tested; adipogenesis and androgen response activated (padj < 0.05)",
        sprintf("%d sets, %d / 2", nrow(fg), sig_up), nrow(fg) == 50 && sig_up == 2, "50 sets, 2 / 2")
}

# Context only, not a pass/fail: what the paired design would have found
ref_paired <- de(ref_counts, cd_ref, ~ cell + dex)
n_paired <- sum(ref_paired$padj < 0.05)

# ── Report ────────────────────────────────────────────────────────────────
tab <- do.call(rbind, lapply(names(checks), function(k) {
  x <- checks[[k]]
  data.frame(check = k, result = if (x$pass) "PASS" else "FAIL",
             value = as.character(x$value), threshold = x$threshold, what = x$label)
}))
context <- list(
  reads_per_sample = as.list(setNames(as.numeric(depth), samples$run)),
  mapping_rate = as.list(map_rate),
  rnaflow_sig_padj05 = sum(rf_by_id$padj < 0.05),
  rnaflow_design = if (paired) "~ pair + condition" else "~ condition",
  reference_sig_padj05_same_design = sum(ref_full$padj < 0.05),
  reference_sig_padj05_paired_design = n_paired,
  reference_truth_set = length(truth),
  known_targets = kn
)
write.csv(tab, file.path(out_dir, "checks.csv"), row.names = FALSE)
write_json(list(checks = checks, context = context), file.path(out_dir, "metrics.json"),
           auto_unbox = TRUE, pretty = TRUE, digits = NA)

cat("\nRNAflow airway benchmark\n")
print(tab[, c("check", "result", "value", "threshold")], row.names = FALSE)
cat(sprintf("\nRNAflow design: %s\n", if (paired) "~ pair + condition (paired by cell line)" else "~ condition"))
cat(sprintf("DE genes at padj < 0.05 — reference, same design at full depth: %d   reference, paired: %d   RNAflow at %.1fM counted reads/sample: %d\n",
            sum(ref_full$padj < 0.05), n_paired, mean(depth) / 1e6, sum(rf_by_id$padj < 0.05)))
cat(sprintf("%d of %d checks passed\n", sum(tab$result == "PASS"), nrow(tab)))
quit(status = if (all(tab$result == "PASS")) 0 else 1)
