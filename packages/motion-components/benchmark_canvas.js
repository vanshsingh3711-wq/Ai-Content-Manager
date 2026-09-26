const { createCanvas } = require('@napi-rs/canvas');
const { spawn } = require('child_process');
const fs = require('fs');

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_FRAMES = 900;
const OUT_FILE = 'benchmark_canvas_out.mp4';

console.log("Starting Canvas + FFmpeg Benchmark...");

// Create FFmpeg process
// Reads raw RGBA frames from stdin, outputs VP8 webm with alpha (yuva420p)
const ffmpeg = spawn('ffmpeg', [
  '-y',
  '-f', 'rawvideo',
  '-pix_fmt', 'rgba',
  '-s', `${WIDTH}x${HEIGHT}`,
  '-r', `${FPS}`,
  '-i', '-', // stdin
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p', // No alpha for x264, but sufficient for benchmark
  '-b:v', '1M',
  OUT_FILE
]);

ffmpeg.stderr.on('data', (data) => {
    console.error(`ffmpeg: ${data}`);
});

ffmpeg.on('close', (code) => {
  if (code === 0) {
    const stats = fs.statSync(OUT_FILE);
    console.log(`Canvas Benchmark Finished! Size: ${stats.size} bytes`);
  } else {
    console.error(`FFmpeg failed with exit code ${code}`);
  }
});

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

async function renderFrames() {
  for (let frame = 0; frame < DURATION_FRAMES; frame++) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const progress = frame / DURATION_FRAMES;
    const yOffset = Math.max(0, 100 - (progress * 200));
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(100, 800 + yOffset, 880, 200, [40]);
    ctx.fill();
    
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("Test Benchmark Animation", WIDTH / 2, 900 + yOffset);
    
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const buffer = Buffer.from(imageData.data.buffer);
    
    const canWrite = ffmpeg.stdin.write(buffer);
    if (!canWrite) {
      await new Promise(resolve => ffmpeg.stdin.once('drain', resolve));
    }
  }
  ffmpeg.stdin.end();
}

renderFrames();
