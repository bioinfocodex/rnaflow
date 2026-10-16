#!/usr/bin/env bash
# Data for the small RNA benchmark: synthetic ratiometric pools from
# Giraldez et al. 2018 (GEO GSE94585), TruSeq libraries from lab 1.
#
# Pools SynthA and SynthB hold the same synthetic RNAs at designed relative
# concentrations, so the true fold change of every RNA is known. Each pool was
# sequenced in quadruplicate.
#
#   bash benchmark/smallrna/fetch_giraldez.sh DEST_DIR
#
# Writes DEST_DIR/raw_data/<run>.fastq.gz, DEST_DIR/truth.tsv (designed
# log2 fold change per human miRNA, B vs A) and DEST_DIR/authors_counts.tsv
# (the authors' own counts for the same libraries). Needs fastq-dump.
set -euo pipefail

dest=${1:?usage: fetch_giraldez.sh DEST_DIR}
mkdir -p "$dest/raw_data" "$dest/.sra" "$dest/authors"

A_RUNS=(SRR5234383 SRR5234384 SRR5234385 SRR5234386)   # TruSeq.Lab1.SynthA, replicates 1-4
B_RUNS=(SRR5234463 SRR5234464 SRR5234465 SRR5234466)   # TruSeq.Lab1.SynthB, replicates 1-4

fetch() {
  local run=$1 out="$dest/raw_data/$1.fastq.gz"
  [[ -s "$out" ]] && { echo "have $run"; return; }
  curl -sSfL --retry 3 -o "$dest/.sra/$run" "https://sra-pub-run-odp.s3.amazonaws.com/sra/$run/$run"
  fastq-dump --gzip -O "$dest/raw_data" "$dest/.sra/$run" > /dev/null
  rm -f "$dest/.sra/$run"
  echo "ok $run"
}
export -f fetch; export dest
printf '%s\n' "${A_RUNS[@]}" "${B_RUNS[@]}" | xargs -P 4 -n 1 bash -c 'fetch "$0"'
rmdir "$dest/.sra" 2>/dev/null || true

# The authors' per-replicate counts. Each RNA's name carries its designed
# concentrations, e.g. "LET-7B;hsa-let-7b-5p|1x|3x" = 1 part in A, 3 in B.
geo=https://ftp.ncbi.nlm.nih.gov/geo/samples/GSM2478nnn
for pool in A:GSM2478899:115 B:GSM2478919:119; do
  IFS=: read -r p gsm s0 <<< "$pool"
  for i in 1 2 3 4; do
    f="${gsm}_sample_TruSeq_Ratiometric_${p}_${i}_S$((s0 + i - 1))_L008_R1_001_fastq.clipped.trimmed.filtered.calibratormapped.counts.txt.gz"
    [[ -s "$dest/authors/$p$i.txt.gz" ]] || curl -sSfL -o "$dest/authors/$p$i.txt.gz" "$geo/$gsm/suppl/$f"
  done
done

# Truth: one row per human miRNA, designed log2 fold change of B over A
gzip -dc "$dest/authors/A1.txt.gz" | awk '{
    split($2, f, "|"); n = split(f[1], name, /[;,]/)
    a = f[2]; b = f[3]; sub(/x$/, "", a); sub(/x$/, "", b)
    for (i = 1; i <= n; i++) if (name[i] ~ /^hsa-/) print name[i] "\t" a "\t" b }' \
  | sort -u | awk -F'\t' 'BEGIN { OFS = "\t"; print "mirna", "A", "B", "log2FC" }
                          { print $1, $2, $3, log($3 / $2) / log(2) }' > "$dest/truth.tsv"

# Authors' counts on the same human miRNAs, one column per library
for f in A1 A2 A3 A4 B1 B2 B3 B4; do
  gzip -dc "$dest/authors/$f.txt.gz" | awk -v s=$f '{
    split($2, x, "|"); n = split(x[1], name, /[;,]/)
    for (i = 1; i <= n; i++) if (name[i] ~ /^hsa-/) print s "\t" name[i] "\t" $1 }'
done | awk -F'\t' '{ c[$2, $1] += $3; m[$2] = 1 }
  END { printf "mirna\tA1\tA2\tA3\tA4\tB1\tB2\tB3\tB4\n"
        split("A1 A2 A3 A4 B1 B2 B3 B4", s, " ")
        for (r in m) { printf "%s", r; for (i = 1; i <= 8; i++) printf "\t%d", c[r, s[i]]; print "" } }' \
  > "$dest/authors_counts.tsv"

echo "truth: $(($(wc -l < "$dest/truth.tsv") - 1)) human miRNAs; authors' counts: $(($(wc -l < "$dest/authors_counts.tsv") - 1)) rows"
