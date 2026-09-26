#!/bin/bash
cd "packages/motion-components"

PROPS='{"text":"Test Benchmark Animation"}'
echo "Running Remotion Benchmark..."

/usr/bin/time -v npx remotion render src/Root.tsx MotionGraphicsPreview benchmark_out.webm \
  --props="$PROPS" \
  --frames=0-899 \
  --pixel-format=yuva420p \
  --codec=vp8 \
  --image-format=png

ls -lh benchmark_out.webm
