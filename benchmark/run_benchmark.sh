#!/usr/bin/env bash
# End-to-end RNAflow benchmark on the airway study (GSE52778).
#
#   bash benchmark/run_benchmark.sh [salmon|align] [THREADS] [PAIRS]
#
# 1. extracts RNAflow's own commands, and its pinned environment, from
#    RNAflow_App.html
# 2. builds that environment (plus the airway reference data) if needed
# 3. fetches a read subset of the eight airway samples
# 4. runs RNAflow's steps exactly as the app would
# 5. scores the results against independent references (compare.R)
#
# Exit status is 0 only if every check passes. Work goes to ~/RNA-Seq_airway_bench.
set -euo pipefail

method=${1:-salmon}
threads=${2:-8}
pairs=${3:-4000000}
here="$(cd "$(dirname "$0")" && pwd)"
project="$HOME/RNA-Seq_airway_bench"
cmds="$project/commands_${method}_local"
env_name=rnaflow-bench

[[ -d "$here/node_modules/jsdom" ]] || (cd "$here" && npm install --no-audit --no-fund)
node "$here/extract_commands.mjs" --method "$method" --threads "$threads"

# The benchmark runs in the environment RNAflow tells users to install, with
# only the reference dataset added — so it tests what users actually get.
# The environment is rebuilt whenever the app's pinned file changes.
set +u; . "$(conda info --base)/etc/profile.d/conda.sh"; set -u
stamp="$(conda info --base)/envs/$env_name/.rnaflow-env.yml"
if ! cmp -s "$cmds/environment.yml" "$stamp" 2>/dev/null; then
  conda env remove -n "$env_name" -y >/dev/null 2>&1 || true
  mamba env create -n "$env_name" -f "$cmds/environment.yml"
  mamba install -n "$env_name" -c conda-forge -c bioconda -y \
    bioconductor-airway=1.30.0 r-jsonlite "bioconductor-org.hs.eg.db=3.22.0"
  cp "$cmds/environment.yml" "$stamp"
fi
# conda's compiler activation scripts read unset variables
set +u; conda activate "$env_name"; set -u

bash "$here/fetch_airway.sh" "$project/raw_data" "$pairs"

rm -f "$cmds/status.tsv"
RNAFLOW_ENV="$env_name" bash "$here/run_rnaflow.sh" "$cmds"

Rscript "$here/compare.R" "$project" "$here/results/$method" "$cmds"
