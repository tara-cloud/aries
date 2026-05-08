"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import AriesLogo from "@/components/AriesLogo";

const PRIMARY = "#6366f1";
const PRIMARY_HOVER = "#4f46e5";
const HEADER_BG = "linear-gradient(160deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%)";

function useDarkMode(): boolean | null {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem("theme-preference");
    if (stored === "dark")  { setDark(true);  return; }
    if (stored === "light") { setDark(false); return; }
    const mq = globalThis.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const h = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return dark;
}

function getColors(d: boolean) {
  return {
    pageBg:      d ? "#1e1b4b" : "#f8fafc",
    cardBg:      d ? "#1e293b" : "#ffffff",
    inputBg:     d ? "#0f172a" : "#f9fafb",
    inputBorder: d ? "#334155" : "#d1d5db",
    inputText:   d ? "#f1f5f9" : "#111827",
    labelText:   d ? "#cbd5e1" : "#374151",
  };
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const dark = useDarkMode();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const registered = params.get("registered") === "1";
  const nextUrl    = params.get("callbackUrl") ?? "/";

  useEffect(() => {
    if (status === "authenticated") router.replace(nextUrl);
  }, [status, router, nextUrl]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error)   setError("Invalid email or password");
      else if (result?.ok) router.replace(nextUrl);
      else                 setError("Something went wrong. Please try again.");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (dark === null) return null;
  const d = dark;
  const { pageBg, cardBg, inputBg, inputBorder, inputText, labelText } = getColors(d);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: pageBg, padding: "16px", transition: "background 0.3s" }}>
      <div style={{ width: "100%", maxWidth: 384, borderRadius: 20, overflow: "hidden", boxShadow: d ? "0 8px 40px rgba(0,0,0,0.5)" : "0 8px 40px rgba(0,0,0,0.12)" }}>
        <div style={{ background: HEADER_BG, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 32px 28px" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
            <AriesLogo size={56} />
          </div>
          <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 24, margin: 0 }}>Aries</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", margin: "5px 0 0" }}>
            Family Health Tracker
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 10 }}>Sign in to your account</p>
        </div>

        <div style={{ background: cardBg, padding: "28px 32px 24px", transition: "background 0.3s" }}>
          {registered && !error && (
            <div style={{ marginBottom: 16, padding: "9px 13px", borderRadius: 8, background: d ? "#14532d" : "#f0fdf4", border: "1px solid " + (d ? "#166534" : "#bbf7d0"), color: d ? "#86efac" : "#166534", fontSize: 13 }}>
              Account created! You can now sign in.
            </div>
          )}
          {error && (
            <div style={{ marginBottom: 16, padding: "9px 13px", borderRadius: 8, background: d ? "#450a0a" : "#fef2f2", border: "1px solid " + (d ? "#7f1d1d" : "#fecaca"), color: d ? "#fca5a5" : "#991b1b", fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="login-email" style={{ display: "block", fontSize: 13, fontWeight: 600, color: labelText, marginBottom: 5 }}>Email</label>
              <input
                id="login-email" type="email" inputMode="email" autoComplete="email"
                placeholder="you@example.com" value={email} required
                onChange={e => setEmail(e.target.value)}
                style={{ width: "100%", height: 44, padding: "0 12px", borderRadius: 8, border: "1.5px solid " + inputBorder, fontSize: 14, color: inputText, background: inputBg, outline: "none", boxSizing: "border-box" }}
                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                onBlur={e  => (e.currentTarget.style.borderColor = inputBorder)}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 600, color: labelText }}>Password</label>
                <button type="button" style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, cursor: "pointer", background: "none", border: "none", padding: 0 }}
                  onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="login-password" type={showPwd ? "text" : "password"}
                autoComplete="current-password" placeholder="••••••••"
                value={password} required
                onChange={e => setPassword(e.target.value)}
                style={{ width: "100%", height: 44, padding: "0 12px", borderRadius: 8, border: "1.5px solid " + inputBorder, fontSize: 14, color: inputText, background: inputBg, outline: "none", boxSizing: "border-box" }}
                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                onBlur={e  => (e.currentTarget.style.borderColor = inputBorder)}
              />
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", height: 44, borderRadius: 10, background: loading ? "#9ca3af" : PRIMARY, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = PRIMARY_HOVER; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = PRIMARY; }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
