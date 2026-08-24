#!/usr/bin/env bash
# Keep the Electron build sources in step with the canonical files.
#
# RNAflow_App.html and rnaflow_server.py live at the repo root. Two other
# places need their own copies:
#   files/    the Electron build source — package.json "build.files" lists
#             exactly main.js, RNAflow_App.html and rnaflow_server.py
#   website/  the published site, which offers both as standalone downloads
# Before v3 these were kept in sync by hand and had already drifted, so run
# this after editing either canonical file.
#
#   ./sync.sh          copy root -> files/ + website/ and verify
#   ./sync.sh --check   report drift only, change nothing (exit 1 if drifted)

set -euo pipefail
cd "$(dirname "$0")"

CANON=(RNAflow_App.html rnaflow_server.py)
MIRRORS=(files website)
CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

drift=0
for m in "${MIRRORS[@]}"; do
  for f in "${CANON[@]}"; do
    if ! cmp -s "$f" "$m/$f" 2>/dev/null; then
      drift=1
      if [ $CHECK_ONLY -eq 1 ]; then
        echo "DRIFT: $m/$f differs from $f"
      else
        cp "$f" "$m/$f"
        echo "synced: $f -> $m/$f"
      fi
    fi
  done
done

if [ $CHECK_ONLY -eq 1 ]; then
  [ $drift -eq 0 ] && { echo "in sync"; exit 0; } || exit 1
fi

for m in "${MIRRORS[@]}"; do
  for f in "${CANON[@]}"; do
    cmp -s "$f" "$m/$f" || { echo "FAILED to sync $m/$f" >&2; exit 1; }
  done
done
[ $drift -eq 0 ] && echo "already in sync"
echo "OK — files/ and website/ match root"
