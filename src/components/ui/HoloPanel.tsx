"use client";

import React from "react";

interface HoloPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export default function HoloPanel({ children, className = "", glow = true }: HoloPanelProps) {
  const classes = [
    "border-glass",
    glow ? "border-gold-glow" : "",
    "holo-scanline",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={{ borderRadius: 16 }}>
      {children}
    </div>
  );
}
