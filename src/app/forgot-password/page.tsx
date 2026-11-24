"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Shield, Mail, Loader2, CheckCircle2, AlertCircle, ExternalLink, HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const supabase = createClient();
  const containerRef = useRef<HTMLDivElement>(null);

  const siteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_TURNSTILE_KEY ||
    process.env.CLOUDFLARE_SITE_TURNSTILE_KEY ||
    "";

  useEffect(() => {
    let widgetId: string | null = null;

    const renderTurnstile = () => {
      if (typeof window !== "undefined" && (window as any).turnstile && containerRef.current) {
        try {
          containerRef.current.innerHTML = "";
          const newDiv = document.createElement("div");
          containerRef.current.appendChild(newDiv);

          widgetId = (window as any).turnstile.render(newDiv, {
            sitekey: siteKey,
            theme: "auto",
            callback: (token: string) => {
              setTurnstileToken(token);
              setErrorMsg(null);
            },
            "expired-callback": () => setTurnstileToken(null),
            "error-callback": () => {
              setTurnstileToken(null);
              setErrorMsg("Captcha verification failed. Please try again.");
            },
          });
        } catch (e) {
          console.error("Turnstile render error:", e);
        }
      }
    };

    if (typeof window !== "undefined" && (window as any).turnstile) {
      renderTurnstile();
    } else {
      const interval = setInterval(() => {
        if (typeof window !== "undefined" && (window as any).turnstile) {
          renderTurnstile();
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetId && typeof window !== "undefined" && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetId);
        } catch (e) {}
      }
    };
  }, [siteKey]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setErrorMsg("Please complete the verification check.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/account`,
      captchaToken: turnstileToken,
    });

    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message || "Unable to send reset instructions. Please verify your email.");
    } else {
      setIsSuccess(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground grid lg:grid-cols-2">
      
      {/* LEFT COLUMN: Reset Form */}
      <div className="flex flex-col justify-between p-4 sm:p-8 lg:p-10 min-h-screen lg:h-screen overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Shield className="size-4.5" />
            </div>
            <span className="font-bold">ThreatLens</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              <span>Back to login</span>
            </Link>
            <div className="h-3.5 w-px bg-border"></div>
            <ThemeToggle />
          </div>
        </div>

        {/* Center Container */}
        <div className="mx-auto w-full max-w-[420px] py-4 sm:py-6 my-auto">
          <div className="space-y-1.5 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Forgot Password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email address to receive password reset instructions.
            </p>
          </div>

          {isSuccess ? (
            <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">Check your inbox</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If an account exists for <strong className="text-foreground">{email}</strong>, a password reset link has been dispatched.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/80 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="size-3.5 text-muted-foreground" />
                  <span>Didn&apos;t receive an email?</span>
                </div>
                <p>Check your spam folder or reach out directly to <a href="mailto:hello@surajv5.in" className="text-primary underline">hello@surajv5.in</a> for account recovery.</p>
              </div>

              <Link
                href="/login"
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {errorMsg && (
                <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3.5 text-sm text-destructive font-medium flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Email Field with Start Icon (input-14) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none text-foreground select-none">
                  Email address*
                </label>
                <div
                  role="group"
                  className="group/input-group relative flex w-full min-w-0 items-center rounded-lg border border-input bg-background shadow-xs transition-all focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25"
                >
                  <div className="flex shrink-0 items-center justify-center pl-3.5 pr-1 text-muted-foreground transition-colors group-focus-within/input-group:text-foreground">
                    <Mail className="size-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="h-10 w-full min-w-0 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Turnstile Captcha container */}
              <div className="flex justify-center py-1 min-h-[65px]" ref={containerRef} />

              {/* Submit button: Button 52 (Orion Button) */}
              <button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="relative inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[inset_0_2px_3px_0_var(--primary),inset_2px_-4px_4px_0_rgba(0,0,0,0.25),inset_-2px_4px_4px_0_rgba(255,255,255,0.35)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_0_var(--primary),inset_1px_-1.5px_2px_0_rgba(0,0,0,0.25),inset_-1px_1.5px_2px_0_rgba(255,255,255,0.35)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin text-primary-foreground" />
                ) : (
                  "Send Reset Instructions"
                )}
              </button>

              {/* Information Note Card */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2 text-xs text-muted-foreground leading-relaxed">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="size-3.5" />
                  <span>Account Recovery Information</span>
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>If you sign in with <strong>Google</strong>, local passwords do not apply. Please use your Google account.</li>
                  <li>Password reset emails are delivered strictly to whitelisted analyst accounts.</li>
                  <li>For urgent manual verification, reach out to <a href="mailto:hello@surajv5.in" className="text-primary underline">hello@surajv5.in</a>.</li>
                </ul>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-2">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-foreground underline-offset-4 hover:underline transition-colors"
                >
                  Back to Sign in
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer: Legal & Terms */}
        <div className="text-center sm:text-left text-xs text-muted-foreground pt-4 pb-3 sm:pb-2">
          By signing in, you agree to our{" "}
          <a href="/terms" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          .{" "}
          <a href="/report" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Report a problem
          </a>
        </div>

      </div>

      {/* RIGHT COLUMN: Shadcn Studio Login 3 Style Visual Feature Panel */}
      <div className="hidden lg:flex p-5 lg:p-6 items-stretch bg-muted/40 h-screen">
        <div className="relative h-full w-full rounded-2xl overflow-hidden bg-zinc-900 dark:bg-zinc-950 text-white p-10 xl:p-14 flex flex-col justify-between border border-zinc-800/80 shadow-2xl">
          
          {/* Background Decorative Faint Watermark SVG */}
          <svg
            className="absolute -bottom-24 -left-24 size-[420px] pointer-events-none select-none"
            style={{ opacity: 0.035 }}
            viewBox="0 0 24 24"
            fill="#ffffff"
            aria-hidden="true"
          >
            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 2.18l7 3.89v4.93c0 4.54-3.14 8.78-7 9.88-3.86-1.1-7-5.34-7-9.88V8.07l7-3.89z" />
          </svg>

          {/* Subtle modern ambient lighting glow */}
          <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-transparent blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent blur-[100px] pointer-events-none" />
          
          {/* Top Header Deck */}
          <div className="relative z-10 space-y-4 max-w-lg">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.15]">
              Credential Recovery & Identity Verification
            </h2>

            <p className="text-base text-zinc-300/90 leading-relaxed">
              Maintain secure authorization across your cyber threat intelligence, forensic logs, and SOC cases.
            </p>
          </div>

          {/* Bottom Feature Card */}
          <div className="relative z-10 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 p-6 sm:p-7 backdrop-blur-md shadow-2xl space-y-5">
            <div className="absolute top-6 right-6 size-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white shadow-inner">
              <Shield className="size-6 text-zinc-200" />
            </div>

            <div className="space-y-1.5 pr-14">
              <h3 className="text-lg font-bold tracking-tight text-white">
                Account Security Center
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Reset requests are validated against zero-trust identity policies and whitelisted directories.
              </p>
            </div>

            {/* Branding & Attribution */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
              <a
                href="https://surajv5.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 group hover:opacity-95 transition-opacity"
              >
                <img
                  src="/api/avatar?u=https%3A%2F%2Fsurajv5.in%2Ficons%2FIcon.png" referrerPolicy="no-referrer"
                  alt="Suraj Vishwanath"
                  className="size-9 rounded-full ring-2 ring-zinc-700/80 group-hover:ring-zinc-400 transition-all object-cover"
                />
                <div className="text-left">
                  <div className="text-xs font-semibold text-white group-hover:text-zinc-200 transition-colors flex items-center gap-1.5">
                    <span>Suraj Vishwanath</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/70 text-zinc-300 font-normal">
                      Cyber student & researcher
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    surajv5.in
                  </div>
                </div>
              </a>

              <a
                href="https://surajv5.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/70 transition-all shadow-xs group hover:opacity-95"
              >
                <span className="text-xs font-semibold text-white group-hover:text-zinc-200 transition-colors">
                  surajv5.in
                </span>
                <ExternalLink className="size-3 text-zinc-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
