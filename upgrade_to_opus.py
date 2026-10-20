import os
import glob
import re

html_dir = "apps/worker/services/motion_html"

opus_css = """
    /* Opus Engine: Phase 1 (Clean Environment) */
    body {
      perspective: 1500px;
      background: radial-gradient(circle at 50% 0%, #1a2035, #0b0f19 80%) !important;
    }

    #noise-bg, #fog-layer {
      display: none !important;
    }

    /* Opus Engine: Phase 3 (Extreme Glassmorphism) */
    #window, .card, #container > div, .quote-box, .stat-box, #background {
        background: rgba(10, 10, 15, 0.4) !important;
        backdrop-filter: blur(30px) saturate(200%) brightness(1.1) !important;
        -webkit-backdrop-filter: blur(30px) saturate(200%) brightness(1.1) !important;
        border: none !important;
        box-shadow: 
            inset 0 0 0 1.5px rgba(255, 255, 255, 0.15), 
            inset 0 20px 40px rgba(255, 255, 255, 0.05),
            0 30px 80px rgba(167, 139, 250, 0.2),
            0 10px 30px rgba(0, 0, 0, 0.8) !important;
        transform-style: preserve-3d;
    }
    
    .accent-text, .metric, .delta.positive, .delta.negative, #accent {
        text-shadow: 0 0 20px currentColor !important;
    }
"""

opus_js_replacement = """
    function applyMotionState(elementId, keyframes, frame) {
        if (!keyframes) return;
        const el = document.getElementById(elementId);
        if (!el) return;

        let scale = 1, opacity = 1, translateY = 0, blur = 0, translateX = 0;
        let rotateX = 0, rotateY = 0, translateZ = 0;

        for (const track of keyframes) {
            const val = evaluateTrack(track, frame);
            if (val === null) continue;

            if (track.property === 'opacity') opacity = val;
            else if (track.property === 'scale') scale = val;
            else if (track.property === 'translateY') translateY = val;
            else if (track.property === 'translateX') translateX = val;
            else if (track.property === 'blur') blur = val;
            else if (track.property === 'rotateX') rotateX = val;
            else if (track.property === 'rotateY') rotateY = val;
            else if (track.property === 'translateZ') translateZ = val;
        }

        // Opus Engine: Phase 2 Continuous Drift Logic
        const time = frame / 30.0;

        // Add extreme 3D depth to main containers based on scale entry
        if (['background', 'window', 'container'].includes(elementId) || el.classList.contains('card')) {
            const driftX = Math.sin(time) * 2;
            const driftY = Math.cos(time) * 2;
            
            // Map opacity or scale into 3D fly-in
            const entryP = opacity; 
            rotateX += (1 - entryP) * 40 + driftX;
            rotateY += (1 - entryP) * -40 + driftY;
            translateZ += (1 - entryP) * -500;
        } 
        // Text elements pop out
        else {
             translateZ += 50; 
        }

        let transformStr = "";
        if (translateZ !== 0 || translateY !== 0 || translateX !== 0) transformStr += `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) `;
        if (scale !== 1) transformStr += `scale(${scale}) `;
        if (rotateX !== 0) transformStr += `rotateX(${rotateX}deg) `;
        if (rotateY !== 0) transformStr += `rotateY(${rotateY}deg) `;

        el.style.opacity = opacity;
        el.style.transform = transformStr;
        if (blur > 0) el.style.filter = `blur(${blur}px)`;
        else el.style.filter = 'none';
    }
"""

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    
    # 1. Strip out the old "Neon Enhancements" from phase 1
    content = re.sub(r'/\* Premium Neon Enhancements \*/.*?</style>', '</style>', content, flags=re.DOTALL)
    
    # 2. Inject Opus CSS
    if "/* Opus Engine: Phase 1" in content:
        # Remove old Opus CSS block
        content = re.sub(r'/\* Opus Engine: Phase 1.*?</style>', '</style>', content, flags=re.DOTALL)
    
    content = content.replace("</style>", opus_css + "\n  </style>")

    # 3. Inject Opus HTML tags right after <body>
    if '<div id="noise-bg"></div>' not in content:
        content = content.replace("<body>", "<body>\n  <!-- Opus Background -->\n  <div id=\"noise-bg\"></div>\n  <div id=\"fog-layer\"></div>\n")

    # 4. Inject Opus JS
    if "// Opus Engine: Phase 2 Continuous Drift Logic" in content:
        # We need to clean up the corrupted applyMotionState injected previously.
        # Find everything from "function applyMotionState" up to "window.injectData"
        content = re.sub(r'function applyMotionState\(elementId, keyframes, frame\) \{.*?(?=\n\s*(?:window\.injectData|let fullCode|let currentFrame))', opus_js_replacement, content, flags=re.DOTALL)
    else:
        # First time injection
        content = re.sub(r'function applyMotionState\(elementId, keyframes, frame\) \{.*?(?=\n\s*(?:window\.injectData|let fullCode|let currentFrame))', opus_js_replacement, content, flags=re.DOTALL)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Upgraded to Opus Engine: {os.path.basename(filepath)}")

for filepath in glob.glob(os.path.join(html_dir, "*.html")):
    if os.path.basename(filepath) != "opus_hero_reveal.html":
        patch_file(filepath)

print("Upgrade complete!")
