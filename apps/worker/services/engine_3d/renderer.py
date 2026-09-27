import asyncio
import os
import json
import time
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler
import socketserver
from playwright.async_api import async_playwright

def start_server(port, directory):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)
        # Suppress log messages
        def log_message(self, format, *args):
            pass

    httpd = socketserver.TCPServer(("", port), Handler)
    httpd.serve_forever()

async def main():
    print("[3D RENDERER] Booting Headless WebGL Engine (OFFLINE RENDERER)...")
    
    # Start local HTTP server
    port = 8081
    server_dir = os.path.abspath('apps/worker/services/engine_3d')
    server_thread = threading.Thread(target=start_server, args=(port, server_dir), daemon=True)
    server_thread.start()
    
    ai_plan = {
        "edits": [
            {"start": 0, "end": 2, "character_action": "idle"},
            {"start": 2, "end": 5, "character_action": "pointing", "graphic": {"text": "Data-Driven Graphics!", "attach_to": "leftHand"}},
            {"start": 5, "end": 8, "character_action": "talking-while-standing", "graphic": {"text": "Perfect Bone Tracking", "attach_to": "rightHand"}},
            {"start": 8, "end": 10, "character_action": "happy-idle", "graphic": {"text": "Flawless Offline Render", "attach_to": "head"}}
        ]
    }
    
    total_duration_seconds = 10
    fps = 60
    total_frames = total_duration_seconds * fps
    delta_time = 1.0 / fps

    frames_dir = "/tmp/frames"
    os.makedirs(frames_dir, exist_ok=True)
    for f in os.listdir(frames_dir):
        if f.endswith(".jpg"):
            os.remove(os.path.join(frames_dir, f))

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-gl=swiftshader',
                '--disable-dev-shm-usage',
                '--enable-webgl',
                '--ignore-gpu-blocklist',
            ]
        )
        
        page = await browser.new_page(
            viewport={'width': 1920, 'height': 1080},
            device_scale_factor=1 # Changed from 2 to 1 to save RAM and prevent freezing
        )
        
        page.on("pageerror", lambda err: print(f"[WebGL Error]: {err}"))
        page.on("console", lambda msg: print(f"[WebGL]: {msg.text}") if msg.type != "warning" else None)

        file_url = f"http://localhost:{port}/index.html"
        print("[3D RENDERER] Loading 3D Stage on virtual domain...")
        await page.goto(file_url)

        print("[3D RENDERER] Waiting for 3D model to load into memory...")
        await page.wait_for_function("window.isModelLoaded === true", timeout=30000)

        print("[3D RENDERER] Model Loaded! Injecting AI JSON Plan & Preloading FBX...")
        await page.evaluate(f"window.prepareOfflineRender({json.dumps(ai_plan)})")

        print(f"[3D RENDERER] Starting Offline Rendering: {total_frames} frames at {fps} FPS...")
        start_time = time.time()
        
        for i in range(total_frames):
            # 1. Advance simulation
            await page.evaluate(f"window.stepFrame({delta_time})")
            
            # 2. Capture perfect frame
            frame_path = os.path.join(frames_dir, f"frame_{i:04d}.png")
            await page.screenshot(path=frame_path, type="png")
            
            if i % 100 == 0:
                print(f"[3D RENDERER] Rendered frame {i}/{total_frames} ({(i/total_frames)*100:.1f}%)")

        print(f"[3D RENDERER] Finished rendering {total_frames} frames in {time.time() - start_time:.1f} seconds!")
        
        await browser.close()
        
    print("[3D RENDERER] Compiling video with FFmpeg...")
    
    # We output an mp4 file since libx264 ensures excellent compatibility and speed
    output_path = os.path.abspath('apps/worker/services/engine_3d/output.mp4')
    if os.path.exists(output_path):
        os.remove(output_path)
        
    subprocess.run([
        'ffmpeg', '-y',
        '-framerate', str(fps),
        '-i', os.path.join(frames_dir, 'frame_%04d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '18', # High quality
        '-preset', 'fast',
        output_path
    ], check=True)
    
    print(f"[3D RENDERER] Offline recording complete! Saved flawlessly to: {output_path}")

if __name__ == "__main__":
    asyncio.run(main())
