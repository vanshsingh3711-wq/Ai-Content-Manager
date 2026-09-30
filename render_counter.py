import asyncio
import subprocess
import os
from playwright.async_api import async_playwright

async def main():
    import http.server
    import socketserver
    import threading

    PORT = 8092
    Handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", PORT), Handler)
    thread = threading.Thread(target=httpd.serve_forever)
    thread.daemon = True
    thread.start()

    frames = 150 # 5 seconds at 30fps

    cmd = [
        "ffmpeg", "-y", "-f", "image2pipe", "-vcodec", "png", "-r", "30",
        "-i", "-", "-c:v", "libx264", "-crf", "15", "-preset", "fast", 
        "-pix_fmt", "yuv420p", "counter_demo.mp4"
    ]
    process = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        await page.goto(f"http://localhost:{PORT}/apps/worker/services/motion_html/animated_counter.html", wait_until="networkidle")

        for i in range(frames):
            await page.evaluate(f"window.renderFrame({i})")
            frame_bytes = await page.screenshot(type="png", omit_background=True)
            process.stdin.write(frame_bytes)

        await browser.close()
    
    process.stdin.close()
    process.wait()
    httpd.shutdown()
    print("Saved counter_demo.mp4")

if __name__ == "__main__":
    asyncio.run(main())
