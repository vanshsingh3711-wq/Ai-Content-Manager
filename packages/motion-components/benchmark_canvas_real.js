const { createCanvas } = require('@napi-rs/canvas');
const { spawn } = require('child_process');
const fs = require('fs');

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_FRAMES = parseInt(process.argv[2] || "150");
const OUT_FILE = `benchmark_real_${DURATION_FRAMES}.mp4`;

console.log(`Starting Real Workload Benchmark: ${DURATION_FRAMES} frames`);

const ffmpeg = spawn('ffmpeg', [
  '-y',
  '-f', 'rawvideo',
  '-pix_fmt', 'rgba',
  '-s', `${WIDTH}x${HEIGHT}`,
  '-r', `${FPS}`,
  '-i', '-', // stdin
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  OUT_FILE
]);

ffmpeg.stderr.on('data', () => {}); // Mute ffmpeg output to keep console clean

ffmpeg.on('close', (code) => {
  if (code === 0) {
    const stats = fs.statSync(OUT_FILE);
    console.log(`Real Workload Finished! Size: ${stats.size} bytes`);
  } else {
    console.error(`FFmpeg failed with exit code ${code}`);
  }
});

// Create cached bitmaps (Rigid Parts)
const HEAD_IMG = createCanvas(300, 300);
const hctx = HEAD_IMG.getContext('2d');
hctx.fillStyle = '#ffccaa'; 
hctx.beginPath(); 
hctx.arc(150, 150, 140, 0, Math.PI * 2); 
hctx.fill();
hctx.fillStyle = 'blue'; 
hctx.beginPath(); hctx.arc(100, 100, 20, 0, Math.PI * 2); hctx.fill();
hctx.beginPath(); hctx.arc(200, 100, 20, 0, Math.PI * 2); hctx.fill();

const TORSO_IMG = createCanvas(400, 500);
const tctx = TORSO_IMG.getContext('2d');
tctx.fillStyle = '#336699'; 
tctx.fillRect(0, 0, 400, 500);

const ARM_IMG = createCanvas(100, 300);
const actx = ARM_IMG.getContext('2d');
actx.fillStyle = '#ffccaa'; 
actx.fillRect(0, 0, 100, 300);

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

async function renderFrames() {
  for (let frame = 0; frame < DURATION_FRAMES; frame++) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    const time = frame / FPS;
    
    // --- 1. FULL CHARACTER RIG COMPOSITING ---
    
    // Torso
    ctx.save();
    ctx.translate(WIDTH / 2 - 200, HEIGHT / 2 - 50);
    ctx.drawImage(TORSO_IMG, 0, 0);
    ctx.restore();
    
    // Head with bobbing
    const headY = Math.sin(time * 5) * 10;
    ctx.save();
    ctx.translate(WIDTH / 2 - 150, HEIGHT / 2 - 350 + headY);
    ctx.drawImage(HEAD_IMG, 0, 0);
    
    // Per-beat lip morph (interpolation simulation)
    const mouthOpen = Math.max(0, Math.sin(time * 15));
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(150, 220, 40 + mouthOpen * 10, 10 + mouthOpen * 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Brow morph (interpolation simulation)
    const browAngle = Math.sin(time * 2) * 0.2;
    ctx.save();
    ctx.translate(100, 60);
    ctx.rotate(browAngle);
    ctx.fillRect(-40, -5, 80, 10);
    ctx.restore();
    ctx.save();
    ctx.translate(200, 60);
    ctx.rotate(-browAngle);
    ctx.fillRect(-40, -5, 80, 10);
    ctx.restore();
    
    ctx.restore(); // end head
    
    // Left Arm (with rotation transform)
    const armAngle = Math.sin(time * 3) * 0.5;
    ctx.save();
    ctx.translate(WIDTH / 2 - 250, HEIGHT / 2 - 50);
    ctx.rotate(armAngle);
    ctx.drawImage(ARM_IMG, -50, 0);
    ctx.restore();
    
    // Right Arm (with rotation transform)
    ctx.save();
    ctx.translate(WIDTH / 2 + 250, HEIGHT / 2 - 50);
    ctx.rotate(-armAngle);
    ctx.drawImage(ARM_IMG, -50, 0);
    ctx.restore();
    
    // --- 2. MOTION-GRAPHICS KEYFRAME INTERPRETER ---
    
    const beat = Math.floor(time * 2);
    // Interpolate scale for pop effect on each beat
    const popScale = 1 + Math.max(0, 1 - ((time * 2) % 1)) * 0.2; 
    
    ctx.save();
    ctx.translate(WIDTH / 2, HEIGHT - 200);
    ctx.scale(popScale, popScale);
    
    // Graphic element
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(-400, -80, 800, 160, [40]);
    ctx.fill();
    
    // Text element
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Sentence beat ${beat}: Hello world!`, 0, 0);
    
    ctx.restore();
    
    // --- 3. BUFFER PUSH & BACKPRESSURE ---
    const buffer = canvas.data(); 
    
    const canWrite = ffmpeg.stdin.write(buffer);
    if (!canWrite) {
      await new Promise(resolve => ffmpeg.stdin.once('drain', resolve));
    }
  }
  ffmpeg.stdin.end();
}

renderFrames();
