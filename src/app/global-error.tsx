"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ background: "#040302", color: "#fafafa", padding: 40, fontFamily: "monospace" }}>
        <h1 style={{ color: "#ef4444" }}>Client Error</h1>
        <pre style={{ color: "#d4a537", fontSize: 14, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {error.message}
        </pre>
        <pre style={{ color: "#6d6045", fontSize: 12, whiteSpace: "pre-wrap", marginTop: 16 }}>
          {error.stack}
        </pre>
        <button onClick={reset} style={{ marginTop: 20, padding: "10px 20px", background: "#d4a537", color: "#040302", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
          Retry
        </button>
      </body>
    </html>
  );
}
