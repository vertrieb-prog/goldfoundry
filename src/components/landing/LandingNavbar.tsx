"use client";

import Link from "next/link";
import GoldFoundryLogo from "@/components/GoldFoundryLogo";

export default function LandingNavbar() {
  return (
    <nav
      className="gf-nav"
      style={{ width: "auto", maxWidth: "calc(100% - 32px)" }}
    >
      <GoldFoundryLogo size={28} showText className="mr-4" />
      <Link href="/dashboard" className="gf-btn gf-btn-sm ml-auto">
        Live Dashboard
      </Link>
    </nav>
  );
}
