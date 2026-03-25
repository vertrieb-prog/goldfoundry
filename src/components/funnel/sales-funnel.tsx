"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface ContactData {
  vorname: string;
  nachname: string;
  email: string;
  whatsappPrefix: string;
  whatsapp: string;
}

interface QuestionnaireData {
  experience: string;
  capital: string;
  willingness: string;
  profitExpectation: string;
  interest: string;
}

interface PlanSelection {
  plan: string;
  coupon: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const BG = "#040302";
const GOLD = "#d4a537";
const TEXT = "#fff8e8";
const GOLD_DIM = "#b8922e";

const GERMAN_NAMES = [
  "Max", "Lukas", "Leon", "Finn", "Noah", "Paul", "Elias", "Ben",
  "Jonas", "Felix", "Anna", "Lena", "Marie", "Sophie", "Emma",
  "Mia", "Laura", "Julia", "Sarah", "Lisa",
];

const GERMAN_CITIES = [
  "Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart",
  "Düsseldorf", "Leipzig", "Dresden", "Hannover", "Nürnberg",
  "Bremen", "Essen", "Dortmund", "Mannheim",
];

const PHONE_PREFIXES = [
  { code: "+49", label: "DE +49" },
  { code: "+43", label: "AT +43" },
  { code: "+41", label: "CH +41" },
];

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/FyLN4ZpUA5LAn3kDfExqXD";

/* ------------------------------------------------------------------ */
/*  HELPER: random pick                                                */
/* ------------------------------------------------------------------ */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ------------------------------------------------------------------ */
/*  CONFETTI (pure CSS keyframes injected once)                        */
/* ------------------------------------------------------------------ */

const CONFETTI_STYLE_ID = "gf-confetti-style";

function injectConfettiStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(CONFETTI_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = CONFETTI_STYLE_ID;
  style.textContent = `
    @keyframes gf-confetti-fall {
      0%   { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
      100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
    }
    @keyframes gf-confetti-sway {
      0%, 100% { margin-left: 0; }
      25%  { margin-left: 30px; }
      75%  { margin-left: -30px; }
    }
    .gf-confetti-piece {
      position: fixed;
      top: -10px;
      width: 10px;
      height: 10px;
      animation: gf-confetti-fall linear forwards,
                 gf-confetti-sway ease-in-out infinite;
      z-index: 99999;
      pointer-events: none;
    }
    @keyframes gf-slide-in  { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes gf-slide-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    @keyframes gf-fade-in   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes gf-pulse      { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes gf-bounce-in  { 0% { transform: scale(0); } 60% { transform: scale(1.1); } 100% { transform: scale(1); } }
    @keyframes gf-spin        { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes gf-email-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    @keyframes gf-social-in  { from { transform: translateX(-120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes gf-social-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-120%); opacity: 0; } }
    @keyframes gf-loading-dot { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    @keyframes gf-celebrate   { 0% { transform: scale(0) rotate(-45deg); } 50% { transform: scale(1.2) rotate(10deg); } 100% { transform: scale(1) rotate(0); } }
    @keyframes gf-countdown-pulse { 0%, 100% { color: ${GOLD}; } 50% { color: #ff6b6b; } }
  `;
  document.head.appendChild(style);
}

function spawnConfetti() {
  if (typeof document === "undefined") return;
  const colors = [GOLD, "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9"];
  const container = document.body;
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement("div");
    piece.className = "gf-confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor = pick(colors);
    piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
    piece.style.width = `${6 + Math.random() * 8}px`;
    piece.style.height = `${6 + Math.random() * 8}px`;
    const dur = 2 + Math.random() * 3;
    piece.style.animationDuration = `${dur}s, ${0.5 + Math.random()}s`;
    piece.style.animationDelay = `${Math.random() * 1.5}s, 0s`;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), (dur + 2) * 1000);
  }
}

/* ------------------------------------------------------------------ */
/*  SUB-COMPONENTS                                                     */
/* ------------------------------------------------------------------ */

