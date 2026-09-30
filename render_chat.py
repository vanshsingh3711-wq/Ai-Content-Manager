import asyncio
import subprocess
import os
from playwright.async_api import async_playwright

async def main():
    import http.server
    import socketserver
    import threading

    PORT = 8089
    Handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", PORT), Handler)
    thread = threading.Thread(target=httpd.serve_forever)
    thread.daemon = True
    thread.start()

    frames = 240 # 8 seconds at 30fps

    cmd = [
        "ffmpeg", "-y", "-f", "image2pipe", "-vcodec", "png", "-r", "30",
        "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "slow", 
        "-pix_fmt", "yuv420p", "saas_chat_demo.mp4"
    ]
    process = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Use device_scale_factor=2 for Retina-quality crisp text rendering
        page = await browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=2)
        await page.goto(f"http://localhost:{PORT}/apps/worker/services/motion_html/saas_chat.html")
        await page.wait_for_timeout(1000)

        for i in range(frames):
            await page.evaluate(f"window.renderFrame({i})")
            frame_bytes = await page.screenshot(type="png", omit_background=True)
            process.stdin.write(frame_bytes)
            
            if i % 30 == 0:
                print(f"Rendered {i}/{frames} frames")

        await browser.close()
    
    process.stdin.close()
    process.wait()
    httpd.shutdown()
    print("Saved saas_chat_demo.mp4")

if __name__ == "__main__":
    asyncio.run(main())
