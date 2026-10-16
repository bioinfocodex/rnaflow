#!/usr/bin/env bash
# Small RNA benchmark: RNAflow's miRNA route on synthetic pools with known
# fold changes (Giraldez et al. 2018, GSE94585, TruSeq libraries from lab 1).
#
#   bash benchmark/smallrna/run_smallrna_benchmark.sh [THREADS]
#
# Uses the rnaflow-bench environment built by ../run_benchmark.sh.
# Work goes to ~/RNA-Seq_giraldez_bench (about 1.2 GB). Exit 0 only if every
# check passes.
set -euo pipefail

threads=${1:-8}
here="$(cd "$(dirname "$0")" && pwd)"
bench="$(cd "$here/.." && pwd)"
project="$HOME/RNA-Seq_giraldez_bench"

set +u; . "$(conda info --base)/etc/profile.d/conda.sh"; conda activate rnaflow-bench; set -u
[[ -d "$bench/node_modules/jsdom" ]] || (cd "$bench" && npm install --no-audit --no-fund)

bash "$here/fetch_giraldez.sh" "$project"

# Pool A as controls, pool B as treatment, replicates in order;
# the adapter is left to RNAflow's detection
node "$bench/extract_commands.mjs" --method smallrna --datasource local \
  --loc '~' --tag giraldez_bench --readtype single --pairs none --threads "$threads" \
  --ctrl SRR5234383,SRR5234384,SRR5234385,SRR5234386 \
  --treat SRR5234463,SRR5234464,SRR5234465,SRR5234466 \
  --out "$project/commands"

rm -f "$project/commands/status.tsv"
RNAFLOW_ENV=rnaflow-bench bash "$bench/run_rnaflow.sh" "$project/commands" \
  00_mkdir.sh 02_trim.sh 03_genome.sh 04_index.sh 05_quant.sh 07_counts.sh 07b_postqc.sh 08_deseq2.R

Rscript "$here/compare_smallrna.R" "$project" "$project" "$bench/results/smallrna_giraldez"
