# RNAflow benchmark: airway (GSE52778)

Checks that the commands RNAflow generates produce the right answer on a
well-studied public dataset, and fails loudly when they do not.

```bash
bash benchmark/run_benchmark.sh            # Salmon route, 8 threads, 4M read pairs
bash benchmark/run_benchmark.sh align 8    # HISAT2 + featureCounts route
```

Exit status is 0 only when every check passes. Work goes to
`~/RNA-Seq_airway_bench`; the score lands in `benchmark/results/<method>/`.

The small RNA route has its own benchmark, on synthetic pools with known fold
changes: [`smallrna/README.md`](smallrna/README.md).

## What it tests

The commands are not re-typed here. `extract_commands.mjs` loads the real
`RNAflow_App.html` in a simulated browser, fills in the airway project the way a
user would (picking "Human" from the organism list, adding the eight samples),
and saves whatever the app shows on each step. A bug in the app's command
builder therefore shows up as a failed benchmark.

`run_rnaflow.sh` runs those steps the way `rnaflow_server.py` does: one fresh
shell per step with the conda environment activated, R blocks through
`Rscript`.

The conda environment is built from the pinned file the app itself writes on
its Install page, plus the `airway` reference data. When the pins in
`RNAflow_App.html` change, the next run rebuilds the environment, so the
benchmark always tests what a user would install.

## The data

Four airway smooth-muscle cell lines, each untreated and treated with
dexamethasone (Himes et al., 2014, PLoS One). Paired-end, 63 bp, unstranded.
`fetch_airway.sh` takes the first 4M read pairs of each sample from NCBI's SRA
bucket on AWS.

| Untreated | Dexamethasone | Cell line |
|---|---|---|
| SRR1039508 | SRR1039509 | N61311 |
| SRR1039512 | SRR1039513 | N052611 |
| SRR1039516 | SRR1039517 | N080611 |
| SRR1039520 | SRR1039521 | N061011 |

## How it is scored

`compare.R` answers three separate questions, so a failure points at its cause.

1. **Quantification.** RNAflow's gene counts against the published full-depth
   airway counts (Bioconductor `airway` package).
2. **Analysis code.** RNAflow's generated DESeq2 script against a reference
   script written from the DESeq2 vignette, on the same Salmon output. These
   should agree to rounding error; any gap is a bug in the generated R.
3. **Biology.** RNAflow's differential expression against DESeq2 on the
   published counts. The published counts are also thinned to RNAflow's read
   depth, so recall is judged against what is achievable with 4M pairs rather
   than against the full study.

| Check | Threshold |
|---|---|
| Salmon mapping rate, every sample | ≥ 70% |
| Gene-count Spearman vs published counts, every sample | ≥ 0.85 |
| log2 CPM Pearson vs published counts, every sample | ≥ 0.90 |
| Generated R vs reference R, max \|Δ log2FC\| | < 1e-6 |
| Recall of reference DE genes, relative to the depth-matched ceiling | ≥ 0.80 |
| RNAflow DE genes also significant in the reference | ≥ 0.90 |
| log2FC Pearson on reference DE genes | ≥ 0.90 |
| Known dex-induced genes up and significant (DUSP1, KLF15, PER1, TSC22D3, FKBP5, ZBTB16, CRISPLD2) | 7 / 7 |
| Result gene IDs unversioned, so they map to org.Hs.eg.db | < 1% versioned |

The thresholds are a starting point. Tighten them once a baseline exists.

## Not covered yet

- nf-core/rnaseq as a second reference. Its STAR index needs ~32 GB of RAM.
- Strandedness. Airway is unstranded, so a wrong strand setting cannot show up
  here; a stranded dataset should be added.
- The download step. The benchmark supplies FASTQ files directly
  ("My own FASTQ files"), so `fasterq-dump` is not exercised.
- QC output (FastQC, MultiQC) is run and reported, but not scored.
