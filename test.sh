#!/usr/bin/env bash
  set -euo pipefail

  URL="${1:-http://localhost:3030/api/}"
  TOTAL="${2:-200}"
  CONCURRENCY="${3:-20}"

  echo "URL=$URL TOTAL=$TOTAL CONCURRENCY=$CONCURRENCY"

  start=$(date +%s%N)

  seq 1 "$TOTAL" | xargs -I{} -P "$CONCURRENCY" \
    curl -s -o /dev/null "$URL"

  end=$(date +%s%N)
  elapsed_ns=$((end - start))
  elapsed_s=$(awk "BEGIN {print $elapsed_ns/1e9}")
  qps=$(awk "BEGIN {print $TOTAL/$elapsed_s}")

  echo "Elapsed: ${elapsed_s}s"
  echo "QPS: $qps"
