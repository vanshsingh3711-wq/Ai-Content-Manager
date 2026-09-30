import os
import glob

html_dir = "apps/worker/services/motion_html"

unified_premium_css = """
    /* Premium Vector Motion Background */
    body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #030303 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .bg-grid {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: -10;
    }
    .ui-frame {
      position: absolute;
      width: 100vw;
      height: 100vh;
      z-index: -5;
    }
    .ui-path {
      fill: none;
      stroke: rgba(255,255,255,0.8);
      stroke-width: 1.5;
    }
    
    #noise-bg, #fog-layer, #webgl-canvas {
      display: none !important;
    }

    /* Unified Glassmorphism Component Style */
    #window, #container, .card, .quote-box, .stat-box, #background, #content-container {
        background: rgba(15, 15, 20, 0.6) !important;
        backdrop-filter: blur(40px) saturate(200%) brightness(1.2) !important;
        -webkit-backdrop-filter: blur(40px) saturate(200%) brightness(1.2) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: 
            inset 0 0 0 1px rgba(255, 255, 255, 0.05), 
            0 40px 100px rgba(0, 0, 0, 0.8),
            0 10px 40px rgba(167, 139, 250, 0.1) !important;
        border-radius: 24px;
        padding: 60px;
        transform-style: preserve-3d;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 600px;
        max-width: 1200px;
        text-align: center;
    }

    /* Specific Typography */
    #label, .title {
        font-size: 24px;
        letter-spacing: 6px;
        text-transform: uppercase;
        color: #a78bfa;
        margin-bottom: 20px;
        font-weight: 600;
    }

    #metric, #quote, #headline, .value {
        font-size: 120px;
        font-weight: 800;
        letter-spacing: -3px;
        line-height: 1.1;
        margin: 20px 0;
        background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    #delta, #author, #supporting {
        font-size: 32px;
        color: #10b981;
        font-weight: 500;
        margin-top: 10px;
        padding: 10px 20px;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 12px;
    }

    #author, #supporting {
        color: #94a3b8;
        background: none;
        border: none;
        font-size: 36px;
    }

    /* Code Window specific */
    #window {
        padding: 0;
        align-items: flex-start;
        text-align: left;
        width: 1000px;
    }
    #titlebar {
        width: 100%;
        height: 50px;
        background: rgba(0, 0, 0, 0.4);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        padding: 0 20px;
        border-radius: 24px 24px 0 0;
    }
    .dot {
        width: 12px; height: 12px; border-radius: 50%; margin-right: 8px;
    }
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }
    
    #code-container {
        padding: 40px;
        font-family: "JetBrains Mono", "Fira Code", monospace;
        font-size: 32px;
        color: #e2e8f0;
        line-height: 1.6;
        white-space: pre-wrap;
    }
    
    /* Steps specific */
    .step {
        display: flex;
        align-items: center;
        margin-bottom: 30px;
        font-size: 40px;
        font-weight: 600;
        background: rgba(255,255,255,0.05);
        padding: 20px 40px;
        border-radius: 16px;
        width: 100%;
    }
    .step-num {
        color: #a78bfa;
        margin-right: 20px;
        font-size: 48px;
    }
"""

def restore_css(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if os.path.basename(filepath) in ["opus_hero_reveal.html", "opus_webgl_base.html", "premium_base.html"]:
        return

    # Replace everything between <style> and </style> with the unified css
    import re
    content = re.sub(r'<style>.*?</style>', f"<style>\n{unified_premium_css}\n</style>", content, flags=re.DOTALL)

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Restored and upgraded CSS for: {os.path.basename(filepath)}")

for filepath in glob.glob(os.path.join(html_dir, "*.html")):
    restore_css(filepath)

print("CSS Restore complete!")
