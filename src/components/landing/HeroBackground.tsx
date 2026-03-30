"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener("mousemove", onMouse);

    // Initialize particles
    const count = 80 + Math.floor(Math.random() * 40); // 80-120
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 1 + Math.random() * 3,
      speed: 0.15 + Math.random() * 0.45,
      opacity: 0.1 + Math.random() * 0.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.004 + Math.random() * 0.01,
    }));

    let frame = 0;
    let animId: number;

    const draw = () => {
      // Smooth mouse lerp
      const sm = smoothMouse.current;
      const tm = mouseRef.current;
      sm.x += (tm.x - sm.x) * 0.05;
      sm.y += (tm.y - sm.y) * 0.05;

      ctx.clearRect(0, 0, w, h);

      const mx = (sm.x - 0.5) * 20;
      const my = (sm.y - 0.5) * 20;

      // 1. Central radial glow with pulse
      const pulse = 1 + Math.sin(frame * 0.008) * 0.05;
      const glowR = Math.min(w, h) * 0.6 * pulse;
      const cx = w / 2 + mx;
      const cy = h / 2 + my;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, "rgba(212,165,55,0.10)");
      glow.addColorStop(0.5, "rgba(212,165,55,0.04)");
      glow.addColorStop(1, "rgba(212,165,55,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // 2. Subtle grid lines
      ctx.strokeStyle = "rgba(212,165,55,0.04)";
      ctx.lineWidth = 0.5;
      const gs = 80;
      const ox = mx * 0.5;
      const oy = my * 0.5;
      ctx.beginPath();
      for (let x = 0; x < w + gs; x += gs) {
        ctx.moveTo(x + ox, 0);
        ctx.lineTo(x + ox, h);
      }
      for (let y = 0; y < h + gs; y += gs) {
        ctx.moveTo(0, y + oy);
        ctx.lineTo(w, y + oy);
      }
      ctx.stroke();

      // 3. Particles
      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.y -= p.speed;
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 0.3;
          if (p.y < -10) {
            p.y = h + 10;
            p.x = Math.random() * w;
          }
        }

        const px = p.x + mx * (p.size / 4);
        const py = p.y + my * (p.size / 4);
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,165,55,${p.opacity})`;
        ctx.fill();
      }

      frame++;
      animId = requestAnimationFrame(draw);
    };

    draw();
    if (prefersReducedMotion) cancelAnimationFrame(animId!);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
