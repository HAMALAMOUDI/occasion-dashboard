"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { postJson } from "@/lib/client";

// Only allow redirects back into this site after signing in.
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [normalized, setNormalized] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    const res = await postJson<{ phone: string; demoCode?: string }>("/api/auth/request-code", { phone });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNormalized(res.data.phone);
    setDemoCode(res.data.demoCode ?? null);
    setCode("");
    setStep("code");
    setCooldown(60);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await postJson("/api/auth/verify", { phone: normalized, code });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="card w-full max-w-md p-6 sm:p-8 animate-fade-up">
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine text-white font-serif text-xl">O</span>
        <span className="font-serif text-2xl">Occasion</span>
      </div>

      {step === "phone" ? (
        <form onSubmit={sendCode} className="mt-8">
          <h1 className="font-serif text-3xl">Welcome 👋</h1>
          <p className="mt-2 text-muted">Sign in with your mobile number to see your events. We&apos;ll send you a code on WhatsApp.</p>

          <label htmlFor="phone" className="label mt-6">
            Mobile number
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05X XXX XXXX"
            className="input text-base tracking-wide"
          />
          <p className="mt-1.5 text-xs text-muted">Saudi numbers can start with 05. For other countries, include the + code.</p>

          {error && <p className="mt-4 rounded-xl bg-decline-bg px-4 py-3 text-sm text-decline">{error}</p>}

          <button type="submit" disabled={busy || !phone.trim()} className="btn-primary btn-md mt-6 w-full py-3">
            <MessageCircle size={16} /> {busy ? "Sending…" : "Send me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8">
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft size={15} /> Change number
          </button>
          <h1 className="font-serif text-3xl mt-3">Check your WhatsApp</h1>
          <p className="mt-2 text-muted">
            We sent a 6-digit code to <span className="font-medium text-ink tabular-nums">{normalized}</span>.
          </p>

          {demoCode && (
            <p className="mt-4 rounded-xl bg-pending-bg px-4 py-3 text-sm text-pending">
              WhatsApp isn&apos;t connected yet, so here&apos;s your code: <span className="font-mono font-semibold tracking-widest">{demoCode}</span>
            </p>
          )}

          <label htmlFor="code" className="label mt-6">
            Code
          </label>
          <input
            id="code"
            ref={codeRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className="input text-center font-mono text-2xl tracking-[0.5em]"
          />

          {error && <p className="mt-4 rounded-xl bg-decline-bg px-4 py-3 text-sm text-decline">{error}</p>}

          <button type="submit" disabled={busy || code.length !== 6} className="btn-primary btn-md mt-6 w-full py-3">
            {busy ? "Checking…" : "Sign in"} <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => sendCode()}
            disabled={busy || cooldown > 0}
            className="mt-3 w-full text-center text-sm text-muted hover:text-ink disabled:hover:text-muted"
          >
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--pine-soft),transparent_60%)] px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
