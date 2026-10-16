# RNAflow

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23424916.svg)](https://doi.org/10.5281/zenodo.23424916)

A guided desktop app for bulk RNA-seq analysis, from raw FASTQ files to
differential expression and pathway enrichment, running entirely on your own
computer.

RNAflow is written for biologists who have sequencing data but not a
bioinformatics background. Every step is a page that explains what it does,
generates the exact commands for your project, and runs them with one click.
The commands stay visible, so the analysis can be read, checked, reproduced
and moved to an HPC cluster or to nf-core/rnaseq when it outgrows a laptop.

- **Whole workflow:** quality control (FastQC, fastp, MultiQC, Qualimap),
  trimming, quantification with Salmon or alignment with HISAT2 +
  featureCounts, DESeq2 with apeglm fold-change shrinkage, multi-factor and
  paired designs, batch correction, GO / KEGG / Reactome enrichment, GSEA
  and fgsea on the MSigDB Hallmark gene sets.
- **Three DE methods:** check DESeq2's results with edgeR and limma-voom on
  the same design, with a comparison table and Venn diagram.
- **Small RNA / miRNA:** adapter detected from the reads, counting on a
  pinned miRBase release with Bowtie, then the same DE analysis.
- **Start from a count table** (CSV, TSV or Excel) from a sequencing core or
  a paper, and go straight to differential expression.
- **Your data stays on your machine.** Analyses run locally and your reads
  are never uploaded; only public lookups, such as a GEO accession, go to
  NCBI or Ensembl.
- **Reproducible.** Every tool and R package is installed at a fixed version,
  and each run records the exact software behind its results.
- **Public data in one step.** Paste a GEO or SRA accession (e.g. `GSE52778`)
  to import every sample in a study.
- **Explore results** in the app: an interactive volcano plot, gene lookup
  with per-sample counts, a sortable gene table and an enrichment browser.
- **Leave when you outgrow it.** Export the project to nf-core/rnaseq or to a
  single shell script, or generate SLURM / PBS / LSF job scripts.

## Install

**Desktop app (macOS, Linux):** download the installer from the
[latest release](https://github.com/bioinfocodex/rnaflow/releases/latest).
On first launch RNAflow offers to install everything it needs (conda and the
analysis tools, about 400 MB) into `~/.rnaflow`, without an administrator
password and without changing your shell settings.

**Windows:** RNAflow's tools come from Bioconda, which needs Linux, so they
run inside [WSL2](https://learn.microsoft.com/windows/wsl/install). The app
shows the steps.

**Without the desktop app:** RNAflow is one HTML file plus a small Python
server with no dependencies.

```bash
python3 rnaflow_server.py
```

Open the URL it prints. The Install page creates the pinned conda
environment.

## How well it works

`benchmark/` runs the commands RNAflow generates on the airway study
(GSE52778: airway smooth-muscle cells from four donors, with and without
dexamethasone; Himes et al., 2014) and scores them against the published
counts and an independent DESeq2 analysis. With 4 million read pairs per
sample, Salmon route:

| Check | Result |
|---|---|
| Reads mapped (lowest sample) | 95.5% |
| Gene counts vs published counts, Spearman (lowest sample) | 0.92 |
| RNAflow's DESeq2 script vs a reference script on the same input | identical (max \|Δ log2FC\| 4 × 10⁻¹⁴) |
| RNAflow's DE genes also significant in the reference | 96% |
| log2 fold-change agreement with the reference (Pearson) | 0.96 |
| Known glucocorticoid-induced genes recovered (DUSP1, FKBP5, KLF15, PER1, TSC22D3, ZBTB16, CRISPLD2) | 7 / 7 |
| Recall of reference DE genes, relative to the best achievable at this depth | 0.79 paired · 0.82 unpaired |

Recall is judged against the published counts thinned to the same depth, so
it is not penalised for using a 4M-read subset. The paired run falls just
short of the benchmark's 0.80 target; RNAflow also uses a newer genome
annotation (GRCh38, Ensembl 116) than the published counts (GRCh37,
Ensembl 75). See [`benchmark/README.md`](benchmark/README.md) to run it.

The small RNA route is benchmarked on synthetic pools in which every miRNA's
fold change is known by design (Giraldez et al., 2018): RNAflow's fold changes
correlate with the designed ones at r = 0.991, it finds 99% of the 2-fold or
larger changes, and calls 1 of 33 unchanged miRNAs. See
[`benchmark/smallrna/README.md`](benchmark/smallrna/README.md).

## Documentation

The [manual](https://rnaflow.bioinfocodex.com/manual.html) walks through a
full analysis. Inside the app, each page explains its step and what good
output looks like.

## Contributing

Bug reports and pull requests are welcome; see
[CONTRIBUTING.md](CONTRIBUTING.md). The app is built from `src/`
([`src/README.md`](src/README.md)), and tests run on every push.

## Citing RNAflow

Cite the archived software through its Zenodo DOI,
[10.5281/zenodo.23424916](https://doi.org/10.5281/zenodo.23424916), which
always resolves to the latest version. Each release also has its own DOI on
Zenodo. GitHub's "Cite this repository" button gives the same reference.

## Licence

[MIT](LICENSE).
