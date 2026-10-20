import os
import glob

html_dir = "apps/worker/services/motion_html"

webgl_css = """
    /* Phase 2 WebGL Foundations */
    body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background-color: transparent !important;
      background: transparent !important;
    }
    #webgl-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1; /* Behind existing UI elements */
    }
"""

webgl_scripts = """
  <!-- Load Three.js and GSAP -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
"""

webgl_js_injection = """
    // --- WebGL / GSAP Injection ---
    const canvas = document.createElement('canvas');
    canvas.id = 'webgl-canvas';
    document.body.prepend(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 1000;

    // Fluid Background Shader
    const bgVertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
    const bgFragmentShader = `
      uniform float uTime;
      varying vec2 vUv;
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865, 0.366025404, -0.577350269, 0.0243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      void main() {
        vec2 uv = vUv; float t = uTime * 0.3;
        float n1 = snoise(uv * 1.5 + vec2(t * 0.5, t * 0.2)); float n2 = snoise(uv * 3.0 - vec2(t * 0.3, t * 0.4));
        vec3 colorDark = vec3(0.04, 0.06, 0.10); vec3 colorMid = vec3(0.10, 0.12, 0.21); vec3 colorGlow = vec3(0.15, 0.11, 0.25);
        float mixVal = smoothstep(-0.8, 0.8, n1 + n2 * 0.5); vec3 finalColor = mix(colorDark, colorMid, mixVal);
        float dist = distance(uv, vec2(0.5)); finalColor = mix(finalColor, colorGlow, (1.0 - dist) * 0.3 * (n2 * 0.5 + 0.5));
        finalColor = mix(finalColor, vec3(0.0), dist * 0.5);
        float grain = fract(sin(dot(uv.xy + t, vec2(12.9898,78.233))) * 43758.5453); finalColor += (grain - 0.5) * 0.02;
        gl_FragColor = vec4(finalColor, 0.95);
      }
    `;
    const bgGeometry = new THREE.PlaneGeometry(window.innerWidth * 2, window.innerHeight * 2);
    const bgUniforms = { uTime: { value: 0.0 } };
    const bgMaterial = new THREE.ShaderMaterial({ vertexShader: bgVertexShader, fragmentShader: bgFragmentShader, uniforms: bgUniforms, depthWrite: false, transparent: true });
    const backgroundPlane = new THREE.Mesh(bgGeometry, bgMaterial);
    backgroundPlane.position.z = -1000;
    scene.add(backgroundPlane);

    // Override injectData and renderFrame to wrap the old calls and update WebGL
    const originalInjectData = window.injectData;
    window.injectData = (targets, keyframesJson) => {
        if (originalInjectData) originalInjectData(targets, keyframesJson);
        // Map DOM elements to GSAP (simple bounce)
        setTimeout(() => {
            document.querySelectorAll('.card, .container, .window').forEach(el => {
                gsap.fromTo(el, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.5, ease: "elastic.out(1, 0.5)" });
            });
            document.querySelectorAll('h1, h2, #quote, #metric').forEach(el => {
                gsap.fromTo(el, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 });
            });
        }, 100);
    };

    const originalRenderFrame = window.renderFrame;
    window.renderFrame = (frame) => {
        const time = frame / 30.0;
        bgUniforms.uTime.value = time;
        renderer.render(scene, camera);
        if (originalRenderFrame) originalRenderFrame(frame);
    };
"""

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    if "Three.js" not in content:
        content = content.replace("</head>", webgl_scripts + "\n</head>")
        content = content.replace("<style>", "<style>\n" + webgl_css)
        content = content.replace("</body>", "<script>\n" + webgl_js_injection + "\n</script>\n</body>")

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Upgraded to WebGL Engine: {os.path.basename(filepath)}")

for filepath in glob.glob(os.path.join(html_dir, "*.html")):
    if os.path.basename(filepath) not in ["opus_webgl_base.html"]:
        patch_file(filepath)

print("WebGL Upgrade complete!")