function ProgressBar({
  step,
  total,
  onBack,
  showBack,
}: {
  step: number;
  total: number;
  onBack?: () => void;
  showBack?: boolean;
}) {
  const pct = (step / total) * 100;
  return (
    <div style={{ width: "100%", padding: "16px 20px 8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
          fontSize: 12,
          color: TEXT,
          opacity: 0.6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showBack && (
            <button
              onClick={onBack}
              style={{
                background: "transparent",
                border: "none",
                color: TEXT,
                opacity: 0.7,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: 0,
              }}
            >
              <span style={{ fontSize: 16 }}>&larr;</span> Zurück
            </button>
          )}
          <span>Schritt {step} von {total}</span>
        </div>
        <span>{Math.round(pct)}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(212,165,55,0.15)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 3,
            background: `linear-gradient(90deg, ${GOLD_DIM}, ${GOLD})`,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

function GoldButton({
  children,
  onClick,
  disabled,
  style,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  variant?: "primary" | "secondary" | "outline";
}) {
  const base: React.CSSProperties = {
    padding: "14px 32px",
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    transition: "all 0.3s ease",
    width: "100%",
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`,
      color: BG,
    },
    secondary: {
      background: "rgba(212,165,55,0.15)",
      color: GOLD,
      border: `1px solid ${GOLD}`,
    },
    outline: {
      background: "transparent",
      color: GOLD,
      border: `1px solid rgba(212,165,55,0.3)`,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </button>
  );
}

function StyledInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  prefix,
  prefixOptions,
  onPrefixChange,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  prefixOptions?: { code: string; label: string }[];
  onPrefixChange?: (v: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 14,
          color: TEXT,
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
        {required && <span style={{ color: GOLD, marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ display: "flex", gap: 0 }}>
        {prefixOptions && (
          <select
            value={prefix}
            onChange={(e) => onPrefixChange?.(e.target.value)}
            style={{
              background: "rgba(212,165,55,0.08)",
              border: `1px solid ${focused ? GOLD : "rgba(212,165,55,0.2)"}`,
              borderRight: "none",
              borderRadius: "10px 0 0 10px",
              color: TEXT,
              padding: "12px 8px",
              fontSize: 14,
              outline: "none",
              minWidth: 80,
            }}
          >
            {prefixOptions.map((p) => (
              <option key={p.code} value={p.code} style={{ background: BG }}>
                {p.label}
              </option>
            ))}
          </select>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: "rgba(212,165,55,0.08)",
            border: `1px solid ${focused ? GOLD : "rgba(212,165,55,0.2)"}`,
            borderRadius: prefixOptions ? "0 10px 10px 0" : 10,
            color: TEXT,
            padding: "12px 16px",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.3s",
            width: "100%",
          }}
        />
      </div>
    </div>
  );
}

function SelectableCard({
  label,
  selected,
  onClick,
  subtitle,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  subtitle?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "14px 18px",
        borderRadius: 10,
        border: `2px solid ${selected ? GOLD : "rgba(212,165,55,0.15)"}`,
        background: selected
          ? "rgba(212,165,55,0.12)"
          : "rgba(212,165,55,0.04)",
        color: selected ? GOLD : TEXT,
        fontSize: 14,
        fontWeight: selected ? 700 : 500,
        cursor: "pointer",
        transition: "all 0.25s ease",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: `2px solid ${selected ? GOLD : "rgba(212,165,55,0.3)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {selected && (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: GOLD,
            }}
          />
        )}
      </span>
      <div>
        <div>{label}</div>
        {subtitle && (
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  SOCIAL PROOF POPUP                                                 */
/* ------------------------------------------------------------------ */

function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const show = () => {
      setName(pick(GERMAN_NAMES));
      setCity(pick(GERMAN_CITIES));
      setLeaving(false);
      setVisible(true);
      setTimeout(() => {
        setLeaving(true);
        setTimeout(() => setVisible(false), 500);
      }, 4000);
    };

    const interval = setInterval(show, 12000);
    const initial = setTimeout(show, 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: 16,
        background: "rgba(20,18,15,0.95)",
        border: `1px solid rgba(212,165,55,0.3)`,
        borderRadius: 12,
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 100002,
        animation: leaving
          ? "gf-social-out 0.5s ease forwards"
          : "gf-social-in 0.5s ease forwards",
        maxWidth: 300,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      <span style={{ fontSize: 22 }}>&#9889;</span>
      <div>
        <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>
          {name} aus {city}
        </div>
        <div style={{ fontSize: 11, color: GOLD, opacity: 0.8 }}>
          hat sich gerade angemeldet
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  WHATSAPP FLOAT BUTTON                                              */
/* ------------------------------------------------------------------ */

function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_GROUP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
        zIndex: 100001,
        cursor: "pointer",
        textDecoration: "none",
        transition: "transform 0.2s",
      }}
      title="WhatsApp Gruppe"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  IDLE DETECTION OVERLAY                                             */
/* ------------------------------------------------------------------ */

function IdleOverlay({
  show,
  onDismiss,
}: {
  show: boolean;
  onDismiss: () => void;
}) {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4,3,2,0.92)",
        zIndex: 100005,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "gf-fade-in 0.4s ease",
      }}
    >
      <div
        style={{
          background: "rgba(30,25,20,0.98)",
          border: `2px solid ${GOLD}`,
          borderRadius: 20,
          padding: "40px 32px",
          maxWidth: 380,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#128075;</div>
        <h2
          style={{
            color: GOLD,
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Brauchst du Hilfe?
        </h2>
        <p
          style={{
            color: TEXT,
            fontSize: 15,
            lineHeight: 1.6,
            marginBottom: 24,
            opacity: 0.8,
          }}
        >
          Unser Team steht dir jederzeit per WhatsApp zur Verfügung.
        </p>
        <a
          href={WHATSAPP_GROUP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            background: "#25D366",
            color: "#fff",
            padding: "14px 28px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
            marginBottom: 12,
            width: "100%",
            textAlign: "center",
          }}
        >
          &#128172; WhatsApp Support
        </a>
        <br />
        <button
          onClick={onDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: TEXT,
            opacity: 0.5,
            fontSize: 14,
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          Ich komme zurecht
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function SalesFunnel() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);

  // Step 1
  const [contact, setContact] = useState<ContactData>({
    vorname: "",
    nachname: "",
    email: "",
    whatsappPrefix: "+49",
    whatsapp: "",
  });
  const [contactLoading, setContactLoading] = useState(false);

  // Step 2
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendAvailable, setResendAvailable] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [showEmailSkip, setShowEmailSkip] = useState(false);

  // Step 3
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({
    experience: "",
    capital: "",
    willingness: "",
    profitExpectation: "",
    interest: "",
  });
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);

  // Step 4
  const [selectedPlan, setSelectedPlan] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [countdown, setCountdown] = useState(15 * 60);
  const [planLoading, setPlanLoading] = useState(false);

  // Step 5
  const [welcomeLoading, setWelcomeLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [affiliateCopied, setAffiliateCopied] = useState(false);

  // Step 6
  const [selectedBroker, setSelectedBroker] = useState("");
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [loginNumber, setLoginNumber] = useState("");
  const [brokerLoading, setBrokerLoading] = useState(false);

  // Idle detection
  const [showIdle, setShowIdle] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Polling ref
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inject CSS
  useEffect(() => {
    injectConfettiStyles();
  }, []);

  // Listen for custom event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("openFunnel", handler);
    return () => window.removeEventListener("openFunnel", handler);
  }, []);

  // Block Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Idle detection
  const resetIdle = useCallback(() => {
    setShowIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setShowIdle(true), 60000);
  }, []);

  useEffect(() => {
    if (!open) return;
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdle));
    resetIdle();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [open, resetIdle]);

  // Step 2: email polling
  useEffect(() => {
    if (step !== 2 || emailVerified) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/funnel/check-email?email=${encodeURIComponent(contact.email)}`
        );
        const data = await res.json();
        if (data.verified) {
          setEmailVerified(true);
          if (pollRef.current) clearInterval(pollRef.current);
          setTimeout(() => goTo(3), 800);
        }
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, emailVerified, contact.email]);

  // Step 2: skip button after 10 seconds (persisted via localStorage)
  useEffect(() => {
    if (step !== 2) return;
    const alreadyShown = typeof window !== "undefined" && localStorage.getItem("gf_skip_shown") === "1";
    if (alreadyShown) {
      setShowEmailSkip(true);
      return;
    }
    const skipTimer = setTimeout(() => {
      setShowEmailSkip(true);
      if (typeof window !== "undefined") localStorage.setItem("gf_skip_shown", "1");
    }, 10000);
    return () => clearTimeout(skipTimer);
  }, [step]);

  // Step 2: resend timer
  useEffect(() => {
    if (step !== 2) return;
    setResendAvailable(false);
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          setResendAvailable(true);
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Step 4: countdown
  useEffect(() => {
    if (step !== 4) return;
    const interval = setInterval(() => {
      setCountdown((c) => (c <= 0 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Step 5: welcome loading + confetti
  useEffect(() => {
    if (step !== 5) return;
    setWelcomeLoading(true);
    setShowConfetti(false);
    const timer = setTimeout(() => {
      setWelcomeLoading(false);
      setShowConfetti(true);
      spawnConfetti();
    }, 3000);
    return () => clearTimeout(timer);
  }, [step]);

  /* ---------- navigation ---------- */

  const goTo = useCallback(
    (target: Step) => {
      if (animating) return;
      setDirection(target > step ? "forward" : "back");
      setAnimating(true);
      setTimeout(() => {
        setStep(target);
        setAnimating(false);
      }, 350);
    },
    [step, animating]
  );

  /* ---------- handlers ---------- */

  const handleContactSubmit = async () => {
    if (
      !contact.vorname ||
      !contact.nachname ||
      !contact.email ||
      !contact.whatsapp
    )
      return;
    setContactLoading(true);
    try {
      await fetch("/api/funnel/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          whatsapp: `${contact.whatsappPrefix}${contact.whatsapp}`,
        }),
      });
      goTo(2);
    } catch {
      /* allow progression anyway for demo */
      goTo(2);
    } finally {
      setContactLoading(false);
    }
  };

  const handleQuestionnaireSubmit = async () => {
    if (
      !questionnaire.experience ||
      !questionnaire.capital ||
      !questionnaire.willingness ||
      !questionnaire.profitExpectation ||
      !questionnaire.interest
    )
      return;
    setQuestionnaireLoading(true);
    try {
      await fetch("/api/funnel/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contact.email, ...questionnaire }),
      });
    } catch {
      /* continue */
    } finally {
      setQuestionnaireLoading(false);
      goTo(4);
    }
  };

  const handleCouponValidate = () => {
    const valid = ["FORGE", "FORGE50", "FREETRIAL", "PROPFIRM"];
    const upper = coupon.toUpperCase().trim();
    if (valid.includes(upper)) {
      setCouponValid(true);
      setCouponMessage("Gutscheincode angewendet!");
    } else if (upper.length > 0) {
      setCouponValid(false);
      setCouponMessage("Ungültiger Code");
    } else {
      setCouponValid(null);
      setCouponMessage("");
    }
  };

  const handlePlanSubmit = async () => {
    if (!selectedPlan) return;
    setPlanLoading(true);
    try {
      await fetch("/api/funnel/select-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contact.email,
          plan: selectedPlan,
          coupon: couponValid ? coupon.toUpperCase().trim() : "",
        }),
      });
    } catch {
      /* continue */
    } finally {
      setPlanLoading(false);
      goTo(5);
    }
  };

  const handleBrokerSubmit = async () => {
    if (!selectedBroker || !riskAccepted || !loginNumber) return;
    setBrokerLoading(true);
    try {
      await fetch("/api/funnel/select-broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contact.email,
          broker: selectedBroker,
          loginNumber,
        }),
      });
    } catch {
      /* continue */
    } finally {
      setBrokerLoading(false);
      goTo(7);
    }
  };

  const handleCopyAffiliate = () => {
    const link = `https://goldfoundry.io/ref/${contact.email
      .split("@")[0]
      .slice(0, 8)}`;
    navigator.clipboard.writeText(link).then(() => {
      setAffiliateCopied(true);
      setTimeout(() => setAffiliateCopied(false), 2000);
    });
  };

  /* ---------- format countdown ---------- */

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  /* ---------- step content ---------- */

  const questionnaireComplete =
    questionnaire.experience &&
    questionnaire.capital &&
    questionnaire.willingness &&
    questionnaire.profitExpectation &&
    questionnaire.interest;

  const contactComplete =
    contact.vorname && contact.nachname && contact.email && contact.whatsapp;

  const sectionTitle = (text: string) => (
    <h2
      style={{
        color: GOLD,
        fontSize: 22,
        fontWeight: 800,
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: 1,
      }}
    >
      {text}
    </h2>
  );

  const sectionSubtitle = (text: string) => (
    <p
      style={{
        color: TEXT,
        fontSize: 14,
        textAlign: "center",
        opacity: 0.7,
        marginBottom: 28,
        lineHeight: 1.5,
      }}
    >
      {text}
    </p>
  );

  const questionBlock = (
    title: string,
    options: { label: string; subtitle?: string }[],
    field: keyof QuestionnaireData
  ) => (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          color: TEXT,
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((o) => (
          <SelectableCard
            key={o.label}
            label={o.label}
            subtitle={o.subtitle}
            selected={questionnaire[field] === o.label}
            onClick={() =>
              setQuestionnaire((q) => ({ ...q, [field]: o.label }))
            }
          />
        ))}
      </div>
    </div>
  );

  /* ---------- render steps ---------- */

  const renderStep = (): React.ReactNode => {
    switch (step) {
      /* ============================================================ */
      /*  STEP 1: KONTAKTDATEN                                        */
      /* ============================================================ */
      case 1:
        return (
          <div>
            {sectionTitle("KONTAKTDATEN")}
            {sectionSubtitle(
              "Erstelle deinen Account und starte mit Gold Foundry."
            )}
            <StyledInput
              label="Vorname"
              value={contact.vorname}
              onChange={(v) => setContact((c) => ({ ...c, vorname: v }))}
              placeholder="Max"
              required
            />
            <StyledInput
              label="Nachname"
              value={contact.nachname}
              onChange={(v) => setContact((c) => ({ ...c, nachname: v }))}
              placeholder="Mustermann"
              required
            />
            <StyledInput
              label="Email"
              type="email"
              value={contact.email}
              onChange={(v) => setContact((c) => ({ ...c, email: v }))}
              placeholder="max@beispiel.de"
              required
            />
            <StyledInput
              label="WhatsApp Nummer"
              type="tel"
              value={contact.whatsapp}
              onChange={(v) =>
                setContact((c) => ({ ...c, whatsapp: v.replace(/\D/g, "") }))
              }
              placeholder="1511234567"
              prefix={contact.whatsappPrefix}
              prefixOptions={PHONE_PREFIXES}
              onPrefixChange={(v) =>
                setContact((c) => ({ ...c, whatsappPrefix: v }))
              }
              required
            />
            <div style={{ marginTop: 24 }}>
              <GoldButton
                onClick={handleContactSubmit}
                disabled={!contactComplete || contactLoading}
              >
                {contactLoading ? "Wird gesendet..." : "Weiter"}
              </GoldButton>
            </div>
          </div>
        );

      /* ============================================================ */
      /*  STEP 2: EMAIL BESTÄTIGUNG                                   */
      /* ============================================================ */
      case 2:
        return (
          <div style={{ textAlign: "center" }}>
            {sectionTitle("EMAIL BESTÄTIGUNG")}
            <div
              style={{
                margin: "32px auto",
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(212,165,55,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "gf-email-float 2s ease-in-out infinite",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke={GOLD}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13 2 4" />
              </svg>
            </div>
            <p
              style={{
                color: TEXT,
                fontSize: 16,
                lineHeight: 1.7,
                marginBottom: 8,
              }}
            >
              Klicke den Link in deiner Email
            </p>
            <p
              style={{
                color: TEXT,
                fontSize: 13,
                opacity: 0.5,
                marginBottom: 4,
              }}
            >
              Gesendet an: <strong>{contact.email}</strong>
            </p>
            <p
              style={{
                color: TEXT,
                fontSize: 13,
                opacity: 0.5,
                marginBottom: 28,
                lineHeight: 1.5,
              }}
            >
              Der Klick trainiert Gmail, dass unsere Emails kein Spam sind.
              <br />
              Bitte auch im Spam-Ordner nachschauen.
            </p>

            {emailVerified ? (
              <div
                style={{
                  color: "#4ecdc4",
                  fontSize: 16,
                  fontWeight: 700,
                  animation: "gf-bounce-in 0.5s ease",
                }}
              >
                &#10003; Email bestätigt!
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: GOLD,
                      animation: "gf-loading-dot 1.4s infinite ease-in-out",
                    }}
                  />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: GOLD,
                      animation:
                        "gf-loading-dot 1.4s infinite ease-in-out 0.2s",
                    }}
                  />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: GOLD,
                      animation:
                        "gf-loading-dot 1.4s infinite ease-in-out 0.4s",
                    }}
                  />
                  <span
                    style={{ color: TEXT, opacity: 0.5, fontSize: 13, marginLeft: 4 }}
                  >
                    Warte auf Bestätigung...
                  </span>
                </div>

                {resendAvailable ? (
                  <GoldButton
                    variant="outline"
                    onClick={() => {
                      setResendAvailable(false);
                      setResendTimer(30);
                      fetch("/api/funnel/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...contact,
                          whatsapp: `${contact.whatsappPrefix}${contact.whatsapp}`,
                          resend: true,
                        }),
                      }).catch(() => {});
                      const interval = setInterval(() => {
                        setResendTimer((t) => {
                          if (t <= 1) {
                            setResendAvailable(true);
                            clearInterval(interval);
                            return 0;
                          }
                          return t - 1;
                        });
                      }, 1000);
                    }}
                  >
                    Email erneut senden
                  </GoldButton>
                ) : (
                  <p style={{ color: TEXT, opacity: 0.4, fontSize: 13 }}>
                    Erneut senden in {resendTimer}s
                  </p>
                )}
              </>
            )}

            {/* Skip Button nach 10 Sekunden */}
            {showEmailSkip && !emailVerified && (
              <div style={{ marginTop: 20, animation: "gf-fade-in 0.5s ease" }}>
                <GoldButton
                  variant="outline"
                  onClick={() => goTo(3)}
                >
                  Weiter ohne Bestätigung →
                </GoldButton>
                <p style={{ color: TEXT, opacity: 0.3, fontSize: 11, marginTop: 8, textAlign: "center" }}>
                  Du kannst die Email später bestätigen.
                </p>
              </div>
            )}
          </div>
        );

      /* ============================================================ */
      /*  STEP 3: FRAGEBOGEN                                          */
      /* ============================================================ */
      case 3:
        return (
          <div>
            {sectionTitle("FRAGEBOGEN")}
            {sectionSubtitle(
              "Hilf uns, das beste Angebot für dich zu finden."
            )}
            {questionBlock(
              "Wie ist deine Trading-Erfahrung?",
              [
                { label: "Anfänger", subtitle: "Ich fange gerade erst an" },
                {
                  label: "Fortgeschritten",
                  subtitle: "Ich trade seit einiger Zeit",
                },
                { label: "Profi", subtitle: "Ich trade hauptberuflich" },
              ],
              "experience"
            )}
            {questionBlock(
              "Verfügbares Kapital?",
              [
                { label: "€100-500" },
                { label: "€500-2000" },
                { label: "€2000-5000" },
                { label: "€5000+" },
              ],
              "capital"
            )}
            {questionBlock(
              "Bereitschaft einzuzahlen?",
              [
                { label: "Ja", subtitle: "Ich bin bereit zu investieren" },
                { label: "Nein", subtitle: "Erstmal nur anschauen" },
                { label: "Vielleicht", subtitle: "Kommt auf das Angebot an" },
              ],
              "willingness"
            )}
            {questionBlock(
              "Profit-Erwartung?",
              [
                { label: "1-3%/Monat", subtitle: "Konservativ" },
                { label: "5-10%/Monat", subtitle: "Moderat" },
                { label: "10%+/Monat", subtitle: "Aggressiv" },
              ],
              "profitExpectation"
            )}
            {questionBlock(
              "Welches Produkt interessiert dich?",
              [
                {
                  label: "Smart Copier",
                  subtitle: "Automatischer Trade-Kopierer",
                },
                {
                  label: "Telegram Copier",
                  subtitle: "Signale über Telegram",
                },
                { label: "Beides", subtitle: "Maximale Flexibilität" },
              ],
              "interest"
            )}
            <div style={{ marginTop: 24 }}>
              <GoldButton
                onClick={handleQuestionnaireSubmit}
                disabled={!questionnaireComplete || questionnaireLoading}
              >
                {questionnaireLoading ? "Wird gesendet..." : "Weiter"}
              </GoldButton>
            </div>
          </div>
        );

      /* ============================================================ */
      /*  STEP 4: PLAN WÄHLEN                                        */
      /* ============================================================ */
      case 4:
        return (
          <div>
            {sectionTitle("PLAN WÄHLEN")}

            {/* Countdown */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 24,
                padding: "14px 20px",
                background: "rgba(255,107,107,0.08)",
                border: "1px solid rgba(255,107,107,0.2)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: "#ff6b6b",
                  fontWeight: 700,
                  animation: "gf-countdown-pulse 2s infinite",
                }}
              >
                &#128293; 80% Rabatt endet in{" "}
                <span style={{ fontFamily: "monospace", fontSize: 18 }}>
                  {formatCountdown(countdown)}
                </span>
              </div>
            </div>

            {/* Plans */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {/* Starter */}
              <PlanCard
                name="Starter"
                price="€9/Mo"
                salePrice="€2 im 1. Monat"
                features={[
                  "1 Trading-Konto",
                  "Basis-Signale",
                  "Community Zugang",
                ]}
                selected={selectedPlan === "starter"}
                onClick={() => setSelectedPlan("starter")}
              />

              {/* Smart Copier - EMPFOHLEN */}
              <PlanCard
                name="Smart Copier"
                price="€29/Mo"
                salePrice="€6 im 1. Monat"
                features={[
                  "3 Trading-Konten",
                  "Smart Copier Zugang",
                  "Priority Support",
                  "Telegram Signale",
                ]}
                selected={selectedPlan === "smart"}
                onClick={() => setSelectedPlan("smart")}
                recommended
              />

              {/* Pro */}
              <PlanCard
                name="Pro"
                price="€79/Mo"
                salePrice="€16 im 1. Monat"
                features={[
                  "Unbegrenzte Konten",
                  "Alle Copier",
                  "1:1 Support",
                  "Prop-Firm Modus",
                  "Affiliate Dashboard",
                ]}
                selected={selectedPlan === "pro"}
                onClick={() => setSelectedPlan("pro")}
              />
            </div>

            {/* Coupon */}
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-end",
                }}
              >
                <div style={{ flex: 1 }}>
                  <StyledInput
                    label="Gutscheincode"
                    value={coupon}
                    onChange={(v) => {
                      setCoupon(v);
                      setCouponValid(null);
                      setCouponMessage("");
                    }}
                    placeholder="z.B. FORGE50"
                  />
                </div>
                <button
                  onClick={handleCouponValidate}
                  style={{
                    padding: "12px 18px",
                    background: "rgba(212,165,55,0.15)",
                    border: `1px solid ${GOLD}`,
                    borderRadius: 10,
                    color: GOLD,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: 16,
                    whiteSpace: "nowrap",
                  }}
                >
                  Einlösen
                </button>
              </div>
              {couponMessage && (
                <p
                  style={{
                    fontSize: 13,
                    color: couponValid ? "#4ecdc4" : "#ff6b6b",
                    marginTop: -8,
                    marginBottom: 12,
                  }}
                >
                  {couponValid ? "✓" : "✗"} {couponMessage}
                </p>
              )}
            </div>

            {/* Risikohinweis */}
            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: TEXT,
                  opacity: 0.4,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                <strong>Risikohinweis:</strong> Der Handel mit Forex und CFDs
                birgt ein hohes Risiko. Du kannst dein gesamtes eingesetztes
                Kapital verlieren. Diese Produkte sind nicht für jeden
                geeignet. Stelle sicher, dass du die Risiken vollständig
                verstehst. Vergangene Ergebnisse sind kein Indikator für
                zukünftige Performance.
              </p>
            </div>

            <div style={{ marginTop: 24 }}>
              <GoldButton
                onClick={handlePlanSubmit}
                disabled={!selectedPlan || planLoading}
              >
                {planLoading ? "Wird verarbeitet..." : "Jetzt starten"}
              </GoldButton>
            </div>
          </div>
        );

      /* ============================================================ */
      /*  STEP 5: WILLKOMMEN                                         */
      /* ============================================================ */
      case 5:
        if (welcomeLoading) {
          return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  border: `3px solid rgba(212,165,55,0.2)`,
                  borderTopColor: GOLD,
                  borderRadius: "50%",
                  animation: "gf-spin 0.8s linear infinite",
                  margin: "0 auto 24px",
                }}
              />
              <p style={{ color: TEXT, fontSize: 16, fontWeight: 600 }}>
                Dein Account wird eingerichtet...
              </p>
              <p style={{ color: TEXT, opacity: 0.5, fontSize: 14 }}>
                Nur einen Moment
              </p>
            </div>
          );
        }
        return (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 64,
                marginBottom: 16,
                animation: "gf-celebrate 0.6s ease forwards",
              }}
            >
              &#127881;
            </div>
            {sectionTitle("WILLKOMMEN!")}
            <p
              style={{
                color: TEXT,
                fontSize: 15,
                opacity: 0.8,
                marginBottom: 32,
                lineHeight: 1.6,
              }}
            >
              Du bist jetzt Teil der Gold Foundry Familie.
              <br />
              Hier sind deine nächsten Schritte:
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <a
                href={WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 20px",
                  background: "rgba(37,211,102,0.1)",
                  border: "1px solid rgba(37,211,102,0.3)",
                  borderRadius: 12,
                  color: "#25D366",
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 22 }}>&#128172;</span>
                WhatsApp Gruppe beitreten
              </a>

              <a
                href="https://download.mql5.com/cdn/web/metaquotes.ltd/mt4/mt4setup.exe"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 20px",
                  background: "rgba(212,165,55,0.08)",
                  border: "1px solid rgba(212,165,55,0.2)",
                  borderRadius: 12,
                  color: GOLD,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 22 }}>&#128187;</span>
                MT4 Demo herunterladen
              </a>

              <a
                href="/dashboard"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 20px",
                  background: "rgba(212,165,55,0.08)",
                  border: "1px solid rgba(212,165,55,0.2)",
                  borderRadius: 12,
                  color: GOLD,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 22 }}>&#127968;</span>
                Portal Login
              </a>

              <button
                onClick={handleCopyAffiliate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 20px",
                  background: affiliateCopied
                    ? "rgba(78,205,196,0.1)"
                    : "rgba(150,206,180,0.08)",
                  border: `1px solid ${
                    affiliateCopied
                      ? "rgba(78,205,196,0.3)"
                      : "rgba(150,206,180,0.2)"
                  }`,
                  borderRadius: 12,
                  color: affiliateCopied ? "#4ecdc4" : "#96ceb4",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 22 }}>
                  {affiliateCopied ? "✓" : "&#128279;"}
                </span>
                {affiliateCopied
                  ? "Link kopiert!"
                  : "50% Affiliate Link kopieren"}
              </button>
            </div>

            <div style={{ marginTop: 28 }}>
              <GoldButton onClick={() => goTo(6)}>
                Weiter zur Broker-Einrichtung
              </GoldButton>
            </div>
          </div>
        );

      /* ============================================================ */
      /*  STEP 6: BROKER WÄHLEN                                      */
      /* ============================================================ */
      case 6:
        return (
          <div>
            {sectionTitle("BROKER WÄHLEN")}
            {sectionSubtitle(
              "Wähle deinen Broker und richte dein Konto ein."
            )}

            <div
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {/* Tegas FX */}
              <BrokerCard
                name="Tegas FX"
                features={[
                  "24x Hebel",
                  "Ab €100 Einzahlung",
                  "5% Trailing Drawdown",
                ]}
                steps={[
                  "Account auf tegasfx.com erstellen",
                  "KYC-Verifizierung abschließen",
                  "Live-Konto eröffnen (MT4)",
                  "Mindestens €100 einzahlen",
                  "Login-Nummer hier eingeben",
                ]}
                selected={selectedBroker === "tegasfx"}
                onClick={() => setSelectedBroker("tegasfx")}
              />

              {/* TAG Markets */}
              <BrokerCard
                name="TAG Markets"
                features={[
                  "12x Amplify",
                  "Niedrige Spreads",
                  "Schnelle Ausführung",
                ]}
                steps={[
                  "Account auf tagmarkets.com erstellen",
                  "Persönliche Daten verifizieren",
                  "Live MT4 Konto eröffnen",
                  "Hebel auf 1:500 setzen",
                  "Konto kapitalisieren",
                  "Login-Nummer hier eingeben",
                ]}
                selected={selectedBroker === "tagmarkets"}
                onClick={() => setSelectedBroker("tagmarkets")}
              />
            </div>

            {/* Risk checkbox */}
            <div
              style={{
                marginTop: 24,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <button
                onClick={() => setRiskAccepted(!riskAccepted)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  border: `2px solid ${riskAccepted ? GOLD : "rgba(212,165,55,0.3)"}`,
                  background: riskAccepted
                    ? "rgba(212,165,55,0.15)"
                    : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                  padding: 0,
                }}
              >
                {riskAccepted && (
                  <span
                    style={{ color: GOLD, fontSize: 14, fontWeight: 700 }}
                  >
                    ✓
                  </span>
                )}
              </button>
              <p
                style={{
                  fontSize: 12,
                  color: TEXT,
                  opacity: 0.6,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                <strong style={{ color: "#ff6b6b" }}>Pflicht:</strong> Ich
                verstehe, dass der Handel mit Forex und CFDs ein hohes Risiko
                birgt und ich mein gesamtes Kapital verlieren kann. Ich handle
                auf eigene Verantwortung.
              </p>
            </div>

            {/* Login-Nummer */}
            <div style={{ marginTop: 20 }}>
              <StyledInput
                label="Deine Broker Login-Nummer"
                value={loginNumber}
                onChange={setLoginNumber}
                placeholder="z.B. 12345678"
                required
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <GoldButton
                onClick={handleBrokerSubmit}
                disabled={
                  !selectedBroker ||
                  !riskAccepted ||
                  !loginNumber ||
                  brokerLoading
                }
              >
                {brokerLoading ? "Wird eingerichtet..." : "Weiter"}
              </GoldButton>
            </div>
          </div>
        );

      /* ============================================================ */
      /*  STEP 7: FERTIG                                              */
      /* ============================================================ */
      case 7:
        return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div
              style={{
                fontSize: 72,
                marginBottom: 20,
                animation: "gf-celebrate 0.8s ease forwards",
              }}
            >
              &#127942;
            </div>
            {sectionTitle("ALLES EINGERICHTET!")}
            <p
              style={{
                color: TEXT,
                fontSize: 18,
                lineHeight: 1.7,
                marginBottom: 12,
                fontWeight: 500,
              }}
            >
              Dein erster Trade kommt bald.
            </p>
            <p
              style={{
                color: TEXT,
                fontSize: 14,
                opacity: 0.6,
                marginBottom: 36,
                lineHeight: 1.6,
              }}
            >
              Sobald sich eine Gelegenheit ergibt, wird der Smart Copier
              automatisch für dich handeln. Lehn dich zurück und lass Gold
              Foundry arbeiten.
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <a
                href="/dashboard"
                style={{
                  display: "block",
                  padding: "16px 20px",
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`,
                  borderRadius: 12,
                  color: BG,
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Zum Dashboard
              </a>
              <a
                href={WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "14px 20px",
                  background: "rgba(37,211,102,0.1)",
                  border: "1px solid rgba(37,211,102,0.3)",
                  borderRadius: 12,
                  color: "#25D366",
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                WhatsApp Gruppe
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ---------- don't render until opened ---------- */

  if (!open) return null;

  const showBack = step > 1 && step < 5;

  return (
    <>
      {/* Full-screen modal backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: BG,
          zIndex: 100000,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 14,
          color: TEXT,
        }}
      >
        {/* Progress bar with integrated back button */}
        <ProgressBar
          step={step}
          total={7}
          showBack={showBack}
          onBack={() => goTo((step - 1) as Step)}
        />

        {/* Step content with animation */}
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "24px 20px 100px",
            opacity: animating ? 0 : 1,
            transform: animating
              ? direction === "forward"
                ? "translateX(40px)"
                : "translateX(-40px)"
              : "translateX(0)",
            transition: "all 0.35s ease",
          }}
        >
          {renderStep()}
        </div>
      </div>

      {/* Social proof */}
      <SocialProofPopup />

      {/* WhatsApp float */}
      <WhatsAppFloat />

      {/* Idle overlay */}
      <IdleOverlay show={showIdle} onDismiss={resetIdle} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  PLAN CARD                                                          */
/* ------------------------------------------------------------------ */

function PlanCard({
  name,
  price,
  salePrice,
  features,
  selected,
  onClick,
  recommended,
}: {
  name: string;
  price: string;
  salePrice: string;
  features: string[];
  selected: boolean;
  onClick: () => void;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        padding: "20px",
        borderRadius: 14,
        border: `2px solid ${
          selected
            ? GOLD
            : recommended
            ? "rgba(212,165,55,0.4)"
            : "rgba(212,165,55,0.12)"
        }`,
        background: selected
          ? "rgba(212,165,55,0.1)"
          : recommended
          ? "rgba(212,165,55,0.05)"
          : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.25s ease",
        overflow: "visible",
      }}
    >
      {recommended && (
        <span
          style={{
            position: "absolute",
            top: -12,
            right: 16,
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`,
            color: BG,
            fontSize: 11,
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: 6,
            letterSpacing: 0.5,
          }}
        >
          EMPFOHLEN
        </span>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              color: selected ? GOLD : TEXT,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {name}
          </div>
          <div style={{ color: TEXT, opacity: 0.4, fontSize: 13, textDecoration: "line-through" }}>
            {price}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              color: GOLD,
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            {salePrice}
          </div>
          <div
            style={{
              color: "#ff6b6b",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            80% Rabatt
          </div>
        </div>
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", gap: 6 }}
      >
        {features.map((f) => (
          <div
            key={f}
            style={{
              fontSize: 13,
              color: TEXT,
              opacity: 0.7,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: GOLD, fontSize: 12 }}>&#10003;</span>
            {f}
          </div>
        ))}
      </div>
      {/* selection indicator */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: -1,
          width: 4,
          height: selected ? "calc(100% - 40px)" : 0,
          background: GOLD,
          borderRadius: 2,
          transition: "height 0.3s ease",
        }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  BROKER CARD                                                        */
/* ------------------------------------------------------------------ */

function BrokerCard({
  name,
  features,
  steps,
  selected,
  onClick,
}: {
  name: string;
  features: string[];
  steps: string[];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "20px",
        borderRadius: 14,
        border: `2px solid ${selected ? GOLD : "rgba(212,165,55,0.12)"}`,
        background: selected
          ? "rgba(212,165,55,0.1)"
          : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.25s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            color: selected ? GOLD : TEXT,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {name}
        </div>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: `2px solid ${selected ? GOLD : "rgba(212,165,55,0.3)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected && (
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: GOLD,
              }}
            />
          )}
        </div>
      </div>

      {/* Features */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        {features.map((f) => (
          <span
            key={f}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(212,165,55,0.08)",
              color: GOLD,
              fontWeight: 600,
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Setup steps */}
      {selected && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 14,
            borderTop: "1px solid rgba(212,165,55,0.1)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: GOLD,
              marginBottom: 10,
            }}
          >
            Einrichtung:
          </div>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(212,165,55,0.1)",
                  color: GOLD,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: TEXT,
                  opacity: 0.7,
                  lineHeight: 1.4,
                }}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
