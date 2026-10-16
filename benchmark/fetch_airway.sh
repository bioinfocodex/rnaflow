#!/usr/bin/env bash
# Fetches the first N read pairs of the eight airway samples.
#
# The full study is ~45 GB of FASTQ; the benchmark checks that RNAflow's
# commands produce the right biology, which a 4M-pair subset is enough for.
# Runs come from NCBI's public SRA bucket on AWS, which serves ~100x faster
# than ENA's FTP mirror here; each .sra is deleted once its subset is written.
#
#   bash benchmark/fetch_airway.sh DEST_DIR [PAIRS]
#
# Needs fastq-dump (sra-tools) on PATH — the rnaflow-bench env has it.
set -euo pipefail

dest=${1:?usage: fetch_airway.sh DEST_DIR [PAIRS]}
pairs=${2:-4000000}
mkdir -p "$dest/.sra"

runs=(SRR1039508 SRR1039509 SRR1039512 SRR1039513
      SRR1039516 SRR1039517 SRR1039520 SRR1039521)

fetch() {
  local run=$1
  if [[ -s "$dest/${run}_1.fastq.gz" && -s "$dest/${run}_2.fastq.gz" ]]; then
    echo "have $run"; return
  fi
  local sra="$dest/.sra/$run.sra"
  curl -sSfL --retry 3 -o "$sra" "https://sra-pub-run-odp.s3.amazonaws.com/sra/$run/$run"
  fastq-dump -X "$pairs" --split-files --gzip -O "$dest" "$sra" >/dev/null
  rm -f "$sra"
  local got=$(( $(gzip -dc "$dest/${run}_1.fastq.gz" | wc -l) / 4 ))
  if (( got != pairs )); then echo "FAILED $run: $got pairs" >&2; return 1; fi
  echo "ok $run ($got pairs)"
}

export -f fetch; export dest pairs
printf '%s\n' "${runs[@]}" | xargs -P 4 -n 1 bash -c 'fetch "$0"'
rmdir "$dest/.sra" 2>/dev/null || true
