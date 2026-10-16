---
title: 'RNAflow: a guided desktop application for reproducible bulk RNA-seq analysis'
tags:
  - RNA-seq
  - transcriptomics
  - differential expression
  - reproducibility
  - graphical user interface
  - DESeq2
authors:
  - name: Matrika Bhattarai
    orcid: 0000-0003-2627-6251
    corresponding: true
    affiliation: 1
affiliations:
  - name: Independent researcher, BioInfoCodex
    index: 1
date: 15 October 2026
bibliography: paper.bib
---

# Summary

RNAflow is a desktop application that guides a researcher through a complete
bulk RNA-seq analysis, from raw FASTQ files to differential expression and
pathway enrichment, on their own computer. It also analyses small RNA
(miRNA) libraries, and can start from an existing count table. Each step of the analysis is a page
that explains its purpose, generates the exact commands for the user's
project, and runs them with one click. The commands remain visible, so an
analysis can be read, checked and repeated, or moved to a computing cluster
or to nf-core/rnaseq when it outgrows a laptop. RNAflow installs every tool and
R package at a fixed version, records the software behind each set of
results, and ships with a benchmark that compares its output with a published
dataset. It runs on macOS and Linux, and on Windows through the Windows Subsystem for
Linux (WSL2), and is
released under the MIT licence.

# Statement of need

Many biologists now generate RNA-seq data but have no training in the command
line, workflow managers or R. Their options are limited. Web platforms such as
Galaxy [@Galaxy2024] provide a graphical interface but, unless an institution
hosts its own server, require uploading sequencing data, which can be large or
subject to data-protection rules. Community pipelines such as nf-core/rnaseq
[@Ewels2020; @Patel_nfcore_rnaseq] are thorough and reproducible but are
driven from the command line. Interactive tools such as iDEP [@Ge2018] and
DEBrowser [@Kucukural2019] begin from a count table, so the earlier steps must
be done elsewhere. Commercial packages provide complete graphical workflows
under paid licences.

RNAflow is aimed at the researcher between these options: someone who wants
to analyse their own data locally, without a licence fee, and to understand
each step rather than treat the analysis as a black box. Because every command
is shown before it runs, RNAflow also serves as a teaching tool. A user can
follow the same analysis in a terminal, adapt it, or hand it to a
bioinformatician for review.

# State of the field

\autoref{tab:field} summarises how RNAflow relates to widely used tools. The
distinction is not completeness, where nf-core/rnaseq is the reference, but
the combination of a guided graphical interface, local execution and coverage
of the whole analysis from FASTQ files.

: Comparison with established tools for bulk RNA-seq analysis. \label{tab:field}

| Tool | Interface | Where it runs | Starts from | Cost |
|---|---|---|---|---|
| nf-core/rnaseq | Command line | Local, HPC, cloud | FASTQ | Free |
| Galaxy | Web | Public or self-hosted server | FASTQ | Free |
| iDEP | Web | Public server | Count table | Free |
| DEBrowser | R/Shiny | Local | Count table | Free |
| Commercial suites | Desktop or web | Local or server | FASTQ | Paid |
| RNAflow | Guided desktop app | Local, with HPC script export | FASTQ or count table | Free |

RNAflow does not replace nf-core/rnaseq. It can export a project as an
nf-core/rnaseq samplesheet and launch command, so a user who has learned the
analysis in RNAflow can move to the community pipeline for large or repeated
studies.

# Software design

RNAflow is a single HTML file, built from modular sources, together with a
small Python server that has no dependencies outside the standard library. The
server listens only on the local machine, requires a per-session access token,
checks the Host header and restricts cross-origin requests, so other web pages
open in the browser cannot run commands. The desktop application, built with Electron, starts the
server and loads the page. On a machine without conda it offers to install
Miniforge privately, verifying a checksum built into the application, and then
builds the analysis environment.

All commands and R scripts are generated from one project configuration:
organism, read type, samples and their grouping, and an optional pairing or
batch label for each sample. Data can come from local files or from a Gene Expression Omnibus (GEO) or
Sequence Read Archive (SRA) accession. Two routes are supported. The first quantifies reads against
the transcriptome with Salmon [@Patro2017] and summarises them to genes with
tximport [@Soneson2015]. The second aligns reads to the genome with HISAT2
[@Kim2019] and counts them with featureCounts [@Liao2013]. On the genome
route, library strandedness is measured from the data rather than assumed.
Reads are checked with FastQC [@Andrews2010] and trimmed with fastp
[@Chen2018]. After quantification, a summary step reports the mapped, rRNA and
mitochondrial fractions with a pass or warn verdict for each sample. It adds
Qualimap [@Okonechnikov2015] coverage reports on the genome route and gathers
everything in MultiQC [@Ewels2016].

Differential expression uses DESeq2 [@Love2014] with apeglm fold-change
shrinkage [@Zhu2018], with a paired design when pairs are given. The same
samples and design can be re-analysed with edgeR [@Chen2025] and with
limma-voom using sample quality weights [@Ritchie2015; @Liu2015], and the
three gene lists are compared. Enrichment analysis uses clusterProfiler
[@Yu2012], and fgsea [@Korotkevich2016] tests the MSigDB Hallmark gene sets
[@Liberzon2015] with enrichment ranking plots. An in-app explorer shows an
interactive volcano plot, each gene's counts per sample, which methods call
it, and the enrichment tables.

