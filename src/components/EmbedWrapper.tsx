"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const EMBED_CSS = `
  .gf-nav, footer, .gf-chat-widget { display: none !important; }
  body { background: var(--gf-obsidian) !important; }
`;

function EmbedStyle() {
  const params = useSearchParams();
  const [inIframe, setInIframe] = useState(false);
  const isEmbed = params.get("embed") === "1";

  useEffect(() => {
    try { setInIframe(window.self !== window.top); } catch { setInIframe(true); }
  }, []);

  if (!isEmbed && !inIframe) return null;

  return <style>{EMBED_CSS}</style>;
}

export default function EmbedWrapper() {
  return (
    <Suspense fallback={null}>
      <EmbedStyle />
    </Suspense>
  );
}
