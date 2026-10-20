import os
import glob
import re

html_dir = "apps/worker/services/motion_html"

neon_css = """
    /* Premium Neon Enhancements */
    #window, .card, #container > div, .quote-box, .stat-box {
        border: 2px solid rgba(255, 255, 255, 0.3) !important;
        box-shadow: 0 0 60px rgba(167, 139, 250, 0.3), 0 30px 60px rgba(0, 0, 0, 0.8) !important;
        background: rgba(10, 10, 15, 0.9) !important;
    }
    .accent-text, .metric, .delta.positive, .delta.negative {
        text-shadow: 0 0 20px currentColor !important;
    }
"""

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    
    # 1. Fix viewport clipping (Hardcoded 1080x1920 to 100vw/vh)
    content = re.sub(r'width:\s*1080px;', 'width: 100vw;', content)
    content = re.sub(r'height:\s*1920px;', 'height: 100vh;', content)
    
    # 2. Inject Neon Glow CSS right before </style>
    if "/* Premium Neon Enhancements */" not in content:
        content = content.replace("</style>", neon_css + "\n  </style>")

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Patched {os.path.basename(filepath)}")

for filepath in glob.glob(os.path.join(html_dir, "*.html")):
    patch_file(filepath)
