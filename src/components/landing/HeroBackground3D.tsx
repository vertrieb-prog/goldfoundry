"use client";

import { useEffect, useRef } from "react";

function goldBarPoints(cx: number, cy: number, w: number, h: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const topW = w * 0.75;
  const topInset = (w - topW) / 2;
  for (let r = 0; r < 12; r++) {
    const pct = r / 11;
    const rowW = w - topInset * 2 * (1 - pct);
    const startX = cx - rowW / 2;
    for (let c = 0; c < 18; c++) {
      pts.push({
        x: startX + (c / 17) * rowW + (Math.random() - 0.5) * 3,
        y: cy - h / 2 + pct * h + (Math.random() - 0.5) * 2,
      });
    }
  }
  return pts;
}

export default function HeroBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let mouse = { x: -999, y: -999 };
    let scrollPct = 0;
    let time = 0;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; buildTargets(); };
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener("scroll", () => { const m = document.documentElement.scrollHeight - H; scrollPct = m > 0 ? Math.min(1, window.scrollY / m) : 0; });

    // === PARTICLES ===
    type P = { x: number; y: number; homeX: number; homeY: number; barX: number; barY: number; r: number; baseR: number; a: number; vx: number; vy: number; pulse: number; layer: number; shimmer: number };
    let particles: P[] = [];
    let barTargets: { x: number; y: number }[] = [];

    function buildTargets() {
      barTargets = [];
      if (W < 600) { barTargets.push(...goldBarPoints(W / 2, H * 0.45, W * 0.5, H * 0.25)); }
      else {
        const bw = W * 0.13, bh = H * 0.18, y = H * 0.45;
        barTargets.push(...goldBarPoints(W * 0.3, y, bw, bh), ...goldBarPoints(W * 0.5, y - 15, bw * 1.15, bh * 1.1), ...goldBarPoints(W * 0.7, y + 5, bw, bh));
      }
      if (!particles.length) {
        for (let i = 0; i < 350; i++) {
          const layer = i < 200 ? 0 : i < 300 ? 1 : 2;
          const t = barTargets[i % barTargets.length];
          particles.push({ x: Math.random() * W, y: Math.random() * H, homeX: Math.random() * W, homeY: Math.random() * H, barX: t?.x ?? W / 2, barY: t?.y ?? H / 2, r: [1, 2, 3.5][layer] + Math.random() * [1, 2, 3][layer], baseR: [1, 2, 3.5][layer] + Math.random() * [1, 2, 3][layer], a: 0.1 + Math.random() * 0.4, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.3 - 0.1, pulse: Math.random() * Math.PI * 2, layer, shimmer: Math.random() * Math.PI * 2 });
        }
      } else { for (let i = 0; i < particles.length; i++) { const t = barTargets[i % barTargets.length]; if (t) { particles[i].barX = t.x; particles[i].barY = t.y; } } }
    }
    resize();

    // === SHOOTING STARS ===
    type Star = { x: number; y: number; vx: number; vy: number; life: number; max: number; w: number };
    let stars: Star[] = [];

    // === RINGS (expanding golden waves) ===
    type Ring = { x: number; y: number; r: number; maxR: number; life: number; speed: number };
    let rings: Ring[] = [];

    // === FLARES ===
    type Flare = { x: number; y: number; r: number; life: number; max: number };
    let flares: Flare[] = [];

    // === CHART LINES (trading candlestick background) ===
    type ChartLine = { points: number[]; x: number; w: number; y: number; h: number; progress: number; speed: number; color: string };
    let charts: ChartLine[] = [];
    function makeChart(): ChartLine {
      const pts: number[] = [];
      const len = 30 + Math.floor(Math.random() * 40);
      let val = 0.5;
      for (let i = 0; i < len; i++) { val += (Math.random() - 0.48) * 0.08; val = Math.max(0.1, Math.min(0.9, val)); pts.push(val); }
      return { points: pts, x: Math.random() * W * 0.8 + W * 0.1, w: 100 + Math.random() * 200, y: Math.random() * H * 0.6 + H * 0.2, h: 30 + Math.random() * 60, progress: 0, speed: 0.003 + Math.random() * 0.005, color: Math.random() > 0.5 ? "34, 197, 94" : "212, 165, 55" };
    }
    for (let i = 0; i < 4; i++) charts.push(makeChart());

    // === MATRIX NUMBERS ===
    type Digit = { x: number; y: number; char: string; speed: number; a: number; size: number };
    let digits: Digit[] = [];
    const TICKER_CHARS = "0123456789.$+-XAUUSD%".split("");
    for (let i = 0; i < 50; i++) {
      digits.push({ x: Math.random() * W, y: Math.random() * H, char: TICKER_CHARS[Math.floor(Math.random() * TICKER_CHARS.length)], speed: 0.3 + Math.random() * 0.8, a: 0.03 + Math.random() * 0.06, size: 9 + Math.random() * 5 });
    }

    const animate = () => {
      time += 0.016;
      ctx.clearRect(0, 0, W, H);
      const morph = Math.min(1, scrollPct * 3);
      const eased = morph < 0.5 ? 2 * morph * morph : 1 - Math.pow(-2 * morph + 2, 2) / 2;
      const intensity = 0.3 + scrollPct * 0.7;

      // === BG GLOW ===
      const cx = W / 2, cy = H * 0.4;
      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.5);
      g1.addColorStop(0, `rgba(212,165,55,${0.04 + eased * 0.1})`);
      g1.addColorStop(0.5, `rgba(212,165,55,${0.01 + eased * 0.03})`);
      g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      if (eased > 0.3) {
        const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.25);
        g2.addColorStop(0, `rgba(250,239,112,${(eased - 0.3) * 0.1})`);
        g2.addColorStop(1, "rgba(250,239,112,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, W, H);
      }

      // === MATRIX FALLING NUMBERS ===
      ctx.font = "10px 'JetBrains Mono', monospace";
      for (const d of digits) {
        d.y += d.speed * (1 + intensity);
        if (d.y > H + 20) { d.y = -20; d.x = Math.random() * W; d.char = TICKER_CHARS[Math.floor(Math.random() * TICKER_CHARS.length)]; }
        ctx.fillStyle = `rgba(212,165,55,${d.a * intensity})`;
        ctx.font = `${d.size}px 'JetBrains Mono', monospace`;
        ctx.fillText(d.char, d.x, d.y);
      }

      // === CHART LINES ===
      for (let ci = 0; ci < charts.length; ci++) {
        const c = charts[ci];
        c.progress += c.speed;
        if (c.progress > 1.3) { charts[ci] = makeChart(); continue; }
        const drawPts = Math.floor(c.points.length * Math.min(1, c.progress));
        if (drawPts < 2) continue;
        ctx.beginPath();
        for (let i = 0; i < drawPts; i++) {
          const px = c.x + (i / c.points.length) * c.w;
          const py = c.y + (1 - c.points[i]) * c.h;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        const fadeOut = c.progress > 1 ? 1 - (c.progress - 1) / 0.3 : 1;
        ctx.strokeStyle = `rgba(${c.color},${0.06 * intensity * fadeOut})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Candle marks
        for (let i = 0; i < drawPts; i += 3) {
          const px = c.x + (i / c.points.length) * c.w;
          const py = c.y + (1 - c.points[i]) * c.h;
          const up = i > 0 && c.points[i] > c.points[i - 1];
          ctx.fillStyle = `rgba(${up ? "34,197,94" : "239,68,68"},${0.08 * intensity * fadeOut})`;
          ctx.fillRect(px - 1.5, py - 4, 3, 8);
        }
      }

      // === EXPANDING RINGS ===
      if (Math.random() < 0.008 * intensity) {
        rings.push({ x: W * 0.2 + Math.random() * W * 0.6, y: H * 0.2 + Math.random() * H * 0.6, r: 0, maxR: 80 + Math.random() * 150 * intensity, life: 0, speed: 0.5 + Math.random() * 1.5 });
      }
      rings = rings.filter(ring => {
        ring.r += ring.speed;
        ring.life++;
        const progress = ring.r / ring.maxR;
        if (progress > 1) return false;
        const alpha = (1 - progress) * 0.12 * intensity;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212,165,55,${alpha})`;
        ctx.lineWidth = 1.5 * (1 - progress);
        ctx.stroke();
        return true;
      });

      // === BAR GHOST OUTLINES ===
      if (eased > 0.2 && eased < 0.95) {
        ctx.save();
        ctx.globalAlpha = (eased - 0.2) * 0.12;
        const bars = W < 600 ? [{ x: W / 2, y: H * 0.45, w: W * 0.5, h: H * 0.25 }] : [{ x: W * 0.3, y: H * 0.45, w: W * 0.13, h: H * 0.18 }, { x: W * 0.5, y: H * 0.43, w: W * 0.15, h: H * 0.2 }, { x: W * 0.7, y: H * 0.455, w: W * 0.13, h: H * 0.18 }];
        for (const b of bars) {
          const tw = b.w * 0.75;
          ctx.beginPath();
          ctx.moveTo(b.x - tw / 2, b.y - b.h / 2);
          ctx.lineTo(b.x + tw / 2, b.y - b.h / 2);
          ctx.lineTo(b.x + b.w / 2, b.y + b.h / 2);
          ctx.lineTo(b.x - b.w / 2, b.y + b.h / 2);
          ctx.closePath();
          ctx.strokeStyle = "rgba(212,165,55,0.25)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // === PARTICLE CONNECTIONS ===
      for (let i = 0; i < particles.length; i += 4) {
        if (particles[i].layer === 0) continue;
        for (let j = i + 4; j < particles.length; j += 4) {
          if (particles[j].layer === 0) continue;
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212,165,55,${(1 - dist / 100) * 0.04 * (1 + eased)})`;
            ctx.lineWidth = 0.4; ctx.stroke();
          }
        }
      }

      // === PARTICLES (gold dust → gold bars) ===
      for (const p of particles) {
        p.pulse += 0.015 + p.layer * 0.01;
        p.shimmer += 0.03;
        p.homeX += p.vx; p.homeY += p.vy;
        if (p.homeX < -20) p.homeX = W + 20; if (p.homeX > W + 20) p.homeX = -20;
        if (p.homeY < -20) p.homeY = H + 20; if (p.homeY > H + 20) p.homeY = -20;

        const tx = p.homeX * (1 - eased) + p.barX * eased;
        const ty = p.homeY * (1 - eased) + p.barY * eased;
        p.x += (tx - p.x) * 0.06;
        p.y += (ty - p.y) * 0.06;

        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const mD = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mD < 120) { const f = (1 - mD / 120) * 3; p.x += (mdx / mD) * f; p.y += (mdy / mD) * f; }

        p.r = p.baseR * (1 + eased * 0.3);
        let alpha = Math.max(0.05, p.a + Math.sin(p.pulse) * 0.1 + (eased > 0.5 ? Math.sin(p.shimmer) * 0.2 * eased : 0)) * (0.5 + eased * 0.5);
        const formed = eased > 0.7;
        const gR = formed ? 250 : 212, gG = formed ? 239 : 165, gB = formed ? 112 : 55;

        if (p.layer === 2) {
          const hr = p.r * (3 + eased * 3);
          const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, hr);
          gl.addColorStop(0, `rgba(${gR},${gG},${gB},${alpha * 0.3})`);
          gl.addColorStop(1, `rgba(${gR},${gG},${gB},0)`);
          ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, hr, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${gR},${gG},${gB},${alpha})`; ctx.fill();
      }

      // === SHOOTING STARS ===
      if (Math.random() < 0.015 * intensity) {
        const fromLeft = Math.random() > 0.3;
        stars.push({ x: fromLeft ? -10 : W + 10, y: Math.random() * H * 0.7, vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 10), vy: -1 + Math.random() * 2, life: 0, max: 40 + Math.random() * 50, w: 1 + Math.random() * 1.5 });
      }
      stars = stars.filter(s => {
        s.x += s.vx; s.y += s.vy; s.life++;
        if (s.life > s.max) return false;
        const p = s.life / s.max;
        const a = Math.min(1, p * 4) * Math.max(0, 1 - (p - 0.6) / 0.4) * 0.7 * intensity;
        const len = 25 + intensity * 35;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - (s.vx / Math.abs(s.vx)) * len, s.y);
        grad.addColorStop(0, `rgba(250,239,112,${a})`);
        grad.addColorStop(1, "rgba(250,239,112,0)");
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - (s.vx / Math.abs(s.vx)) * len, s.y - s.vy * 0.5);
        ctx.strokeStyle = grad; ctx.lineWidth = s.w; ctx.stroke();
        // Head glow
        ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250,239,112,${a * 0.8})`; ctx.fill();
        return true;
      });

      // === FLARES ===
      if (Math.random() < 0.005 * intensity) {
        flares.push({ x: Math.random() * W, y: Math.random() * H, r: 0, life: 0, max: 30 + Math.random() * 40 });
      }
      flares = flares.filter(f => {
        f.life++; f.r = (f.life / f.max) * (20 + intensity * 30);
        if (f.life > f.max) return false;
        const a = (1 - f.life / f.max) * 0.15 * intensity;
        const gl = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
        gl.addColorStop(0, `rgba(250,239,112,${a})`);
        gl.addColorStop(0.3, `rgba(212,165,55,${a * 0.5})`);
        gl.addColorStop(1, "rgba(212,165,55,0)");
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
        return true;
      });

      // === SHIMMER SWEEP on formed bars ===
      if (eased > 0.8) {
        const sx = (W * 0.15) + ((time * 100) % (W * 0.7));
        const a = (eased - 0.8) * 0.5;
        const g = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
        g.addColorStop(0, "rgba(250,239,112,0)");
        g.addColorStop(0.5, `rgba(250,239,112,${a * 0.2})`);
        g.addColorStop(1, "rgba(250,239,112,0)");
        ctx.fillStyle = g; ctx.fillRect(sx - 40, H * 0.25, 80, H * 0.4);
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}
