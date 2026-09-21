import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { validateExport } from '@ai-content-manager/motion-components/src/export/export.validation';

// In-memory store for export jobs
const jobs = new Map<string, any>();

export async function POST(req: Request) {
  try {
    const { sequence, config } = await req.json();

    // 1. Validate
    const diagnostics = validateExport(sequence, config);
    const hasErrors = diagnostics.some((d: any) => d.severity === 'error');

    if (hasErrors) {
      return NextResponse.json({ 
        success: false, 
        diagnostics 
      }, { status: 400 });
    }

    // 2. Setup Job
    const jobId = crypto.randomUUID();
    const tempDir = os.tmpdir();
    const propsPath = path.join(tempDir, `props_${jobId}.json`);
    const publicDir = path.join(process.cwd(), 'public', 'exports');
    
    // Ensure public/exports exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Sanitize project name for filename
    const safeName = (sequence.id || 'export').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outFilename = `${safeName}_${jobId.substring(0, 8)}.mp4`;
    const outPath = path.join(publicDir, outFilename);
    const videoUrl = `/exports/${outFilename}`;

    // Write props file
    fs.writeFileSync(propsPath, JSON.stringify({ sequence }));

    jobs.set(jobId, {
      status: 'rendering',
      diagnostics: [],
    });

    // 3. Spawn Remotion CLI
    // We execute it in the motion-components directory
    const motionComponentsDir = path.resolve(process.cwd(), '../../packages/motion-components');
    
    // Command: npx remotion render src/Root.tsx EditorComposition --props=/path/to/props.json /path/to/out.mp4
    const child = spawn('npx', [
      'remotion', 'render', 
      'src/Root.tsx', 
      'EditorComposition',
      `--props=${propsPath}`,
      outPath
    ], {
      cwd: motionComponentsDir,
      stdio: 'pipe'
    });

    jobs.set(jobId, {
      status: 'rendering',
      diagnostics: [],
      process: child
    });

    let errorLog = '';

    child.stdout.on('data', (data) => {
      console.log(`[Remotion ${jobId} stdout]:`, data.toString());
    });

    child.stderr.on('data', (data) => {
      const msg = data.toString();
      console.error(`[Remotion ${jobId} stderr]:`, msg);
      errorLog += msg;
    });

    child.on('close', (code) => {
      // Cleanup props file
      if (fs.existsSync(propsPath)) {
        fs.unlinkSync(propsPath);
      }

      if (code === 0) {
        jobs.set(jobId, {
          status: 'completed',
          videoUrl,
          diagnostics: []
        });
      } else {
        // If it was cancelled manually
        const currentJob = jobs.get(jobId);
        if (currentJob && currentJob.status === 'cancelled') {
          return;
        }

        jobs.set(jobId, {
          status: 'failed',
          diagnostics: [{ severity: 'error', message: `Render failed with code ${code}. Log: ${errorLog.substring(0, 200)}` }]
        });
      }
    });

    return NextResponse.json({
      success: true,
      jobId,
      status: 'rendering'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id || !jobs.has(id)) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = jobs.get(id);
  
  // Omit the process object when returning
  return NextResponse.json({
    jobId: id,
    status: job.status,
    videoUrl: job.videoUrl,
    diagnostics: job.diagnostics
  });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id || !jobs.has(id)) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = jobs.get(id);
  if (job.status === 'rendering' && job.process) {
    job.process.kill();
    jobs.set(id, {
      status: 'cancelled',
      diagnostics: []
    });
    return NextResponse.json({ success: true, status: 'cancelled' });
  }

  return NextResponse.json({ success: false, message: 'Cannot cancel' });
}
