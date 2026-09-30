import os
import glob

html_dir = "apps/worker/services/motion_html"

premium_css = """
    /* Premium Vector Motion Background */
    body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #030303 !important;
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
      stroke: rgba(255,255,255,1.0);
      stroke-width: 1.5;
    }
    /* Hide old Opus Phase 1/3 messy elements */
    #noise-bg, #fog-layer, #webgl-canvas {
      display: none !important;
    }
"""

premium_html = """
  <!-- The Animated Background Grid -->
  <svg class="bg-grid" width="100%" height="100%">
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
    <rect width="100%" height="100%" fill="url(#grid)" />
    <radialGradient id="grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#030303" stop-opacity="0" />
      <stop offset="100%" stop-color="#030303" stop-opacity="1" />
    </radialGradient>
    <rect width="100%" height="100%" fill="url(#grad)" />
  </svg>
  <!-- The Vector Motion Graphics Frame -->
  <svg class="ui-frame" viewBox="0 0 1920 1080">
    <rect id="frame-border" x="40" y="40" width="1840" height="1000" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <path class="ui-path corner" d="M 40 80 L 40 40 L 80 40" />
    <path class="ui-path corner" d="M 1840 80 L 1840 40 L 1880 40" />
    <path class="ui-path corner" d="M 1880 1040 L 1880 1000 L 1840 1000" />
    <path class="ui-path corner" d="M 80 1040 L 40 1040 L 40 1000" />
    <path class="ui-path cross" d="M 100 100 L 110 100 M 105 95 L 105 105" />
    <path class="ui-path cross" d="M 1810 100 L 1820 100 M 1815 95 L 1815 105" />
  </svg>
"""

premium_js = """
    // --- Premium Vector / GSAP Injection ---
    let masterTl = gsap.timeline({ paused: true });
    
    // Draw SVG Frame Elements
    const corners = document.querySelectorAll('.corner');
    const crosses = document.querySelectorAll('.cross');
    corners.forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    masterTl.to(corners, { strokeDashoffset: 0, duration: 1.0, ease: "power2.out", stagger: 0.1 }, 0.5);
    masterTl.fromTo(crosses, { opacity: 0, scale: 0, transformOrigin: "center" }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, 1.0);

    window.injectData = (targets, keyframesJson) => {
        window.animationData = JSON.parse(keyframesJson);
        // Populate text targets
        for (const [id, text] of Object.entries(targets)) {
            const el = document.getElementById(id);
            if (el && id !== 'code') el.innerHTML = text;
        }
            // Apply split text to large text headers for stagger
            document.querySelectorAll('h1, h2, #quote, #metric, #before, #after').forEach(el => {
                if (el.innerText.length > 0 && !el.innerHTML.includes('<span class="word"')) {
                    el.innerHTML = el.innerText.split(' ').map(w => `<span class="word" style="display:inline-block; will-change:transform, opacity">${w}&nbsp;</span>`).join('');
                }
            });

            // Physics: Cards bounce in
            const cards = document.querySelectorAll('#container, .card, .window, .quote-box, .stat-box');
            if (cards.length > 0) {
                masterTl.fromTo(cards, 
                    { scale: 0.8, opacity: 0, y: 100, rotationX: 10 }, 
                    { scale: 1, opacity: 1, y: 0, rotationX: 0, duration: 1.5, ease: "elastic.out(1, 0.5)" }, 0
                );
            }

            // Physics: Words stagger cascade
            const words = document.querySelectorAll('.word');
            if (words.length > 0) {
                masterTl.fromTo(words, 
                    { y: 50, opacity: 0, rotationX: 45 }, 
                    { y: 0, opacity: 1, rotationX: 0, duration: 1, ease: "power4.out", stagger: 0.05 }, 0.5
                );
            }

            // Physics: Icons and smaller elements pop
            const icons = document.querySelectorAll('.ph, #label, #author, #filename');
            if (icons.length > 0) {
                masterTl.fromTo(icons, 
                    { scale: 0.5, opacity: 0 }, 
                    { scale: 1, opacity: 1, duration: 1, ease: "back.out(1.5)", stagger: 0.1 }, 0.8
                );
            }
    };

    window.renderFrame = (frame) => {
        masterTl.time(frame / 30.0);
    };
"""

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Skip files that have already been completely rewritten or are not components
    if os.path.basename(filepath) in ["opus_hero_reveal.html", "opus_webgl_base.html", "premium_base.html"]:
        return

    # Strip out the old WebGL JS
    if "// --- WebGL / GSAP Injection ---" in content:
        content = content.split("// --- WebGL / GSAP Injection ---")[0] + "\n</script>\n</body>"

    # Strip out the old WebGL CSS
    if "/* Phase 2 WebGL Foundations */" in content:
        parts = content.split("/* Phase 2 WebGL Foundations */")
        if len(parts) > 1:
            end_idx = parts[1].find("</style>")
            if end_idx != -1:
                content = parts[0] + "\n" + premium_css + "\n" + parts[1][end_idx:]

    # Inject the HTML SVG Backgrounds right after <body>
    if "<svg class=\"bg-grid\"" not in content:
        content = content.replace("<body>", f"<body>\n{premium_html}")

    # Strip existing Premium JS to ensure fresh install
    if "// --- Premium Vector / GSAP Injection ---" in content:
        content = content.split("// --- Premium Vector / GSAP Injection ---")[0] + "\n</script>\n</body>"

    # Inject the Premium GSAP JS
    content = content.replace("</body>", f"<script>\n{premium_js}\n</script>\n</body>")

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Upgraded to Premium Vector Component: {os.path.basename(filepath)}")

for filepath in glob.glob(os.path.join(html_dir, "*.html")):
    patch_file(filepath)

print("Premium Upgrade complete!")
