import asyncio
import os
import json
import time
import subprocess
import threading
import sys
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

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", port), Handler)
    httpd.serve_forever()

async def main():
    if len(sys.argv) < 6:
        print("Usage: python render_html_motion.py <out_path> <frames> <fps> <width> <height> <props_json>")
        sys.exit(1)

    out_path = sys.argv[1]
    frames = int(sys.argv[2])
    fps = int(sys.argv[3])
    width = int(sys.argv[4])
    height = int(sys.argv[5])
    props_json = sys.argv[6]

    try:
        props = json.loads(props_json)
    except Exception as e:
        print(f"Failed to parse props JSON: {e}")
        sys.exit(1)

    comp_type = props.get("type", "hero_reveal")
    targets = props.get("targets", {})

    print(f"[HTMLRender] Resolving keyframes via TSX...")
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))
    motion_dir = os.path.join(root_dir, 'packages', 'motion-components')
    
    # We run the typescript resolver using npx tsx
    resolve_cmd = ["npx", "tsx", "scripts/resolve_motion.ts", props_json]
    result = subprocess.run(resolve_cmd, cwd=motion_dir, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Failed to resolve motion:\n{result.stderr}\n{result.stdout}")
        sys.exit(1)

    lines = result.stdout.strip().split("\n")
    keyframes_json = lines[-1]
    
    if not keyframes_json.startswith("["):
        print(f"Failed to parse keyframes JSON from resolver output:\n{result.stdout}")
        sys.exit(1)

    print("[HTMLRender] Booting Headless WebGL Engine (OFFLINE RENDERER)...")
    
    # Start local HTTP server
    port = 8082
    server_dir = os.path.abspath(os.path.dirname(__file__))
    server_thread = threading.Thread(target=start_server, args=(port, server_dir), daemon=True)
    server_thread.start()
    
    if os.path.exists(out_path):
        os.remove(out_path)
        
    print(f"[HTMLRender] Starting Offline Rendering: {frames} frames at {fps} FPS (Piping to FFmpeg)...")
    
    ffmpeg_cmd = [
        "ffmpeg", "-y", "-hide_banner",
        "-threads", "2",
        "-f", "image2pipe",
        "-vcodec", "png",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "qtrle",
        "-pix_fmt", "argb",
        out_path
    ]
    
    process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    start_time = time.time()
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
            ]
        )
        
        page = await browser.new_page(
            viewport={'width': width, 'height': height},
            device_scale_factor=1,
            has_touch=False
        )
        
        page.on("pageerror", lambda err: print(f"[Browser Error]: {err}"))
        page.on("console", lambda msg: print(f"[Browser]: {msg.text}") if msg.type != "warning" else None)

        file_url = f"http://localhost:{port}/{comp_type}.html"
        print(f"[HTMLRender] Loading {comp_type}.html on virtual domain...")
        await page.goto(file_url, wait_until="networkidle")

        print("[HTMLRender] Injecting Motion Keyframes...")
        await page.evaluate(
            "([targets, keyframes]) => window.injectData(targets, keyframes)",
            [targets, keyframes_json]
        )
        
        # Wait for any dynamically injected images to load
        await page.evaluate('''
            async () => {
                const imgs = Array.from(document.images);
                await Promise.all(imgs.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve; // Continue even if an image fails
                    });
                }));
            }
        ''')

        for i in range(frames):
            await page.evaluate(f"window.renderFrame({i})")
            
            # Universal Exit Animation (Fade out in the last 15 frames)
            if i > frames - 15:
                opacity = (frames - i) / 15.0
                await page.evaluate(f"document.body.style.opacity = '{opacity}'")

            frame_bytes = await page.screenshot(type="png", omit_background=True)
            process.stdin.write(frame_bytes)
            
            if i % 30 == 0:
                print(f"[HTMLRender] Rendered frame {i}/{frames} ({(i/frames)*100:.1f}%)")

        await browser.close()
        
    print("[HTMLRender] Finished rendering frames. Closing FFmpeg stream...")
    process.stdin.close()
    process.wait()
    
    print(f"[HTMLRender] Offline recording complete! Saved flawlessly in {time.time() - start_time:.1f} seconds to: {out_path}")

if __name__ == "__main__":
    asyncio.run(main())
