import asyncio
import os
import json
from playwright.async_api import async_playwright

async def render_3d_character(ai_plan: dict, output_video_path: str, duration: float = 5.0, audio_path: str = None):
    """
    Spins up a headless browser, loads the 3D scene, passes the AI's JSON plan,
    injects the TTS audio, and downloads the resulting WebM video.
    """
    
    # Get the absolute path to our HTML file
    html_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "index.html"))
    file_url = f"file://{html_path}"

    print(f"[3D RENDERER] Booting Headless WebGL Engine...")
    
    async with async_playwright() as p:
        # Launch Chromium (Headless)
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-web-security",  # Allows loading local assets
                "--allow-file-access-from-files",
                "--use-gl=swiftshader",    # Forces software rendering (safe for servers)
                "--enable-unsafe-webgpu"
            ]
        )
        
        context = await browser.new_context(
            accept_downloads=True, # Critical for saving the video!
            viewport={"width": 1920, "height": 1080}
        )
        
        page = await context.new_page()
        
        # Route console logs to terminal so we can debug Three.js
        page.on("console", lambda msg: print(f"[WebGL]: {msg.text}"))
        
        # Serve local files via a fake domain to bypass Chrome's strict CORS rules on file://
        file_dir = os.path.dirname(__file__)
        async def route_intercept(route):
            url = route.request.url
            # Inject the real audio file when the browser asks for audio.mp3
            if url == "http://local-3d-engine/audio.mp3" and audio_path and os.path.exists(audio_path):
                await route.fulfill(path=os.path.abspath(audio_path))
                return
                
            if url.startswith("http://local-3d-engine/"):
                file_name = url.replace("http://local-3d-engine/", "")
                file_path = os.path.join(file_dir, file_name)
                if os.path.exists(file_path):
                    await route.fulfill(path=file_path)
                    return
            await route.continue_()
            
        await page.route("**/*", route_intercept)
        
        print(f"[3D RENDERER] Loading 3D Stage on virtual domain...")
        await page.goto("http://local-3d-engine/index.html")

        # Wait for the HTML/JS to shout that the model is fully loaded
        print("[3D RENDERER] Waiting for 3D model to load into memory...")
        await page.evaluate("""
            () => new Promise(resolve => {
                if (window.isModelLoaded) { resolve(); }
                else { window.onModelLoaded = resolve; }
            })
        """)
        
        print("[3D RENDERER] Model Loaded! Injecting AI JSON Plan...")
        
        # Pass the data into the browser and tell it to start recording
        async with page.expect_download(timeout=60000) as download_info:
            await page.evaluate(f"""
                async () => {{
                    // We pass the exact duration so the recording knows when to stop
                    await window.startRecording({json.dumps(ai_plan)}, {duration});
                }}
            """)
            
            download = await download_info.value
            
            print(f"[3D RENDERER] Recording complete! Saving video to: {output_video_path}")
            await download.save_as(output_video_path)
            
        await browser.close()
        print("[3D RENDERER] Engine Shut Down successfully.")

if __name__ == "__main__":
    # Test script if run directly
    dummy_plan = {
        "edits": [
            {"start": 0.0, "end": 2.0, "action": "character", "character_action": "point"},
            {"start": 2.0, "end": 4.0, "action": "character", "character_action": "explain"},
            {"start": 4.0, "end": 6.0, "action": "character", "character_action": "idle"}
        ]
    }
    
    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "output.webm"))
    audio_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "audio.mp3"))
    
    # Run the test for 6 seconds to see all transitions and lip sync
    asyncio.run(render_3d_character(dummy_plan, output_path, duration=6.0, audio_path=audio_path))
