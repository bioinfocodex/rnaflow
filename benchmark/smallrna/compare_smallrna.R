# Scores RNAflow's small RNA route against designed fold changes.
#
#   Rscript benchmark/smallrna/compare_smallrna.R PROJECT_DIR DATA_DIR OUT_DIR
#
# PROJECT_DIR is the RNAflow project (pool A as controls, pool B as
# treatment); DATA_DIR holds truth.tsv and authors_counts.tsv from
# fetch_giraldez.sh. Every RNA's true fold change is known by design, so this
# measures accuracy directly: fold-change agreement, recall of real changes,
# false positives among RNAs that do not change, and direction.
#
# The same DESeq2 analysis on the authors' own counts is the comparison: the
# question is whether RNAflow's trimming and counting lose anything.
#
# Thresholds were fixed before the first run.

suppressPackageStartupMessages({ library(DESeq2); library(jsonlite) })
args <- commandArgs(trailingOnly = TRUE)
project <- normalizePath(args[1]); data <- normalizePath(args[2])
out_dir <- if (length(args) > 2) args[3] else file.path(project, "benchmark_report")
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

truth <- read.delim(file.path(data, "truth.tsv"))
rownames(truth) <- truth$mirna
checks <- list()
check <- function(id, label, value, pass, threshold)
  checks[[id]] <<- list(label = label, value = value, threshold = threshold, pass = isTRUE(pass))

score <- function(res) {
  res <- res[!is.na(res$padj) & rownames(res) %in% truth$mirna, ]
  t <- truth[rownames(res), "log2FC"]
  sig <- res$padj < 0.05
  big <- abs(t) >= 1                       # designed change of 2-fold or more
  list(
    detected  = nrow(res),
    pearson   = cor(res$log2FoldChange, t),
    recall    = mean(sig[big] & sign(res$log2FoldChange[big]) == sign(t[big])),
    fpr       = mean(sig[t == 0]),
    n_null    = sum(t == 0),
    direction = mean(sign(res$log2FoldChange[sig & t != 0]) == sign(t[sig & t != 0]))
  )
}
deseq <- function(counts) {
  cd <- data.frame(pool = factor(rep(c("A", "B"), each = 4)), row.names = colnames(counts))
  d <- DESeqDataSetFromMatrix(counts, cd, ~pool)
  d <- DESeq(d[rowSums(counts(d)) >= 10, ], quiet = TRUE)
  as.data.frame(results(d, name = "pool_B_vs_A", alpha = 0.05))
}

# RNAflow's own DESeq2 results (controls = pool A, treatment = pool B)
rf <- read.csv(file.path(project, "results", "deseq2_results.csv"))
rownames(rf) <- rf$gene
s_rf <- score(rf)

# Reference: the same DESeq2 analysis on the authors' counts
au <- read.delim(file.path(data, "authors_counts.tsv"), row.names = 1)
s_au <- score(deseq(as.matrix(au)))

check("detected", "Human miRNAs in the pools that RNAflow quantified and tested",
      sprintf("%d / %d", s_rf$detected, nrow(truth)), s_rf$detected >= 0.9 * nrow(truth), ">= 90%")
check("lfc_vs_truth", "log2 fold change vs designed log2 fold change, Pearson",
      round(s_rf$pearson, 3), s_rf$pearson >= 0.90, ">= 0.90")
check("recall", "Designed changes of 2-fold or more called (padj < 0.05, right direction)",
      round(s_rf$recall, 3), s_rf$recall >= 0.80, ">= 0.80")
check("false_positives", sprintf("Unchanged miRNAs (designed 1:1, n = %d) called significant", s_rf$n_null),
      round(s_rf$fpr, 3), s_rf$fpr <= 0.10, "<= 0.10")
check("direction", "Significant calls with the designed direction",
      round(s_rf$direction, 3), s_rf$direction >= 0.95, ">= 0.95")
check("vs_authors", "Recall and correlation within 0.05 of DESeq2 on the authors' counts",
      sprintf("recall %.3f vs %.3f; r %.3f vs %.3f", s_rf$recall, s_au$recall, s_rf$pearson, s_au$pearson),
      s_rf$recall >= s_au$recall - 0.05 && s_rf$pearson >= s_au$pearson - 0.05, "within 0.05")

# Context: RNAflow's counts against the authors', per pool (replicate order
# is not used, so a run listed out of order cannot distort this)
rc <- read.delim(file.path(project, "counts", "mirna_counts.tsv"), row.names = 1, check.names = FALSE)
cpm <- function(m) t(t(m) / colSums(m)) * 1e6
shared <- intersect(rownames(rc), rownames(au))
pool_rho <- c(
  A = cor(rowMeans(cpm(rc[shared, 1:4])), rowMeans(cpm(au[shared, 1:4])), method = "spearman"),
  B = cor(rowMeans(cpm(rc[shared, 5:8])), rowMeans(cpm(au[shared, 5:8])), method = "spearman"))

tab <- do.call(rbind, lapply(names(checks), function(k) {
  x <- checks[[k]]
  data.frame(check = k, result = if (x$pass) "PASS" else "FAIL",
             value = as.character(x$value), threshold = x$threshold, what = x$label)
}))
write.csv(tab, file.path(out_dir, "checks.csv"), row.names = FALSE)
write_json(list(checks = checks, rnaflow = s_rf, authors_counts = s_au,
                count_spearman_vs_authors = as.list(round(pool_rho, 3))),
           file.path(out_dir, "metrics.json"), auto_unbox = TRUE, pretty = TRUE, digits = NA)

cat("\nRNAflow small RNA benchmark — Giraldez et al. 2018 ratiometric pools, TruSeq lab 1\n")
print(tab[, c("check", "result", "value", "threshold")], row.names = FALSE)
cat(sprintf("\nCounts vs the authors' (Spearman, pool means): A %.3f, B %.3f\n", pool_rho["A"], pool_rho["B"]))
cat(sprintf("%d of %d checks passed\n", sum(tab$result == "PASS"), nrow(tab)))
quit(status = if (all(tab$result == "PASS")) 0 else 1)
