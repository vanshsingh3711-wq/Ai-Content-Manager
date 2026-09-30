import asyncio
import os
import subprocess
import threading
from playwright.async_api import async_playwright
import http.server
import socketserver

def start_server(port, dir_path):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=dir_path, **kwargs)
        def log_message(self, format, *args):
            pass

    with socketserver.TCPServer(("", port), Handler) as httpd:
        httpd.serve_forever()

async def main():
    port = 8084
    server_dir = os.path.abspath("apps/worker/services/motion_html")
    server_thread = threading.Thread(target=start_server, args=(port, server_dir), daemon=True)
    server_thread.start()

    out_path = "webgl_shader_test.mp4"
    fps = 30
    frames = 150

    ffmpeg_cmd = [
        "ffmpeg", "-y", "-f", "image2pipe", "-vcodec", "mjpeg", "-r", str(fps),
        "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out_path
    ]
    
    process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.goto(f"http://localhost:{port}/metric_reveal.html")
        
        # Wait for resources to load
        await page.wait_for_timeout(1000)

        # Mock injectData to test GSAP components
        mock_targets = {"label": "SERVER COST", "metric": "$0.00", "delta": "100% OFF"}
        mock_keyframes = {
            "label": [{"property": "opacity", "frame": 5, "value": 0}, {"property": "opacity", "frame": 35, "value": 1}],
            "metric": [{"property": "opacity", "frame": 15, "value": 0}, {"property": "opacity", "frame": 45, "value": 1}],
            "delta": [{"property": "opacity", "frame": 25, "value": 0}, {"property": "opacity", "frame": 55, "value": 1}]
        }
        import json
        await page.evaluate(f"window.injectData({json.dumps(mock_targets)}, '{json.dumps(mock_keyframes)}')")

        print("Rendering WebGL frames...")
        for i in range(frames):
            await page.evaluate(f"window.renderFrame({i})")
            screenshot = await page.screenshot(type="jpeg", quality=90)
            process.stdin.write(screenshot)
            if i % 30 == 0:
                print(f"Rendered {i}/{frames} frames")
        
        process.stdin.close()
        process.wait()
        await browser.close()
        print(f"Finished rendering {out_path}")

if __name__ == "__main__":
    asyncio.run(main())
