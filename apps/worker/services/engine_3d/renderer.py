import asyncio
import os
import json
from playwright.async_api import async_playwright

async def render_3d_character(json_plan_path: str, output_video_path: str):
    """
    Spins up a headless browser, loads the 3D scene, passes the AI's JSON plan,
    and downloads the resulting WebM video with a transparent background.
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
        
        print(f"[3D RENDERER] Loading 3D Stage: {file_url}")
        await page.goto(file_url)

        # Wait for the HTML/JS to shout that the model is fully loaded
        print("[3D RENDERER] Waiting for 3D model to load into memory...")
        await page.evaluate("""
            () => new Promise(resolve => {
                if (window.isModelLoaded) { resolve(); }
                else { window.onModelLoaded = resolve; }
            })
        """)
        
        print("[3D RENDERER] Model Loaded! Injecting AI JSON Plan...")
        
        # Read the JSON plan we want the character to act out
        with open(json_plan_path, 'r') as f:
            ai_plan = json.load(f)

        # Pass the data into the browser and tell it to start recording
        # The JS will start the MediaRecorder and click a hidden <a download> link when done
        
        async with page.expect_download(timeout=60000) as download_info:
            await page.evaluate(f"""
                async () => {{
                    // This function is inside our index.html
                    // We pass 5 seconds as a dummy duration for the initial test
                    await window.startRecording({json.dumps(ai_plan)}, 5);
                }}
            """)
            
            download = await download_info.value
            
            print(f"[3D RENDERER] Recording complete! Saving video to: {output_video_path}")
            await download.save_as(output_video_path)
            
        await browser.close()
        print("[3D RENDERER] Engine Shut Down successfully.")

if __name__ == "__main__":
    # Test script if run directly
    dummy_plan_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "test_plan.json"))
    with open(dummy_plan_path, "w") as f:
        json.dump({"action": "point", "start": 0}, f)
        
    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "output.webm"))
    
    asyncio.run(render_3d_character(dummy_plan_path, output_path))
