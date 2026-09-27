import re

with open("index.html", "r") as f:
    html = f.read()

start_marker = "function animate() {"
end_marker = "renderer.render(scene, camera);"

new_code = """
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
                let rightElbow = null, leftElbow = null;
                let rightLeg = null, leftLeg = null, rightKnee = null, leftKnee = null, hips = null;
                
                characterModel.traverse((child) => {
                    if (child.isBone) {
                        const name = child.name.toLowerCase();
                        if (name.includes("rightarm") || name.includes("arm_r") || name === "j_bip_r_upperarm") rightArm = child;
                        if (name.includes("leftarm") || name.includes("arm_l") || name === "j_bip_l_upperarm") leftArm = child;
                        if (name.includes("rightforearm") || name.includes("lowerarm_r") || name === "j_bip_r_lowerarm") rightElbow = child;
                        if (name.includes("leftforearm") || name.includes("lowerarm_l") || name === "j_bip_l_lowerarm") leftElbow = child;
                        
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
                
                // Base resets
                characterModel.position.y += (characterModel.userData.baseY - characterModel.position.y) * 0.1;
                characterModel.position.x += (0 - characterModel.position.x) * 0.1;
                characterModel.position.z += (0 - characterModel.position.z) * 0.1;
                
                // Keep X and Z rotation clamped to 0 unless overridden
                characterModel.rotation.x += (0 - characterModel.rotation.x) * 0.1;
                characterModel.rotation.z += (0 - characterModel.rotation.z) * 0.1;
                
                if (hips) {
                    hips.position.y += (hips.userData.originalY - hips.position.y) * 0.1;
                    lerpRotation(hips, defaultPose, 0.1);
                }
                
                if (currentAction.includes("walk")) {
                    const walkSpeed = 6;
                    const vx = Math.cos(time * 1.0) * 3.0;
                    const vz = 0;
                    characterModel.position.x = Math.sin(time * 1.0) * 3.0;
                    characterModel.position.z = 0;
                    
                    // Face velocity (Native = -Z)
                    characterModel.rotation.y = Math.atan2(vx, vz) + Math.PI;
                    
                    const rLeg = Math.sin(time * walkSpeed) * 0.6;
                    const lLeg = Math.sin(time * walkSpeed + Math.PI) * 0.6;
                    
                    // Local -Z is forward. So arm swings towards -Z
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.2, -1, lLeg * 1.0), 0.3);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.2, -1, rLeg * 1.0), 0.3);
                    
                    const rElbowBend = Math.max(0.1, lLeg * 0.8);
                    const lElbowBend = Math.max(0.1, rLeg * 0.8);
                    lerpRotation(rightElbow, new THREE.Euler(0, rElbowBend, 0), 0.3);
                    lerpRotation(leftElbow, new THREE.Euler(0, -lElbowBend, 0), 0.3);
                    
                    // Leg forward is -X. So use -rLeg
                    lerpRotation(rightLeg, new THREE.Euler(-rLeg, 0, 0), 0.5);
                    lerpRotation(leftLeg, new THREE.Euler(-lLeg, 0, 0), 0.5);
                    // Knee bends back (+X). So use positive when leg is forward (negative rLeg)
                    lerpRotation(rightKnee, new THREE.Euler(Math.max(0, rLeg), 0, 0), 0.5);
                    lerpRotation(leftKnee, new THREE.Euler(Math.max(0, lLeg), 0, 0), 0.5);
                    
                    if (spine) lerpRotation(spine, new THREE.Euler(-0.1, Math.sin(time * walkSpeed) * 0.1, 0), 0.2);
                }
                else if (currentAction.includes("run")) {
                    const runSpeed = 16;
                    const radius = 4.0;
                    characterModel.position.x = Math.sin(time * 2.0) * radius;
                    characterModel.position.z = Math.cos(time * 2.0) * radius - radius;
                    
                    const vx = Math.cos(time * 2.0) * radius * 2.0;
                    const vz = -Math.sin(time * 2.0) * radius * 2.0;
                    characterModel.rotation.y = Math.atan2(vx, vz) + Math.PI;
                    
                    const rLeg = Math.sin(time * runSpeed) * 1.2;
                    const lLeg = Math.sin(time * runSpeed + Math.PI) * 1.2;
                    
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.2, -0.5, lLeg * 2.5), 0.4);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.2, -0.5, rLeg * 2.5), 0.4);
                    
                    const rElbowBend = Math.max(0.2, lLeg * 1.5);
                    const lElbowBend = Math.max(0.2, rLeg * 1.5);
                    lerpRotation(rightElbow, new THREE.Euler(0, rElbowBend, 0), 0.4);
                    lerpRotation(leftElbow, new THREE.Euler(0, -lElbowBend, 0), 0.4);
                    
                    lerpRotation(rightLeg, new THREE.Euler(-rLeg, 0, 0), 0.5);
                    lerpRotation(leftLeg, new THREE.Euler(-lLeg, 0, 0), 0.5);
                    lerpRotation(rightKnee, new THREE.Euler(Math.max(0, rLeg * 1.5), 0, 0), 0.5);
                    lerpRotation(leftKnee, new THREE.Euler(Math.max(0, lLeg * 1.5), 0, 0), 0.5);
                    
                    if (spine) lerpRotation(spine, new THREE.Euler(-0.4, Math.sin(time * runSpeed) * 0.3, 0), 0.2);
                    if (hips) hips.position.y = hips.userData.originalY + Math.abs(Math.sin(time * runSpeed)) * 0.2;
                }
                else if (currentAction.includes("fly")) {
                    characterModel.position.x = Math.sin(time * 1.5) * 5.0;
                    characterModel.position.y = characterModel.userData.baseY + 3.0 + Math.sin(time * 4) * 1.0;
                    characterModel.position.z = Math.cos(time * 1.3) * 3.0 - 3.0;
                    
                    const vx = Math.cos(time * 1.5) * 5.0 * 1.5;
                    const vz = -Math.sin(time * 1.3) * 3.0 * 1.3;
                    characterModel.rotation.y = Math.atan2(vx, vz) + Math.PI;
                    
                    // Pitch forward 90 degrees (Negative X)
                    characterModel.rotation.x = -Math.PI / 2;
                    
                    // Arms point UP (+Y) relative to body, which makes them point forward globally
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.1, 1, 0), 0.1);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.1, 1, 0), 0.1);
                    lerpRotation(rightElbow, defaultPose, 0.1);
                    lerpRotation(leftElbow, defaultPose, 0.1);
                    
                    lerpRotation(rightLeg, new THREE.Euler(0.2, 0, 0), 0.1);
                    lerpRotation(leftLeg, new THREE.Euler(0.2, 0, 0), 0.1);
                    lerpRotation(rightKnee, new THREE.Euler(0, 0, 0), 0.1);
                    lerpRotation(leftKnee, new THREE.Euler(0, 0, 0), 0.1);
                    if (spine) lerpRotation(spine, new THREE.Euler(0.5, 0, 0), 0.1); // Arch back
                }
                else if (currentAction.includes("situp")) {
                    // Face camera
                    characterModel.rotation.y = Math.PI + Math.PI/4;
                    // Lie on back (Pitch backward -> Positive X)
                    characterModel.rotation.x = Math.PI / 2;
                    
                    if (hips) hips.position.y = hips.userData.originalY - 0.8;
                    
                    const situpPhase = Math.sin(time * 4);
                    // Hips crunch forward (Negative X)
                    if (hips) lerpRotation(hips, new THREE.Euler(-Math.max(0, situpPhase * 1.2), 0, 0), 0.2);
                    if (spine) lerpRotation(spine, new THREE.Euler(-Math.max(0, situpPhase * 0.5), 0, 0), 0.2);
                    
                    // Legs bent (Thighs forward -X, Knees back +X)
                    lerpRotation(rightLeg, new THREE.Euler(-2.0, 0, 0), 0.2);
                    lerpRotation(leftLeg, new THREE.Euler(-2.0, 0, 0), 0.2);
                    lerpRotation(rightKnee, new THREE.Euler(2.5, 0, 0), 0.2);
                    lerpRotation(leftKnee, new THREE.Euler(2.5, 0, 0), 0.2);
                    
                    // Hands behind head (Arms UP +Y, Elbows bent FORWARD)
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.5, 1, 0.5), 0.2);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.5, 1, 0.5), 0.2);
                    lerpRotation(rightElbow, new THREE.Euler(0, 2.5, 0), 0.2);
                    lerpRotation(leftElbow, new THREE.Euler(0, -2.5, 0), 0.2);
                }
                else if (currentAction.includes("pushup")) {
                    characterModel.rotation.y = Math.PI - Math.PI/4;
                    // Plank (Pitch forward -> Negative X)
                    characterModel.rotation.x = -Math.PI / 2.2;
                    
                    const pushupPhase = Math.sin(time * 4);
                    const pushupDepth = Math.max(0, pushupPhase);
                    
                    characterModel.position.y = characterModel.userData.baseY + 0.6 - pushupDepth * 0.4;
                    
                    // Arms DOWN (-Y)
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.4, -1, pushupDepth * 1.2), 0.2);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.4, -1, pushupDepth * 1.2), 0.2);
                    lerpRotation(rightElbow, new THREE.Euler(0, pushupDepth * 2.0, 0), 0.2);
                    lerpRotation(leftElbow, new THREE.Euler(0, -pushupDepth * 2.0, 0), 0.2);
                    
                    lerpRotation(rightLeg, defaultPose, 0.2);
                    lerpRotation(leftLeg, defaultPose, 0.2);
                    lerpRotation(rightKnee, defaultPose, 0.2);
                    lerpRotation(leftKnee, defaultPose, 0.2);
                    if (spine) lerpRotation(spine, new THREE.Euler(0.2, 0, 0), 0.2); 
                }
                else if (currentAction.includes("squat")) {
                    characterModel.rotation.y = Math.PI - Math.PI/8;
                    
                    const squatPhase = Math.sin(time * 3);
                    const squatDepth = Math.max(0, squatPhase);
                    
                    characterModel.position.y = characterModel.userData.baseY - squatDepth * 0.6;
                    
                    // Arms FORWARD (-Z)
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.2, 0, -1), 0.2);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.2, 0, -1), 0.2);
                    lerpRotation(rightElbow, defaultPose, 0.2);
                    lerpRotation(leftElbow, defaultPose, 0.2);
                    
                    // Thighs forward (-X), Knees back (+X)
                    lerpRotation(rightLeg, new THREE.Euler(-squatDepth * 1.5, 0, 0), 0.2);
                    lerpRotation(leftLeg, new THREE.Euler(-squatDepth * 1.5, 0, 0), 0.2);
                    lerpRotation(rightKnee, new THREE.Euler(squatDepth * 2.2, 0, 0), 0.2);
                    lerpRotation(leftKnee, new THREE.Euler(squatDepth * 2.2, 0, 0), 0.2);
                    
                    // Spine leans forward (-X)
                    if (spine) lerpRotation(spine, new THREE.Euler(-squatDepth * 0.5, 0, 0), 0.2); 
                }
                else if (currentAction.includes("jump")) {
                    characterModel.rotation.y = Math.PI; 
                    
                    const jumpPhase = Math.sin(time * 8);
                    const isUp = jumpPhase > 0;
                    
                    characterModel.position.y = characterModel.userData.baseY + Math.max(0, jumpPhase) * 0.4;
                    
                    const armTargetR = isUp ? new THREE.Vector3(1, 1, 0) : new THREE.Vector3(0.2, -1, 0);
                    const armTargetL = isUp ? new THREE.Vector3(-1, 1, 0) : new THREE.Vector3(-0.2, -1, 0);
                    lerpDir(rightArm, rArmOrig, armTargetR, 0.4);
                    lerpDir(leftArm, lArmOrig, armTargetL, 0.4);
                    
                    // Spread legs (Rotate Z)
                    const legSpread = isUp ? -0.4 : 0;
                    lerpRotation(rightLeg, new THREE.Euler(0, 0, legSpread), 0.4);
                    lerpRotation(leftLeg, new THREE.Euler(0, 0, -legSpread), 0.4);
                    
                    lerpRotation(rightElbow, defaultPose, 0.3);
                    lerpRotation(leftElbow, defaultPose, 0.3);
                    lerpRotation(rightKnee, defaultPose, 0.3);
                    lerpRotation(leftKnee, defaultPose, 0.3);
                    if (spine) lerpRotation(spine, defaultPose, 0.3);
                }
                else {
                    characterModel.rotation.y += (Math.PI - characterModel.rotation.y) * 0.1;
                    
                    const rAnim = currentAction.includes("talk") ? Math.sin(time * 6) * 0.4 : 0;
                    const lAnim = currentAction.includes("talk") ? Math.sin(time * 5) * 0.4 : 0;
                    
                    lerpDir(rightArm, rArmOrig, new THREE.Vector3(0.3, -0.7 + rAnim, -0.4), 0.2);
                    lerpDir(leftArm, lArmOrig, new THREE.Vector3(-0.3, -0.7 + lAnim, -0.4), 0.2);
                    
                    lerpRotation(rightElbow, new THREE.Euler(0, 0.8 + rAnim * 0.5, 0), 0.2);
                    lerpRotation(leftElbow, new THREE.Euler(0, -0.8 - lAnim * 0.5, 0), 0.2);
                    
                    lerpRotation(rightLeg, defaultPose, 0.1);
                    lerpRotation(leftLeg, defaultPose, 0.1);
                    lerpRotation(rightKnee, defaultPose, 0.1);
                    lerpRotation(leftKnee, defaultPose, 0.1);
                    if (spine) lerpRotation(spine, new THREE.Euler(-Math.sin(time * 2) * 0.02, 0, 0), 0.1);
                }
            }
"""

start_idx = html.find(start_marker)
if start_idx == -1:
    print("Could not find start marker")
    exit(1)

html = html[:start_idx] + new_code + """
            renderer.render(scene, camera);
        }
    </script>
</body>
</html>
"""

with open("index.html", "w") as f:
    f.write(html)

print("index.html patched with flawless math successfully!")
