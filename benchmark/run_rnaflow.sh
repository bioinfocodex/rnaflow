#!/usr/bin/env bash
# Runs RNAflow's extracted steps the way rnaflow_server.py does: each one in a
# fresh shell with the conda environment activated, output logged per step.
#
# A failing step is recorded and the run continues where it can. QC steps
# (FastQC, MultiQC) do not feed later steps, so their failure is reported but
# does not stop quantification; any other failure stops the run.
#
#   bash benchmark/run_rnaflow.sh COMMANDS_DIR [STEP ...]
set -uo pipefail

cmds=${1:?usage: run_rnaflow.sh COMMANDS_DIR [STEP ...]}; shift
env_name=${RNAFLOW_ENV:-rnaflow-bench}
logs="$cmds/logs"; mkdir -p "$logs"
status="$cmds/status.tsv"
[[ -f "$status" ]] || printf 'step\texit\tseconds\n' > "$status"

conda_sh="$(conda info --base)/etc/profile.d/conda.sh"
shell=/bin/bash; [[ "$(uname)" == Darwin && -x /bin/zsh ]] && shell=/bin/zsh

steps=("$@")
(( ${#steps[@]} )) || steps=($(cd "$cmds" && ls 0*.sh 0*.R))

for f in "${steps[@]}"; do
  name=${f%.*}
  echo "── $name"
  start=$(date +%s)
  if [[ $f == *.R ]]; then
    # The server materialises R blocks to a file and runs them with Rscript
    "$shell" -c ". '$conda_sh'; conda activate $env_name; Rscript '$cmds/$f'" > "$logs/$name.log" 2>&1
  else
    "$shell" -c ". '$conda_sh'; conda activate $env_name; $(cat "$cmds/$f")" > "$logs/$name.log" 2>&1
  fi
  code=$?
  secs=$(( $(date +%s) - start ))
  printf '%s\t%s\t%s\n' "$name" "$code" "$secs" >> "$status"
  if (( code == 0 )); then
    echo "   ok (${secs}s)"
  else
    echo "   FAILED exit $code (${secs}s) — last lines of $logs/$name.log:"
    tail -5 "$logs/$name.log" | sed 's/^/     /'
    case $name in 01_fastqc|06_check|07b_postqc) ;; *) exit "$code" ;; esac
  fi
done
