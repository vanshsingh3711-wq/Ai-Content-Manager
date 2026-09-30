import os

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>3D Character Engine (Mixamo FBX Driven)</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: transparent; }
        canvas { display: block; }
    </style>
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
            }
        }
    </script>
</head>
<body>
    <script type="module">
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

        let scene, camera, renderer, mixer, clock, characterModel;
        
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
        let jawBone = null;

        const vrmBones = {
            "hips": "J_Bip_C_Hips",
            "spine": "J_Bip_C_Spine",
            "spine1": "J_Bip_C_Chest",
            "spine2": "J_Bip_C_UpperChest",
            "neck": "J_Bip_C_Neck",
            "head": "J_Bip_C_Head",
            
            "leftshoulder": "J_Bip_L_Shoulder",
            "leftarm": "J_Bip_L_UpperArm",
            "leftforearm": "J_Bip_L_LowerArm",
            "lefthand": "J_Bip_L_Hand",
            
            "rightshoulder": "J_Bip_R_Shoulder",
            "rightarm": "J_Bip_R_UpperArm",
            "rightforearm": "J_Bip_R_LowerArm",
            "righthand": "J_Bip_R_Hand",
            
            "leftupleg": "J_Bip_L_UpperLeg",
            "leftleg": "J_Bip_L_LowerLeg",
            "leftfoot": "J_Bip_L_Foot",
            "lefttoebase": "J_Bip_L_ToeBase",
            
            "rightupleg": "J_Bip_R_UpperLeg",
            "rightleg": "J_Bip_R_LowerLeg",
            "rightfoot": "J_Bip_R_Foot",
            "righttoebase": "J_Bip_R_ToeBase"
        };

        function retargetClip(clip) {
            const tracks = [];
            clip.tracks.forEach(track => {
                const parts = track.name.split('.');
                const trackName = parts[0].toLowerCase().replace('mixamorig', '').replace(/[0-9]/g, '');
                const propertyName = parts[1];
                
                const vrmBoneName = vrmBones[trackName];
                if (vrmBoneName) {
                    if (propertyName === 'quaternion' || (trackName === 'hips' && propertyName === 'position')) {
                        const newTrack = track.clone();
                        newTrack.name = `${vrmBoneName}.${propertyName}`;
                        
                        if (propertyName === 'position') {
                            // FBXLoader automatically handles scale, but the raw values might still be in cm depending on export.
                            // We will scale by 0.01 just in case, this is standard for Mixamo -> Three.js
                            for(let i=0; i<newTrack.values.length; i++) {
                                newTrack.values[i] *= 0.01; 
                            }
                        }
                        tracks.push(newTrack);
                    }
                }
            });
            return new THREE.AnimationClip(clip.name, clip.duration, tracks);
        }

        window.startRecording = async (characterPlan, durationSeconds) => {
            console.log("[WebGL] Python injected the plan! Starting Recording...", characterPlan);
            window.aiPlan = characterPlan;
            window.simulationTime = 0;
            
            // Collect and preload all required FBX animations
            const requiredAnims = new Set();
            requiredAnims.add('idle');
            if (characterPlan.edits) {
                for (const edit of characterPlan.edits) {
                    if (edit.action === "character" || edit.character_action) {
                        requiredAnims.add((edit.character_action || edit.action).toLowerCase());
                    }
                }
            }
            
            const fbxLoader = new FBXLoader();
            for (const animName of requiredAnims) {
                if (!loadedAnimations[animName]) {
                    try {
                        console.log(`[WebGL] Loading FBX animation: ${animName}.fbx`);
                        const fbx = await new Promise((resolve, reject) => {
                            fbxLoader.load(`animations/${animName}.fbx`, resolve, undefined, reject);
                        });
                        
                        if (fbx.animations.length > 0) {
                            const clip = fbx.animations[0];
                            clip.name = animName;
                            const retargetedClip = retargetClip(clip);
                            loadedAnimations[animName] = mixer.clipAction(retargetedClip);
                            console.log(`[WebGL] Successfully loaded and retargeted ${animName}`);
                        }
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
                const bufferLength = window.analyser.frequencyBinCount;
                window.dataArray = new Uint8Array(bufferLength);
                
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
                console.error("[WebGL] Audio setup failed (proceeding without audio):", e);
            }

            const stream = renderer.domElement.captureStream(60);
            const options = { mimeType: 'video/webm; codecs=vp9' };
            const mediaRecorder = new MediaRecorder(stream, options);
            const recordedChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                console.log("[WebGL] Recording stopped. Preparing download...");
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'output.webm';
                a.click();
                console.log("[WebGL] Download triggered successfully.");
            };

            mediaRecorder.start();
            
            setTimeout(() => {
                mediaRecorder.stop();
            }, durationSeconds * 1000);
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
            gridHelper.position.y = -1.2;
            scene.add(gridHelper);

            const loader = new GLTFLoader();
            loader.load('anime-boy.vrm', (gltf) => {
                characterModel = gltf.scene;
                
                characterModel.scale.set(1.2, 1.2, 1.2); 
                characterModel.position.set(0, -1.2, 0);
                
                characterModel.traverse((child) => {
                    if (child.isBone) {
                        if (child.name.toLowerCase().includes('jaw')) jawBone = child;
                    }
                    if (child.isMesh && child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => { mat.transparent = false; mat.alphaTest = 0.5; mat.depthWrite = true; });
                        } else {
                            child.material.transparent = false; child.material.alphaTest = 0.5; child.material.depthWrite = true;
                        }
                    }
                });
                
                scene.add(characterModel);
                mixer = new THREE.AnimationMixer(characterModel);
                console.log("[WebGL] 3D Model Loaded Successfully!");
                
                window.isModelLoaded = true;
                if (window.onModelLoaded) window.onModelLoaded();
            }, undefined, (error) => {
                console.error("[WebGL] Error loading anime-boy.vrm:", error);
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
            
            if (window.aiPlan && characterModel) {
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
                        console.warn(`[WebGL] Animation ${targetActionName} not found. Falling back to idle.`);
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
            }
            
            if (mixer) mixer.update(delta);
            
            // Procedural Lip-Sync runs AFTER mixer to override jaw rotation
            if (jawBone) {
                jawBone.rotation.x = window.currentVolume * 0.4;
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

print("Rewrote index.html with Mixamo FBX integration!")
