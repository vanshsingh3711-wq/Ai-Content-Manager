"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeCanvasHero() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 600;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. 3D Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const violetLight = new THREE.PointLight(0x9333ea, 4, 30);
    violetLight.position.set(4, 3, 4);
    scene.add(violetLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 4, 30);
    cyanLight.position.set(-4, -2, 3);
    scene.add(cyanLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(0, 5, 6);
    scene.add(dirLight);

    // 3. Central 3D Gyroscopic Aperture & Film Ribbons
    const group = new THREE.Group();
    scene.add(group);

    // Core 3D Torus Knot (Sculpted Metallic Film Ribbon)
    const knotGeo = new THREE.TorusKnotGeometry(1.4, 0.28, 128, 32, 2, 3);
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: 0x18122B,
      emissive: 0x4c1d95,
      emissiveIntensity: 0.35,
      roughness: 0.12,
      metalness: 0.88,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    });
    const knotMesh = new THREE.Mesh(knotGeo, knotMat);
    group.add(knotMesh);

    // Outer Ring: Neon Violet Gimbal Ring
    const ring1Geo = new THREE.TorusGeometry(2.3, 0.025, 16, 120);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    group.add(ring1);

    // Middle Ring: Neon Cyan Gimbal Ring
    const ring2Geo = new THREE.TorusGeometry(2.0, 0.025, 16, 120);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    group.add(ring2);

    // Inner Ring: Fuchsia Gimbal Ring
    const ring3Geo = new THREE.TorusGeometry(1.7, 0.02, 16, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xec4899,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 3;
    group.add(ring3);

    // 4. Swirling 3D Cosmic Particle Nebula
    const particleCount = 1200;
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);

    const cViolet = new THREE.Color(0xa855f7);
    const cCyan = new THREE.Color(0x38bdf8);
    const cWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < particleCount; i++) {
      // Sphere shell distribution
      const r = THREE.MathUtils.randFloat(2.0, 5.5);
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = THREE.MathUtils.randFloat(0, Math.PI);

      posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      posArray[i * 3 + 2] = r * Math.cos(phi);

      const mix = Math.random();
      const color = mix < 0.45 ? cViolet : mix < 0.8 ? cCyan : cWhite;
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // 5. Interactive Drag & Mouse Physics
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotationX = 0.2;
    let targetRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        velY = deltaX * 0.005;
        velX = deltaY * 0.005;
        targetRotationY += velY;
        targetRotationX += velX;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        // Subtle mouse hover tracking
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = -(e.clientY / window.innerHeight) * 2 + 1;
        camera.position.x += (normX * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (normY * 0.4 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Touch support for mobile devices
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevMouseX;
        const deltaY = e.touches[0].clientY - prevMouseY;
        velY = deltaX * 0.006;
        velX = deltaY * 0.006;
        targetRotationY += velY;
        targetRotationX += velX;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // 6. Responsive Resize Handling
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || 600;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", handleResize);

    // 7. Animation Loop
    let animId: number;
    let clock = 0;

    const animate = () => {
      clock += 0.015;

      // Inertia & Auto-spin
      if (!isDragging) {
        velX *= 0.95;
        velY *= 0.95;
        targetRotationY += 0.0035 + velY;
        targetRotationX += velX;
      }

      group.rotation.x += (targetRotationX - group.rotation.x) * 0.1;
      group.rotation.y += (targetRotationY - group.rotation.y) * 0.1;

      // Opposite ring rotations
      ring1.rotation.z += 0.008;
      ring2.rotation.x -= 0.006;
      ring3.rotation.y += 0.009;

      // Swirling nebula particles
      particles.rotation.y -= 0.0012;
      particles.rotation.x += 0.0006;

      // Orbiting dynamic lights
      violetLight.position.x = Math.sin(clock * 0.8) * 5;
      violetLight.position.z = Math.cos(clock * 0.8) * 5;
      cyanLight.position.x = -Math.cos(clock * 0.7) * 5;
      cyanLight.position.z = -Math.sin(clock * 0.7) * 5;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // 8. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", handleResize);

      knotGeo.dispose();
      knotMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing select-none"
      title="Click and drag to rotate the 3D scene"
    />
  );
}
