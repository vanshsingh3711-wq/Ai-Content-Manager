import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { mixamoVRMRigMap } from './mixamoVRMRigMap.js';

export function loadMixamoAnimation(url, vrm) {
    const loader = new FBXLoader();
    return loader.loadAsync(url).then((asset) => {
        const clip = THREE.AnimationClip.findByName(asset.animations, 'mixamo.com');
        if (!clip) throw new Error("Could not find 'mixamo.com' animation clip in FBX");

        const tracks = [];
        const restRotationInverse = new THREE.Quaternion();
        const parentRestWorldRotation = new THREE.Quaternion();
        const _quatA = new THREE.Quaternion();

        const mixamoHips = asset.getObjectByName('mixamorigHips');
        const motionHipsHeight = mixamoHips ? mixamoHips.position.y : 1.0;
        const vrmHipsHeight = vrm.humanoid.normalizedRestPose.hips.position[1];
        const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

        clip.tracks.forEach(track => {
            const parts = track.name.split('.');
            let mixamoRigName = parts[0];
            if (!mixamoRigName.startsWith('mixamorig')) {
                mixamoRigName = 'mixamorig' + mixamoRigName.charAt(0).toUpperCase() + mixamoRigName.slice(1);
            }

            const propertyName = parts[1];
            const vrmBoneName = mixamoVRMRigMap[mixamoRigName];
            const mixamoRigNode = asset.getObjectByName(mixamoRigName);

            if (!vrmBoneName || !mixamoRigNode) return;

            const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName);
            if (vrmNode != null) {
                const vrmNodeName = vrmNode.name;

                mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
                if (mixamoRigNode.parent) {
                    mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);
                } else {
                    parentRestWorldRotation.identity();
                }

                if (track instanceof THREE.QuaternionKeyframeTrack || propertyName === 'quaternion') {
                    for (let i = 0; i < track.values.length; i += 4) {
                        const flatQuaternion = track.values.slice(i, i + 4);
                        _quatA.fromArray(flatQuaternion);
                        _quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
                        _quatA.toArray(flatQuaternion);
                        track.values[i] = flatQuaternion[0];
                        track.values[i+1] = flatQuaternion[1];
                        track.values[i+2] = flatQuaternion[2];
                        track.values[i+3] = flatQuaternion[3];
                    }

                    const values = track.values.map((v, i) => {
                        return (vrm.meta?.metaVersion === '0' && i % 2 === 0 ? -v : v);
                    });
                    tracks.push(new THREE.QuaternionKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, values));
                } else if ((track instanceof THREE.VectorKeyframeTrack || propertyName === 'position') && mixamoRigName === 'mixamorigHips') {
                    const values = track.values.map((v, i) => {
                        return (vrm.meta?.metaVersion === '0' && i % 3 !== 1 ? -v : v) * hipsPositionScale;
                    });
                    tracks.push(new THREE.VectorKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, values));
                }
            }
        });

        return new THREE.AnimationClip('vrmAnimation', clip.duration, tracks);
    });
}