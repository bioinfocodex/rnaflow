# Changelog

## v3.0.0 — 2026-08-24

The headline change is that the local server is no longer open to any web page
you happen to have open. Everything else follows from a review of where the app
produced wrong or lost results.

### Security

- **The local server required no authentication.** It accepted `POST /run` from
  any origin and returned `Access-Control-Allow-Origin: *`, so any website open
  in your browser could execute shell commands on your machine. Every command
  endpoint now requires a per-session access token.
- The `Host` header is validated, which blocks DNS-rebinding attacks.
- CORS is restricted to the local app instead of `*`.

The server prints a URL on startup; open it and the app pairs automatically. If
you open `RNAflow_App.html` from disk, paste the token once.

### Fixed — these produced wrong or missing results

- **R blocks were piped into a shell** and could never run. They now execute
  through `Rscript`.
- **Gene family analysis matched patterns against gene IDs**, so it returned
  nothing for most organisms — a count matrix is indexed by `ENSG…`/`AT1G…`,
  not by `MYB12`. IDs are now mapped to symbols using the project's GTF, and
  the patterns are anchored so `MYB` no longer matches any gene containing
  those letters.
- **DESeq2 selected count columns by position.** A failed sample shifted every
  column and silently mislabelled conditions. Columns are now matched by name.
- **Reference URLs pointed at a retired Ensembl release.** Refreshed to
  Ensembl 116 / Ensembl Genomes 63 and each one verified. Six organisms had
  been renamed in the meantime (rat → GRCr8, fly → BDGP6.54, tomato → SL4.0,
  yarrowia moved to Ensembl Fungi).
- **The "local FASTQ folder" setting did nothing.** Projects using your own
  sequencing data now work end to end.
- The CPU setting never reached the tools; HPC job scripts wrote to a `logs/`
  directory that was never created; the progress counter read "15 / 13".

### Added

- **Import samples from a GEO or SRA accession.** Paste `GSE52778` and every
  run in the study is fetched, with read type and organism detected.
- **Salmon route.** Quantifies against the transcriptome, so no genome index is
  built — the step that stops most people working on human data on a laptop.
- **Results viewer.** Plots, MultiQC reports and count tables open inside the
  app instead of being hunted for in a file manager.
- **Export to nf-core/rnaseq**, or to a single `run_all.sh` script.
- **Projects persist** across reloads and can be exported as a file. A running
  job survives a page refresh and reattaches with its output intact.

### Changed

- Alignment streams into `samtools sort` rather than writing a SAM file and
  deleting it, saving roughly 100 GB of scratch I/O per human sample.
- The multi-factor, batch-correction and GSEA pages now follow your project
  instead of staying pinned to the yeast demo values.

## v2.0.0 — 2026-07-13

Desktop application for macOS, Windows and Linux.

## v1.0.0 — 2026-03-21

First release.
