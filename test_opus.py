import asyncio
import os
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
        def log_message(self, format, *args):
            pass

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", port), Handler)
    httpd.serve_forever()

async def main():
    frames = 150 # 5 seconds at 30fps
    fps = 30
    width = 1920
    height = 1080
    out_path = "opus_test_render.mp4"

    print("[OpusTest] Booting local HTTP server...")
    port = 8083
    server_dir = os.path.abspath("apps/worker/services/motion_html")
    server_thread = threading.Thread(target=start_server, args=(port, server_dir), daemon=True)
    server_thread.start()

    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "image2pipe",
        "-vcodec", "png",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "ultrafast",
        out_path
    ]
    process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-gpu']
        )
        page = await browser.new_page(
            viewport={'width': width, 'height': height},
            device_scale_factor=1
        )
        
        file_url = f"http://localhost:{port}/opus_hero_reveal.html"
        print(f"[OpusTest] Loading {file_url}...")
        await page.goto(file_url, wait_until="networkidle")

        # Inject some test data
        await page.evaluate('''
            document.getElementById('label').innerText = "CLAUDE OPUS";
            document.getElementById('headline').innerText = "INTELLIGENCE.";
            document.getElementById('accent').innerText = "REDEFINED.";
            document.getElementById('supporting').innerText = "The next generation of cinematic AI reasoning.";
        ''')

        print(f"[OpusTest] Rendering {frames} frames...")
        start_time = time.time()

        for i in range(frames):
            await page.evaluate(f"window.renderFrame({i})")
            frame_bytes = await page.screenshot(type="png", omit_background=True)
            process.stdin.write(frame_bytes)
            
            if i % 30 == 0:
                print(f"[OpusTest] Rendered frame {i}/{frames}")

        await browser.close()
        
    process.stdin.close()
    process.wait()
    print(f"[OpusTest] DONE! Rendered to {out_path} in {time.time() - start_time:.1f}s")

if __name__ == "__main__":
    asyncio.run(main())
