"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

interface Partner {
  full_name: string;
  avatar_url?: string;
  username: string;
}

export function RecommendedBanner() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");

    // 1. Try URL param
    if (ref) {
      fetchPartner(ref);
      localStorage.setItem("ref_partner", ref);
      return;
    }

    // 2. Try LocalStorage
    const stored = localStorage.getItem("ref_partner");
    if (stored) {
      fetchPartner(stored);
    }
  }, [searchParams]);

  async function fetchPartner(username: string) {
    try {
      const res = await fetch(`/api/partner/public-info?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        setPartner(data);
      }
    } catch {}
  }

  if (!partner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black/80 backdrop-blur-xl border border-gold/30 rounded-2xl p-3 flex items-center gap-3 shadow-2xl shadow-gold/10">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-gold/50 bg-zinc-900 flex-shrink-0">
          {partner.avatar_url ? (
            <Image src={partner.avatar_url} alt={partner.full_name} width={40} height={40} className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gold font-bold">
              {partner.full_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="pr-2">
          <p className="text-[10px] text-gold/60 uppercase font-bold tracking-widest leading-none mb-1">Empfohlen von</p>
          <p className="text-sm font-bold text-white leading-none">{partner.full_name}</p>
        </div>
      </div>
    </div>
  );
}
