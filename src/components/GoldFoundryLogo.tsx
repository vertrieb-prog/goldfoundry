export default function GoldFoundryLogo({ size = 32, showText = true, className = "" }: { size?: number; showText?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer hexagon */}
        <path
          d="M24 2L43.5 13.25V35.75L24 47L4.5 35.75V13.25L24 2Z"
          stroke="url(#gf-border-grad)"
          strokeWidth="1.5"
          fill="url(#gf-bg-grad)"
        />
        {/* Inner anvil/forge shape */}
        <path
          d="M16 30L16 22L20 18L28 18L32 22L32 30L28 34L20 34L16 30Z"
          stroke="url(#gf-icon-grad)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Spark/flame */}
        <path
          d="M24 14L26 18L24 16.5L22 18L24 14Z"
          fill="#FAEF70"
          opacity="0.9"
        />
        {/* GF Letters */}
        <text x="18" y="30" fill="#FAEF70" fontSize="11" fontWeight="800" fontFamily="Inter, sans-serif" letterSpacing="1">GF</text>
        {/* Glow circle */}
        <circle cx="24" cy="24" r="18" fill="url(#gf-glow)" opacity="0.15" />
        <defs>
          <linearGradient id="gf-border-grad" x1="4" y1="2" x2="44" y2="47">
            <stop offset="0%" stopColor="#FAEF70" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#d4a537" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FAEF70" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="gf-bg-grad" x1="4" y1="2" x2="44" y2="47">
            <stop offset="0%" stopColor="#FAEF70" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="gf-icon-grad" x1="16" y1="18" x2="32" y2="34">
            <stop offset="0%" stopColor="#FAEF70" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#d4a537" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="gf-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FAEF70" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FAEF70" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      {showText && (
        <div>
          <div className="text-sm font-extrabold tracking-[2px] gf-gold-text leading-tight">GOLD FOUNDRY</div>
          <div className="text-[7px] tracking-[3px] text-zinc-600 leading-tight">FORGE TERMINAL</div>
        </div>
      )}
    </div>
  );
}