A count table from elsewhere, such as a sequencing core or a published study,
can be used instead of FASTQ files. Samples are read by column name, and
tables of transcripts per million (TPM) or other normalised values are refused rather than analysed as
counts. For small RNA libraries, the kit's 3′ adapter is identified from the
reads, reads of 16–35 nucleotides are aligned with Bowtie [@Langmead2009] to
the species' mature miRNAs from a fixed, checksum-verified miRBase release
[@Kozomara2018], and the resulting counts enter the same analysis.

Reproducibility rests on a single pinned environment (R 4.5.3, Bioconductor
3.22, Salmon 2.8.0 and every other tool at a fixed version) from conda-forge
and Bioconda [@Gruning2018]. It is resolved together for Apple-silicon and
Intel macOS and for Linux. Each run writes the installed package list and the
R session information next to its results.

# Validation

The repository includes an end-to-end benchmark on the airway study
[@Himes2014]: airway smooth-muscle cells from four donors, each untreated and
treated with dexamethasone. The benchmark loads the real application in a
simulated browser, configures the project as a user would, and runs the
generated commands unchanged on the first four million read pairs of each
sample. It scores three things separately: quantification, against the
published full-depth counts in the airway package [@airway]; the generated
analysis script, against an independently written DESeq2 script run on the
same quantifications; and the biological result, against DESeq2 on the
published counts. Recall is measured against those counts thinned to the same
sequencing depth, so the use of a read subset is not counted against RNAflow.
\autoref{tab:bench} shows the Salmon route.

: Airway benchmark, Salmon route, four million read pairs per sample. The reference set is genes with adjusted p < 0.05 and |log2 fold change| > 1 in DESeq2 on the published counts at full depth, using the same design as the RNAflow run. Count correlations use genes with a mean of at least 10 reads in the published counts. \label{tab:bench}

| Measure | Unpaired design | Paired design |
|---|---|---|
| Reads mapped, lowest sample | 95.5% | 95.5% |
| Gene counts vs published counts, Spearman, lowest sample | 0.923 | 0.923 |
| Generated vs reference DESeq2 script, max \|Δ log2 fold change\| | 1.1 × 10⁻¹⁴ | 4.1 × 10⁻¹⁴ |
| Genes called by RNAflow (adjusted p < 0.05) | 1,142 | 1,296 |
| RNAflow calls also significant in the reference | 94% | 96% |
| log2 fold-change correlation on reference genes, Pearson | 0.96 | 0.96 |
| Known glucocorticoid-induced genes recovered | 7 of 7 | 7 of 7 |
| Recall relative to the depth-matched ceiling | 0.82 | 0.79 |

The two scripts agree to numerical precision, and RNAflow's calls are almost
all supported by the reference. On the paired design, edgeR and limma-voom
confirm 91% and 87% of DESeq2's genes respectively, and all seven known genes
are called by all three methods. Starting from the published count table
instead of FASTQ files reproduces DESeq2 on that table exactly. 

The small RNA route was benchmarked on synthetic pools with designed
concentration ratios [@Giraldez2018]: two pools of the same small RNAs,
sequenced in quadruplicate (TruSeq libraries from one laboratory), so that the
true fold change of each of 285 human miRNAs is known, from 1:1 to 10-fold in
either direction. RNAflow detected the adapter from the reads, and its fold
changes correlated with the designed ones at r = 0.991. It called 99% of the
changes of 2-fold or more in the right direction, and 1 of the 33 unchanged
miRNAs (3%). The same DESeq2 analysis on the authors' own counts gave r = 0.978,
97% and 15%. All six checks, with thresholds fixed before the first run,
passed. Twenty-seven miRNAs were not scored because miRBase has renamed them
since the study. Recall reaches 79–82% of what the read depth
allows. The paired design falls just short of the benchmark's 0.80 target.
RNAflow uses a newer genome and annotation (GRCh38, Ensembl release 116) than
the published counts (GRCh37, Ensembl release 75), which is a likely
contributor. The benchmark has already found a defect that would otherwise
have reached users: in version 3.0.0 the Salmon route could not complete,
because the transcript-to-gene table kept identifier versions that tximport
removes from the quantification files.

# Research impact statement

RNAflow has been publicly available since its first release in March 2026.
Researchers have requested it through the project website, which distributes
the installers, now with registration optional, so uptake can be followed
through release download counts. No publication yet reports results obtained
with RNAflow; at present the evidence that its output is sound is the
benchmark described above, which anyone can rerun from the repository.

# Quality control and testing

Automated tests run on Linux and macOS for every change. Seventeen tests load
the built application and check the commands it generates, two of them
running its strandedness and adapter detection on synthetic reads, and twelve
test the server's checks on what it will run and which files it will serve.
Most guard a defect found during development or a feature added since. Run
against version 3.0.0, sixteen of the seventeen application tests fail; the
one that passes checks only that the page loads.

# Limitations

RNAflow has not yet been evaluated in a user study. Differential expression of
mRNA has been benchmarked on one dataset, which is unstranded and human, and
the small RNA route on synthetic RNA of known composition, not on biological
samples. Its tools come from Bioconda, so
Windows users need WSL2. It does not cover single-cell RNA-seq.

# AI usage disclosure

Claude (Anthropic) was used to help write and review code, build the
benchmark and draft this paper. The author reviewed every change, ran the
benchmark and the tests, chose the design and scope, and is responsible for
the content of the software and the paper.

# Acknowledgements

I thank the authors of the airway dataset and the developers of the
open-source tools on which RNAflow builds. This work received no specific
funding.

# References
