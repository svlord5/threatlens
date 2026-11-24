"use client";

import { isDemoMode } from "@/lib/demo";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, ChevronRight, AlertCircle, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface LoginFormProps {
  siteKey: string;
}

export default function LoginForm({ siteKey }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<"google" | "email" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();
  const demo = isDemoMode(); // demo: no captcha, any credentials work
  const containerRef = useRef<HTMLDivElement>(null);
  const [resolvedSiteKey, setResolvedSiteKey] = useState(siteKey && !siteKey.startsWith("1x000") ? siteKey : "");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!siteKey || siteKey === "undefined" || siteKey === "" || siteKey.startsWith("1x000")) {
        fetch("/api/turnstile-key")
          .then((r) => r.json())
          .then((d) => {
            if (d.siteKey && !d.siteKey.startsWith("1x000")) {
              setResolvedSiteKey(d.siteKey);
            } else {
              setResolvedSiteKey("");
            }
          })
          .catch(() => setResolvedSiteKey(""));
      }
    }
  }, [siteKey]);

  useEffect(() => {
    let widgetId: string | null = null;

    const renderTurnstile = () => {
      if (typeof window !== "undefined" && (window as any).turnstile && containerRef.current) {
        try {
          containerRef.current.innerHTML = "";
          const newDiv = document.createElement("div");
          containerRef.current.appendChild(newDiv);

          widgetId = (window as any).turnstile.render(newDiv, {
            sitekey: resolvedSiteKey,
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
  }, [resolvedSiteKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      const errDesc = params.get("error_description");
      const raw = errDesc || err;
      if (raw) {
        const decoded = decodeURIComponent(raw).trim();
        const lower = decoded.toLowerCase();

        if (lower === "unauthorized") {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- shows an error from the URL once on mount
          setErrorMsg("Access restricted: Your identity is not yet authorized in our IAM registry. Please submit an access request below to register.");
        } else if (lower === "auth_failed") {
          setErrorMsg("Authentication session could not be established. Please try signing in again, or submit an access request below.");
        } else if (lower.includes("pkce") || lower.includes("code verifier")) {
          setErrorMsg("Authentication session verification timed out or was interrupted. Please try clicking your login provider again.");
        } else if (lower.includes("invalid_grant") || lower.includes("already been used")) {
          setErrorMsg("The login authorization code has expired or was already used. Please click below to sign in again.");
        } else if (lower === "access_denied") {
          setErrorMsg("Sign-in was cancelled at the provider. Please try again when you are ready.");
        } else {
          setErrorMsg(decoded);
        }

        // Clean up error query parameters from URL without reloading
        try {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("error");
          cleanUrl.searchParams.delete("error_description");
          const queryStr = cleanUrl.searchParams.toString();
          const newPath = cleanUrl.pathname + (queryStr ? `?${queryStr}` : "") + cleanUrl.hash;
          window.history.replaceState({}, document.title, newPath);
        } catch (_) {}
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setLoadingProvider("google");
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setErrorMsg(error.message || "Google sign-in is currently unavailable. Please try again.");
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demo && !turnstileToken) {
      setErrorMsg("Please complete the verification check.");
      return;
    }

    setIsLoading(true);
    setLoadingProvider("email");
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
      options: {
        captchaToken: turnstileToken ?? undefined,
      },
    });

    if (error) {
      setErrorMsg(error.message || "Invalid credentials. Please verify your email and password.");
      setIsLoading(false);
      setLoadingProvider(null);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="space-y-6">
      {demo && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs sm:text-sm text-amber-200 space-y-2">
          <p className="font-semibold">Demo mode: synthetic data, no sign-in needed.</p>
          <p>Use any email and password, or open the dashboard directly. Nothing is saved. To run it for real, set the Supabase and API keys in your environment (see the README).</p>
          <a href="/dashboard" className="inline-block font-semibold underline underline-offset-4">Open the demo dashboard</a>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3.5 sm:p-4 text-sm text-destructive space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="size-4.5 shrink-0 mt-0.5 text-destructive" />
            <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
              {errorMsg}
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-destructive/70 hover:text-destructive transition-colors p-0.5"
              aria-label="Dismiss error"
            >
              <X className="size-4" />
            </button>
          </div>
          {(errorMsg.toLowerCase().includes("access") ||
            errorMsg.toLowerCase().includes("whitelist") ||
            errorMsg.toLowerCase().includes("session") ||
            errorMsg.toLowerCase().includes("authorized") ||
            errorMsg.toLowerCase().includes("register")) && (
            <div className="pt-1 text-left sm:text-center border-t border-destructive/20 mt-2">
              <Link
                href="/create-account"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                <span>Request Access & Onboarding</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Social / SSO Buttons with Button 52 (Orion Button) styling */}
      <div className="space-y-3">
        {/* Google SSO - Button 52 (Orion Secondary) */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          type="button"
          className="relative inline-flex h-11 w-full items-center justify-center gap-3 rounded-md bg-secondary text-secondary-foreground px-6 text-sm font-semibold shadow-[inset_0_2px_3px_0_var(--secondary),inset_2px_-4px_4px_0_rgba(0,0,0,0.25),inset_-2px_4px_4px_0_rgba(255,255,255,0.35)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_0_var(--secondary),inset_1px_-1.5px_2px_0_rgba(0,0,0,0.25),inset_-1px_1.5px_2px_0_rgba(255,255,255,0.35)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
        >
          {loadingProvider === "google" ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <svg className="size-4.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          <span>Login with Google</span>
        </button>
      </div>

      {/* Email & Password Authentication (Commented Out)
      <div className="relative flex items-center justify-center text-xs uppercase">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-background px-3 text-muted-foreground text-xs">
          Or continue with Email
        </span>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
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
              placeholder="Enter your email address"
              className="h-10 w-full min-w-0 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none text-foreground select-none">
            Password*
          </label>
          <div
            role="group"
            className="group/input-group relative flex w-full min-w-0 items-center rounded-lg border border-input bg-background shadow-xs transition-all focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25"
          >
            <div className="flex shrink-0 items-center justify-center pl-3.5 pr-1 text-muted-foreground transition-colors group-focus-within/input-group:text-foreground">
              <Lock className="size-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              className="h-10 w-full min-w-0 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex shrink-0 items-center justify-center pr-2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-input text-primary focus:ring-ring"
            />
            <span>Remember Me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="flex justify-center py-1 min-h-[65px]" ref={containerRef} />

        <button
          type="submit"
          disabled={isLoading || (!demo && !turnstileToken)}
          className="relative inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[inset_0_2px_3px_0_var(--primary),inset_2px_-4px_4px_0_rgba(0,0,0,0.25),inset_-2px_4px_4px_0_rgba(255,255,255,0.35)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_0_var(--primary),inset_1px_-1.5px_2px_0_rgba(0,0,0,0.25),inset_-1px_1.5px_2px_0_rgba(255,255,255,0.35)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
        >
          {loadingProvider === "email" ? (
            <Loader2 className="size-4 animate-spin text-primary-foreground" />
          ) : (
            "Sign in to ThreatLens"
          )}
        </button>
      </form>
      */}

      {/* Dedicated Create Account Link */}
      <div className="text-center text-sm text-muted-foreground">
        New on our platform?{" "}
        <Link
          href="/create-account"
          className="font-semibold text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
