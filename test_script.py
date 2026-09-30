import asyncio
import json
import os
from playwright.async_api import async_playwright

async def main():
    import http.server
    import socketserver
    import threading

    PORT = 8086
    Handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", PORT), Handler)
    thread = threading.Thread(target=httpd.serve_forever)
    thread.daemon = True
    thread.start()

    targets = {
        "code": "def run_opus():\\n    return 'Perfect'",
        "filename": "opus.py"
    }
    keyframes_json = "{}"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.goto(f"http://localhost:{PORT}/apps/worker/services/motion_html/code_reveal.html")
        await page.wait_for_timeout(1000)

        await page.evaluate(
            "([targets, keyframes]) => window.injectData(targets, keyframes)",
            [targets, keyframes_json]
        )
        
        # Render frame 45 (when cards should be fully visible)
        await page.evaluate("window.renderFrame(45)")
        await page.wait_for_timeout(100)
        
        await page.screenshot(path="debug_frame.png")
        print("Saved debug_frame.png")

        await browser.close()
    httpd.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
