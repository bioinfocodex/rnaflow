# Small RNA benchmark: synthetic pools with known fold changes

```bash
bash benchmark/smallrna/run_smallrna_benchmark.sh
```

About 1.2 GB of data and ten minutes. The scores land in
`benchmark/results/smallrna_giraldez/`.

## The data

Giraldez et al. (2018, *Nature Biotechnology* 36: 746) made two pools,
SynthA and SynthB, of the same synthetic small RNAs at designed relative
concentrations, and had them sequenced by nine labs (GEO GSE94585). Because
every RNA is in both pools, the bias of small RNA library preparation affects
both pools alike, and the fold change between them is known exactly.

The benchmark uses the TruSeq libraries from lab 1, four replicates per pool
(SRA SRR5234383–86 and SRR5234463–66). The pools hold 285 human miRNAs: 33
at 1:1, the rest changing from 1.5-fold to 10-fold in either direction. The
designed ratio is written into each RNA's name in the authors' count files
(e.g. `hsa-let-7b-5p|1x|3x`), which is where `truth.tsv` comes from.

## What is scored

RNAflow runs as a user would set it up: small RNA route, adapter detected
from the reads, pool A as controls and pool B as treatment. Its DESeq2
results are scored against the designed fold changes, and the same DESeq2
analysis on the authors' own counts is scored the same way for comparison.

| Check | Threshold |
|---|---|
| Human miRNAs in the pools that RNAflow quantified | ≥ 90% |
| log2 fold change vs designed, Pearson | ≥ 0.90 |
| Designed changes of 2-fold or more called (padj < 0.05, right direction) | ≥ 80% |
| Unchanged (1:1) miRNAs called significant | ≤ 10% |
| Significant calls with the designed direction | ≥ 95% |
| Recall and correlation compared with DESeq2 on the authors' counts | within 0.05 |

The thresholds were set before the first run.

## Result (RNAflow 3.2, first run)

| | RNAflow | DESeq2 on the authors' counts |
|---|---|---|
| miRNAs quantified | 258 of 285 | 285 |
| log2 fold change vs designed, Pearson | 0.991 | 0.978 |
| Designed ≥ 2-fold changes called | 99% | 97% |
| Unchanged miRNAs called significant | 3% (1 of 33) | 15% |
| Calls in the designed direction | 100% | 99% |

All six checks pass. RNAflow detected the TruSeq adapter from the reads, and
68–83% of trimmed reads matched human mature miRNAs (the rest come from the
pools' non-human synthetic RNAs). Its counts agree with the authors' at
Spearman 0.986 and 0.994 for the two pools.

The 27 miRNAs not quantified all have names that miRBase has changed since
the study (for example `hsa-miR-1` is now `hsa-miR-1-3p`); RNAflow counts
them under their current names, which the truth table does not use. None is
missing for lack of reads.

## Not covered

This tests trimming, counting and differential expression on synthetic RNA
of known composition. It does not test biological samples, where other small
RNAs (tRNA fragments, snoRNAs) compete for reads, or kits other than TruSeq.
