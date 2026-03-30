"use client";

import { useState } from "react";
import GoldFoundryLogo from "@/components/GoldFoundryLogo";

const navLinks = [
  { label: "Technologie", href: "#engine" },
  { label: "Trader", href: "#trader" },
  { label: "Rechner", href: "#rechner" },
  { label: "FAQ", href: "#faq" },
];

function scrollTo(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
}

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="gf-nav" style={{ width: "auto", maxWidth: "calc(100% - 32px)" }}>
      {/* Logo */}
      <GoldFoundryLogo size={28} showText={true} className="mr-4" />

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => scrollTo(e, link.href)}
            className="text-sm transition-colors duration-200"
            style={{ color: "var(--gf-text)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gf-gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gf-text)")}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Desktop CTA */}
      <a
        href="#register"
        onClick={(e) => scrollTo(e, "#register")}
        className="gf-btn gf-btn-sm hidden md:inline-flex ml-4"
      >
        Kostenlos starten
      </a>

      {/* Mobile hamburger */}
      <button
        className="md:hidden ml-auto flex flex-col gap-1 p-2"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <span className="block w-5 h-0.5 rounded" style={{ background: "var(--gf-text-bright)" }} />
        <span className="block w-5 h-0.5 rounded" style={{ background: "var(--gf-text-bright)" }} />
        <span className="block w-5 h-0.5 rounded" style={{ background: "var(--gf-text-bright)" }} />
      </button>

      {/* Mobile menu */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-2 flex flex-col items-center gap-4 py-6 md:hidden"
          style={{
            background: "rgba(9, 9, 11, 0.95)",
            backdropFilter: "blur(24px)",
            border: "1px solid var(--gf-border)",
            borderRadius: 16,
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { scrollTo(e, link.href); setOpen(false); }}
              className="text-sm"
              style={{ color: "var(--gf-text)" }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#register"
            onClick={(e) => { scrollTo(e, "#register"); setOpen(false); }}
            className="gf-btn gf-btn-sm"
          >
            Kostenlos starten
          </a>
        </div>
      )}
    </nav>
  );
}
