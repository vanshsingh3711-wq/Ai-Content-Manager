import asyncio
import os
import time
import subprocess
import threading
import shutil
from http.server import SimpleHTTPRequestHandler
import socketserver
from playwright.async_api import async_playwright

def start_server(port, directory):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)
        def log_message(self, format, *args):
            pass
    httpd = socketserver.TCPServer(("", port), Handler)
    httpd.serve_forever()

async def main():
    print("[MOTION DEMO] Starting Headless Renderer...")
    
    port = 8082
    server_dir = os.path.abspath('apps/worker/services/engine_3d')
    server_thread = threading.Thread(target=start_server, args=(port, server_dir), daemon=True)
    server_thread.start()
    
    total_frames = 150 # 2.5 seconds
    fps = 60
    delta_time = 1.0 / fps

    frames_dir = "/tmp/demo_frames"
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        
        page = await browser.new_page(
            viewport={'width': 1920, 'height': 1080},
            device_scale_factor=1
        )
        
        file_url = f"http://localhost:{port}/demo_index.html"
        print(f"[MOTION DEMO] Loading {file_url}")
        await page.goto(file_url)

        print("[MOTION DEMO] Waiting for JSON to load...")
        await page.wait_for_function("window.isReady === true", timeout=10000)

        print(f"[MOTION DEMO] Rendering {total_frames} frames at {fps} FPS...")
        start_time = time.time()
        
        for i in range(total_frames):
            sim_time = i * delta_time
            await page.evaluate(f"window.applyMotionState({sim_time})")
            
            frame_path = os.path.join(frames_dir, f"frame_{i:04d}.png")
            await page.screenshot(path=frame_path, type="png")
            
            if i % 30 == 0:
                print(f"[MOTION DEMO] Rendered frame {i}/{total_frames}")

        print(f"[MOTION DEMO] Rendered {total_frames} frames in {time.time() - start_time:.1f} seconds!")
        await browser.close()
        
    print("[MOTION DEMO] Compiling video with FFmpeg...")
    
    output_path = os.path.abspath('apps/worker/services/engine_3d/demo_showcase.mp4')
    if os.path.exists(output_path):
        os.remove(output_path)
        
    subprocess.run([
        'ffmpeg', '-y',
        '-framerate', str(fps),
        '-i', os.path.join(frames_dir, 'frame_%04d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '18',
        '-preset', 'fast',
        output_path
    ], check=True)
    
    print(f"[MOTION DEMO] Complete! Saved to: {output_path}")

if __name__ == "__main__":
    asyncio.run(main())
