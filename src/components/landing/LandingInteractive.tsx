"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { COUPON_CODES } from "@/lib/config";

/* ── Counter Animation ──────────────────────────────────── */
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          let start = 0;
          const duration = 2000;
          const startTime = performance.now();

          function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            start = Math.floor(eased * target);
            if (el) el.textContent = `${prefix}${start.toLocaleString("de-DE")}${suffix}`;
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix, prefix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/* ── Coupon Validator ───────────────────────────────────── */
function CouponField() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ valid: boolean; label: string } | null>(null);

  const validate = useCallback(() => {
    const upper = code.trim().toUpperCase();
    const found = COUPON_CODES[upper];
    if (found) {
      setResult({ valid: true, label: found.label });
    } else {
      setResult({ valid: false, label: "Ungültiger Code" });
    }
  }, [code]);

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <div className="flex gap-2 w-full max-w-xs">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setResult(null); }}
          placeholder="Coupon Code"
          className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#fff8e8] text-sm placeholder:text-white/30 focus:border-[#d4a537] focus:outline-none transition-colors"
        />
        <button
          onClick={validate}
          className="px-4 py-2 rounded-lg bg-[#d4a537] text-[#040302] text-sm font-semibold hover:bg-[#e8b84a] transition-colors"
        >
          Prüfen
        </button>
      </div>
      {result && (
        <p className={`text-xs ${result.valid ? "text-[#22c55e]" : "text-red-400"}`}>
          {result.label}
        </p>
      )}
    </div>
  );
}

/* ── Floating CTA ───────────────────────────────────────── */
function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="#pricing"
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full bg-[#d4a537] text-[#040302] font-bold text-sm shadow-lg shadow-[#d4a537]/20 hover:bg-[#e8b84a] transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      }`}
    >
      Plan wählen
    </a>
  );
}

/* ── Plan Button (dispatches openFunnel event) ──────────── */
function PlanButton({ plan, label }: { plan: string; label: string }) {
  const handleClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent("openFunnel", { detail: { plan } }));
  }, [plan]);

  return (
    <button
      onClick={handleClick}
      className="w-full py-3 rounded-xl bg-[#d4a537] text-[#040302] font-bold text-sm hover:bg-[#e8b84a] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
    >
      {label}
    </button>
  );
}

/* ── Scroll Reveal Observer ─────────────────────────────── */
function ScrollRevealInit() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}

/* ── Main Export ─────────────────────────────────────────── */
export default function LandingInteractive() {
  return (
    <>
      <ScrollRevealInit />
      <FloatingCTA />
    </>
  );
}

export { AnimatedCounter, CouponField, PlanButton };
