import os

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>3D Character Engine (Pixiv three-vrm FBX Retargeting)</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: transparent; }
        canvas { display: block; }
    </style>
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/",
                "@pixiv/three-vrm": "https://unpkg.com/@pixiv/three-vrm@3.0.0/lib/three-vrm.module.js"
            }
        }
    </script>
</head>
<body>
    <script type="module">
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { VRMLoaderPlugin } from '@pixiv/three-vrm';
        import { loadMixamoAnimation } from './loadMixamoAnimation.js';

        let scene, camera, renderer, mixer, clock;
        let currentVrm = null;
        
        window.isModelLoaded = false;
        window.aiPlan = null;
        window.simulationTime = 0;
        
        window.audioContext = null;
        window.audioSource = null;
        window.analyser = null;
        window.dataArray = null;
        window.currentVolume = 0;

        const loadedAnimations = {};
        let activeAction = null;
        let activeActionName = "";

        window.startRecording = async (characterPlan, durationSeconds) => {
            console.log("[WebGL] Python injected the plan! Starting Recording...", characterPlan);
            window.aiPlan = characterPlan;
            window.simulationTime = 0;
            
            // Preload required animations
            const requiredAnims = new Set();
            requiredAnims.add('idle');
            if (characterPlan.edits) {
                for (const edit of characterPlan.edits) {
                    if (edit.action === "character" || edit.character_action) {
                        requiredAnims.add((edit.character_action || edit.action).toLowerCase());
                    }
                }
            }
            
            for (const animName of requiredAnims) {
                if (!loadedAnimations[animName]) {
                    try {
                        console.log(`[WebGL] Loading Mixamo animation: ${animName}.fbx`);
                        const retargetedClip = await loadMixamoAnimation(`animations/${animName}.fbx`, currentVrm);
                        loadedAnimations[animName] = mixer.clipAction(retargetedClip);
                        console.log(`[WebGL] Successfully loaded and retargeted ${animName}`);
                    } catch (e) {
                        console.error(`[WebGL] Failed to load animation: ${animName}.fbx. Will fallback to idle.`, e);
                    }
                }
            }
            
            // Start default idle
            if (loadedAnimations['idle']) {
                activeAction = loadedAnimations['idle'];
                activeActionName = 'idle';
                activeAction.play();
            }
            
            try {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                window.analyser = window.audioContext.createAnalyser();
                window.analyser.fftSize = 256;
                window.dataArray = new Uint8Array(window.analyser.frequencyBinCount);
                
                const response = await fetch('audio.mp3');
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await window.audioContext.decodeAudioData(arrayBuffer);
                    const source = window.audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(window.analyser);
                    window.analyser.connect(window.audioContext.destination);
                    source.start(0);
                    console.log("[WebGL] Lip-Sync Audio Engine Started!");
                }
            } catch (e) {
                console.error("[WebGL] Audio setup failed:", e);
            }

            const stream = renderer.domElement.captureStream(60);
            const options = { mimeType: 'video/webm; codecs=vp9' };
            const mediaRecorder = new MediaRecorder(stream, options);
            const recordedChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                console.log("[WebGL] Recording stopped. Preparing download...");
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'output.webm';
                a.click();
                console.log("[WebGL] Download triggered successfully.");
            };

            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), durationSeconds * 1000);
        };

        function init() {
            clock = new THREE.Clock();
            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, 1.2, 5.0); 
            camera.lookAt(0, 0.8, 0);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x333333, 1); 
            document.body.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 4.0);
            directionalLight.position.set(1, 2, 3);
            scene.add(directionalLight);

            const gridHelper = new THREE.GridHelper(50, 50, 0xffffff, 0x555555);
            gridHelper.position.y = 0;
            scene.add(gridHelper);

            const loader = new GLTFLoader();
            loader.register((parser) => {
                return new VRMLoaderPlugin(parser);
            });
            
            loader.load('anime-boy.vrm', (gltf) => {
                const vrm = gltf.userData.vrm;
                currentVrm = vrm;
                scene.add(vrm.scene);
                
                // Rotate to face camera
                vrm.scene.rotation.y = Math.PI;
                
                mixer = new THREE.AnimationMixer(vrm.scene);
                console.log("[WebGL] VRM Model Loaded Successfully!");
                
                window.isModelLoaded = true;
                if (window.onModelLoaded) window.onModelLoaded();
            }, undefined, (error) => {
                console.error("[WebGL] Error loading VRM:", error);
            });

            animate();
        }

        function animate() {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            
            if (window.analyser && window.dataArray) {
                window.analyser.getByteFrequencyData(window.dataArray);
                let sum = 0;
                for (let i = 0; i < 50; i++) sum += window.dataArray[i];
                window.currentVolume = Math.min((sum / 50) / 100, 1.0); 
            }
            
            if (window.aiPlan && currentVrm) {
                window.simulationTime += delta;
                const time = window.simulationTime;
                
                let targetActionName = "idle";
                if (window.aiPlan.edits) {
                    for (const edit of window.aiPlan.edits) {
                        if (time >= edit.start && time <= edit.end) {
                            if (edit.action === "character" || edit.character_action) {
                                targetActionName = (edit.character_action || edit.action).toLowerCase();
                            }
                        }
                    }
                }
                
                if (targetActionName !== activeActionName) {
                    let newAction = loadedAnimations[targetActionName];
                    if (!newAction) {
                        newAction = loadedAnimations['idle'];
                        targetActionName = 'idle';
                    }
                    
                    if (newAction && newAction !== activeAction) {
                        newAction.reset();
                        newAction.play();
                        if (activeAction) {
                            newAction.crossFadeFrom(activeAction, 0.5, true);
                        }
                        activeAction = newAction;
                        activeActionName = targetActionName;
                    }
                }
                
                // Let Mixamo FBX control the body
                if (mixer) mixer.update(delta);
                
                // Let Procedural code control the Jaw (Lip-Sync!)
                if (currentVrm.humanoid) {
                    const jawNode = currentVrm.humanoid.getNormalizedBoneNode('jaw');
                    if (jawNode) {
                        jawNode.rotation.x = window.currentVolume * 0.4;
                    }
                }
                
                if (currentVrm.update) currentVrm.update(delta);
            }
            
            renderer.render(scene, camera);
        }

        init();
    </script>
</body>
</html>
"""

with open("index.html", "w") as f:
    f.write(html_content)

print("Rewrote index.html to use official @pixiv/three-vrm Mixamo Retargeting!")
