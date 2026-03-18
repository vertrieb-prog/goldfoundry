"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  text?: string;
  refCode: string;
}

export default function ShareButton({ url, text = "Schau dir Gold Foundry an!", refCode }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const fullUrl = `${url}${url.includes("?") ? "&" : "?"}ref=${refCode}`;
  const encoded = encodeURIComponent(fullUrl);
  const encodedText = encodeURIComponent(text);

  const channels = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedText}%20${encoded}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${encoded}&text=${encodedText}` },
    { label: "Twitter", href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encoded}` },
    { label: "Email", href: `mailto:?subject=${encodedText}&body=${encodedText}%20${encoded}` },
  ];

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="bg-[#d4a537] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#e6b84a] transition text-sm"
      >
        Teilen
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0a0a08] border border-[#1a1a15] rounded-xl shadow-xl z-50 overflow-hidden">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-sm text-gray-300 hover:bg-[#1a1a15] hover:text-white transition"
              onClick={() => setOpen(false)}
            >
              {c.label}
            </a>
          ))}
          <button
            onClick={copyLink}
            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#1a1a15] hover:text-white transition border-t border-[#1a1a15]"
          >
            Link kopieren
          </button>
        </div>
      )}
    </div>
  );
}
