"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function GoldScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Gold Particles
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
      velocities[i * 3] = (Math.random() - 0.5) * 0.002;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
      sizes[i] = Math.random() * 3 + 0.5;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0xfaef70) },
        uColor2: { value: new THREE.Color(0xd4a537) },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute float size;
        varying float vAlpha;
        void main() {
          vec3 pos = position;
          pos.x += sin(uTime * 0.3 + position.y * 0.5) * 0.3;
          pos.y += cos(uTime * 0.2 + position.x * 0.5) * 0.3;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (4.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = smoothstep(0.0, 0.5, size / 3.5) * (1.0 - smoothstep(8.0, 15.0, -mvPosition.z));
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = 1.0 - smoothstep(0.0, 0.5, d);
          vec3 color = mix(uColor1, uColor2, glow);
          gl_FragColor = vec4(color, glow * vAlpha * 0.6);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Central Icosahedron (gold wireframe)
    const icoGeometry = new THREE.IcosahedronGeometry(1.8, 1);
    const icoMaterial = new THREE.MeshBasicMaterial({
      color: 0xfaef70,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const ico = new THREE.Mesh(icoGeometry, icoMaterial);
    scene.add(ico);

    // Inner solid icosahedron
    const icoInnerGeometry = new THREE.IcosahedronGeometry(1.6, 4);
    const icoInnerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x09090b,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0xfaef70,
      emissiveIntensity: 0.02,
      clearcoat: 1.0,
    });
    const icoInner = new THREE.Mesh(icoInnerGeometry, icoInnerMaterial);
    scene.add(icoInner);

    // Lights
    const light1 = new THREE.PointLight(0xfaef70, 200);
    light1.position.set(4, 3, 4);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xd4a537, 150);
    light2.position.set(-4, -2, 3);
    scene.add(light2);

    const ambient = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambient);

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // Animation
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      particleMaterial.uniforms.uTime.value = t;

      // Rotate objects
      ico.rotation.y = t * 0.08 + mouseX * 0.3;
      ico.rotation.x = t * 0.05 + mouseY * 0.2;
      icoInner.rotation.y = t * 0.06 + mouseX * 0.2;
      icoInner.rotation.x = t * 0.04 + mouseY * 0.15;

      // Breathe wireframe
      const scale = 1 + Math.sin(t * 1.5) * 0.03;
      ico.scale.set(scale, scale, scale);

      // Move particles
      const pos = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += velocities[i * 3];
        pos[i * 3 + 1] += velocities[i * 3 + 1];
        pos[i * 3 + 2] += velocities[i * 3 + 2];
        // Wrap around
        if (Math.abs(pos[i * 3]) > 10) velocities[i * 3] *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 10) velocities[i * 3 + 1] *= -1;
        if (Math.abs(pos[i * 3 + 2]) > 7.5) velocities[i * 3 + 2] *= -1;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Lights orbit
      light1.position.x = Math.sin(t * 0.5) * 5;
      light1.position.y = Math.cos(t * 0.3) * 4;
      light2.position.x = Math.cos(t * 0.4) * 5;
      light2.position.z = Math.sin(t * 0.6) * 4;

      // Camera subtle movement
      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-0" />;
}
