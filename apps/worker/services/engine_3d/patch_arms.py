import re

with open("index.html", "r") as f:
    html = f.read()

start_marker = "function lerpRotation"
end_marker = "init();"

new_code = """
        function lerpRotation(bone, targetEuler, speed = 0.1) {
            if (!bone) return;
            const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);
            bone.quaternion.slerp(targetQuat, speed);
        }
        
        function lerpDir(bone, origVec, targetVec, speed = 0.2) {
            if (!bone) return;
            const targetQuat = new THREE.Quaternion().setFromUnitVectors(origVec, targetVec.clone().normalize());
            bone.quaternion.slerp(targetQuat, speed);
        }

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
                characterModel.rotation.y = 0; 
                
                characterModel.userData.baseY = -1.2;
                characterModel.userData.baseRot = 0;
                
                characterModel.traverse((child) => {
                    if (child.isMesh && child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.transparent = false;
                                mat.alphaTest = 0.5;
                                mat.depthWrite = true;
                            });
                        } else {
                            child.material.transparent = false;
                            child.material.alphaTest = 0.5;
                            child.material.depthWrite = true;
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
            if (mixer) mixer.update(delta);
            
            if (window.analyser && window.dataArray) {
                window.analyser.getByteFrequencyData(window.dataArray);
                let sum = 0;
                for (let i = 0; i < 50; i++) sum += window.dataArray[i];
                window.currentVolume = Math.min((sum / 50) / 100, 1.0); 
            }
            
            if (window.aiPlan && characterModel) {
                window.simulationTime += delta;
                const time = window.simulationTime;
                
                let rightArm = null, leftArm = null, spine = null, jaw = null;
                let rightLeg = null, leftLeg = null, rightKnee = null, leftKnee = null, hips = null;
                
                characterModel.traverse((child) => {
                    if (child.isBone) {
                        const name = child.name.toLowerCase();
                        if (name.includes("rightarm") || name.includes("arm_r") || name === "j_bip_r_upperarm") rightArm = child;
                        if (name.includes("leftarm") || name.includes("arm_l") || name === "j_bip_l_upperarm") leftArm = child;
                        if (name.includes("spine") || name.includes("chest") || name === "j_bip_c_spine") spine = child;
                        if (name.includes("jaw")) jaw = child;
                        if (name.includes("hips") || name.includes("pelvis") || name === "j_bip_c_hips") hips = child;
                        
                        if (name.includes("rightupleg") || name.includes("upleg_r") || name === "j_bip_r_upperleg") rightLeg = child;
                        else if (name.includes("leftupleg") || name.includes("upleg_l") || name === "j_bip_l_upperleg") leftLeg = child;
                        else if (name.includes("rightleg") || name.includes("leg_r") || name.includes("rightcalf") || name === "j_bip_r_lowerleg") rightKnee = child;
                        else if (name.includes("leftleg") || name.includes("leg_l") || name.includes("leftcalf") || name === "j_bip_l_lowerleg") leftKnee = child;
                    }
                });
                
                if (hips && !hips.userData.originalY) hips.userData.originalY = hips.position.y;
                if (jaw) lerpRotation(jaw, new THREE.Euler(window.currentVolume * 0.4, 0, 0), 0.5);

                let currentAction = "idle";
                if (window.aiPlan.edits) {
                    for (const edit of window.aiPlan.edits) {
                        if (time >= edit.start && time <= edit.end) {
                            if (edit.action === "character" || edit.character_action) {
                                currentAction = (edit.character_action || edit.action).toLowerCase();
                            }
                        }
                    }
                }

                const defaultPose = new THREE.Euler(0, 0, 0);
                const rArmOrig = new THREE.Vector3(1, 0, 0);
                const lArmOrig = new THREE.Vector3(-1, 0, 0);
                
                characterModel.position.y += (characterModel.userData.baseY - characterModel.position.y) * 0.1;
                if (hips) {
                    hips.position.y += (hips.userData.originalY - hips.position.y) * 0.1;
                    lerpRotation(hips, defaultPose, 0.1);
                }
                
                if (currentAction.includes("walk")) {
                    characterModel.position.x = Math.sin(time * 1.0) * 3.0;
                    characterModel.position.z = 0;
                    characterModel.rotation.y = (Math.cos(time * 1.0) > 0 ? -Math.PI / 2 : Math.PI / 2);
                    
                    const walkSpeed = 6;
                    const rLeg = Math.sin(time * walkSpeed) * 0.6;
                    const lLeg = Math.sin(time * walkSpeed + Math.PI) * 0.6;
                    
                    // Arm swings opposite to legs using foolproof unit vectors
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.2, -1, -lLeg * 1.0), 0.3);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.2, -1, -rLeg * 1.0), 0.3);
                    
                    lerpRotation(rightLeg, new THREE.Euler(rLeg, 0, 0), 0.5);
                    lerpRotation(leftLeg, new THREE.Euler(lLeg, 0, 0), 0.5);
                    lerpRotation(rightKnee, new THREE.Euler(-Math.max(0, -rLeg), 0, 0), 0.5);
                    lerpRotation(leftKnee, new THREE.Euler(-Math.max(0, -lLeg), 0, 0), 0.5);
                    
                    if (spine) lerpRotation(spine, new THREE.Euler(0.1, Math.sin(time * walkSpeed) * 0.1, 0), 0.2);
                }
                else if (currentAction.includes("talk") || currentAction.includes("explain")) {
                    characterModel.rotation.y = 0; 
                    characterModel.position.x += (0 - characterModel.position.x) * 0.1;
                    characterModel.position.z += (0 - characterModel.position.z) * 0.1;
                    
                    const rAnim = Math.sin(time * 6) * 0.4;
                    const lAnim = Math.sin(time * 5) * 0.4;
                    
                    // Arms point slightly forward and move up/down
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.5, -0.5 + rAnim, 0.8), 0.2);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.5, -0.5 + lAnim, 0.8), 0.2);
                    
                    lerpRotation(rightLeg, defaultPose, 0.1);
                    lerpRotation(leftLeg, defaultPose, 0.1);
                    lerpRotation(rightKnee, defaultPose, 0.1);
                    lerpRotation(leftKnee, defaultPose, 0.1);
                    if (spine) lerpRotation(spine, new THREE.Euler(Math.sin(time * 2) * 0.05, 0, 0), 0.2);
                } 
                else if (currentAction.includes("run")) {
                    characterModel.position.x = Math.sin(time * 2.0) * 4.0;
                    characterModel.position.z = Math.cos(time * 2.0) * -3.0 - 2.0;
                    characterModel.rotation.y = (time * 2.0) - Math.PI/2;
                    
                    const runSpeed = 16;
                    const rLeg = Math.sin(time * runSpeed) * 1.2;
                    const lLeg = Math.sin(time * runSpeed + Math.PI) * 1.2;
                    
                    // MASSIVE ARM SWINGS
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.2, -0.5, -lLeg * 2.5), 0.4);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.2, -0.5, -rLeg * 2.5), 0.4);
                    
                    lerpRotation(rightLeg, new THREE.Euler(rLeg, 0, 0), 0.5);
                    lerpRotation(leftLeg, new THREE.Euler(lLeg, 0, 0), 0.5);
                    lerpRotation(rightKnee, new THREE.Euler(-Math.max(0, -rLeg * 1.5), 0, 0), 0.5);
                    lerpRotation(leftKnee, new THREE.Euler(-Math.max(0, -lLeg * 1.5), 0, 0), 0.5);
                    
                    // Alive upper body! Lean forward and twist shoulders against legs
                    if (spine) lerpRotation(spine, new THREE.Euler(0.4, Math.sin(time * runSpeed) * 0.3, 0), 0.2);
                    if (hips) hips.position.y = hips.userData.originalY + Math.abs(Math.sin(time * runSpeed)) * 0.2;
                }
                else if (currentAction.includes("fly")) {
                    characterModel.position.x = Math.sin(time * 1.5) * 5.0;
                    characterModel.position.y = characterModel.userData.baseY + 3.0 + Math.sin(time * 4) * 1.0;
                    characterModel.position.z = Math.cos(time * 1.3) * -3.0 - 2.0;
                    
                    characterModel.rotation.x = -Math.PI / 2.5; 
                    characterModel.rotation.y = (time * 1.5) - Math.PI/2;
                    
                    if (hips) lerpRotation(hips, defaultPose, 0.1);
                    
                    // Superman: arms point straight "up" relative to the chest
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.1, 1, 0.2), 0.1);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.1, 1, 0.2), 0.1);
                    
                    lerpRotation(rightLeg, new THREE.Euler(-0.2, 0, 0), 0.1);
                    lerpRotation(leftLeg, new THREE.Euler(-0.2, 0, 0), 0.1);
                    lerpRotation(rightKnee, new THREE.Euler(0, 0, 0), 0.1);
                    lerpRotation(leftKnee, new THREE.Euler(0, 0, 0), 0.1);
                    if (spine) lerpRotation(spine, new THREE.Euler(-0.5, 0, 0), 0.1); 
                }
                else {
                    characterModel.rotation.x += (0 - characterModel.rotation.x) * 0.1;
                    characterModel.rotation.y += (characterModel.userData.baseRot - characterModel.rotation.y) * 0.1;
                    characterModel.position.x += (0 - characterModel.position.x) * 0.1;
                    characterModel.position.z += (0 - characterModel.position.z) * 0.1;
                    
                    // Idle arms straight down
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.1, -1, 0), 0.1);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.1, -1, 0), 0.1);
                    
                    lerpRotation(rightLeg, defaultPose, 0.1);
                    lerpRotation(leftLeg, defaultPose, 0.1);
                    lerpRotation(rightKnee, defaultPose, 0.1);
                    lerpRotation(leftKnee, defaultPose, 0.1);
                    if (spine) lerpRotation(spine, new THREE.Euler(Math.sin(time * 2) * 0.02, 0, 0), 0.1);
                }
            }
            renderer.render(scene, camera);
        }
"""

start_idx = html.find(start_marker)
if start_idx == -1:
    print("Could not find start marker")
    exit(1)

html = html[:start_idx] + new_code + """
        init();
    </script>
</body>
</html>
"""

with open("index.html", "w") as f:
    f.write(html)

print("index.html patched with FOOLPROOF vector math successfully!")
