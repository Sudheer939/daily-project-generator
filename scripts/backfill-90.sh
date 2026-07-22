#!/bin/bash
set -e

# backfill-90.sh
# 90 different projects ni వరుసగా generate చేసి, 90 separate repos గా push చేస్తుంది.
# Gemini free tier rate limit (10 requests/min) దాటకుండా, prathi call madhya delay pedతాం.

TOTAL=90
DELAY_SECONDS=8   # ~7.5 requests/min, 10 RPM limit కంటే తక్కువ, safe margin కోసం

for i in $(seq 1 $TOTAL); do
  echo "=========================================="
  echo "Project $i of $TOTAL"
  echo "=========================================="

  export RUN_INDEX="$i"

  cd scripts
  node generate-project.js
  bash create-and-push.sh
  cd ..

  echo "Completed $i of $TOTAL. Waiting ${DELAY_SECONDS}s before next..."
  sleep $DELAY_SECONDS
done

echo "ALL DONE: $TOTAL projects generated and pushed."
