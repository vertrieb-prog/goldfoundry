'use client';

import { useEffect, useState } from "react";

const navLinks = [
  { label: "Products", href: "#products" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Trial", href: "#trial" },
  { label: "FAQ", href: "#faq" },
];

export default function SentinelNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    setMobileOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <nav
      style={{
        position: "fixed",
        top: scrolled ? 8 : 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "8px 12px",
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 999,
        boxShadow: scrolled
          ? "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.06)"
          : "0 4px 30px rgba(0,0,0,0.4)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      {/* Logo */}
      <a
        href="#hero"
        onClick={(e) => handleAnchorClick(e, "#hero")}
        style={{
          fontFamily: "var(--font-fraunces), serif",
          fontWeight: 900,
          fontSize: 16,
          color: "#f5f5f5",
          textDecoration: "none",
          letterSpacing: "-0.02em",
          marginRight: 8,
          flexShrink: 0,
        }}
      >
        PHANTOM<span style={{ color: "#d4af37" }}>.</span>
      </a>

      {/* Desktop nav links */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 2 }}
        className="sentinel-nav-links"
      >
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => handleAnchorClick(e, link.href)}
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 12,
              fontWeight: 400,
              color: "#888888",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 999,
              transition: "color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "#f5f5f5";
              el.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "#888888";
              el.style.background = "transparent";
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <a
        href="#trial"
        onClick={(e) => handleAnchorClick(e, "#trial")}
        style={{
          marginLeft: 8,
          padding: "7px 16px",
          background: "#d4af37",
          color: "#0a0a0a",
          fontWeight: 700,
          fontSize: 12,
          fontFamily: "var(--font-jetbrains), monospace",
          borderRadius: 999,
          textDecoration: "none",
          transition: "all 0.2s",
          flexShrink: 0,
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "#f4cf47";
          el.style.boxShadow = "0 4px 20px rgba(212,175,55,0.3)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "#d4af37";
          el.style.boxShadow = "none";
        }}
      >
        Start Free Trial
      </a>

      <style>{`
        @media (max-width: 700px) {
          .sentinel-nav-links {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
