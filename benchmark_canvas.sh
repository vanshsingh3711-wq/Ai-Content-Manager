#!/bin/bash
cd "packages/motion-components"
echo "Running Canvas + FFmpeg Benchmark..."
/usr/bin/time -v node benchmark_canvas.js
