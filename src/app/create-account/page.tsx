"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Shield,
  Mail,
  User,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe,
  Lock,
  Link2,
  Check,
  UserCheck,
  ExternalLink,
  Clock,
  RefreshCw,
  Edit3,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/utils/supabase/client";


export default function CreateAccountPage() {
  // Main form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [website, setWebsite] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [discordName, setDiscordName] = useState("");

  // Submission & loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<"google" | "discord" | "form" | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [prefillSource, setPrefillSource] = useState<string | null>(null);
  const [isUnauthorizedAttempt, setIsUnauthorizedAttempt] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Pending Clearance Request States
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isEditingPending, setIsEditingPending] = useState(false);
  const [statusCheckedNotice, setStatusCheckedNotice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const [resolvedSiteKey, setResolvedSiteKey] = useState(
    process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_TURNSTILE_KEY ||
    process.env.CLOUDFLARE_SITE_TURNSTILE_KEY ||
    ""
  );

  useEffect(() => {
    // Dynamic fallback from server API to prevent dummy testing banner
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
  }, []);

  // On mount: read the verified identity (signed cookie set by the auth callback after a
  // Google / Discord sign-in) and any earlier application. Nothing personal travels in the URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("prefill");
    const unregistered = params.get("unregistered") || params.get("unauthorized");

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the URL once on mount
    if (unregistered === "1") setIsUnauthorizedAttempt(true);
    if (prefill) setPrefillSource(prefill);

    let savedLocal: any = null;
    try {
      const stored = localStorage.getItem("threatlens_access_application");
      if (stored) savedLocal = JSON.parse(stored);
    } catch {}

    fetch("/api/auth/prefill", { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => ({}))
      .then((p: any) => {
        if (p.fullName) setFullName(p.fullName);
        if (p.email) setEmail(p.email);
        if (p.discordId) setDiscordId(p.discordId);
        if (p.discordName) setDiscordName(p.discordName);

        const checkEmail = p.email || savedLocal?.email || "";
        const checkDiscordId = p.discordId || savedLocal?.discordId || "";

        if (checkEmail || checkDiscordId) {
          setIsCheckingStatus(true);
          const query = checkEmail ? `email=${encodeURIComponent(checkEmail)}` : `discordId=${encodeURIComponent(checkDiscordId)}`;
          fetch(`/api/auth/request-access?${query}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success && d.request) {
                // The public lookup returns the status only; keep the details we already have.
                const merged = { ...(savedLocal || {}), ...d.request };
                setPendingRequest(merged);
                try {
                  localStorage.setItem("threatlens_access_application", JSON.stringify(merged));
                } catch {}
              } else if (savedLocal && savedLocal.status) {
                setPendingRequest(savedLocal);
              }
            })
            .catch((err) => {
              console.warn("Could not check access request status:", err);
              if (savedLocal) setPendingRequest(savedLocal);
            })
            .finally(() => setIsCheckingStatus(false));
        } else if (savedLocal && savedLocal.status) {
          setPendingRequest(savedLocal);
        }
      });

    // Clean up the URL without reloading
    if (prefill || unregistered) {
      window.history.replaceState({}, "", "/create-account");
    }
  }, []);

  // Turnstile Widget setup
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

  // OAuth Auto-fill Handlers (Gets info, pre-fills the form, does not bypass onboarding)
  const handleOAuthAutofill = async (provider: "google" | "discord") => {
    setIsLoading(true);
    setLoadingProvider(provider);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/create-account`,
          queryParams:
            provider === "google"
              ? {
                  access_type: "offline",
                  prompt: "select_account",
                }
              : undefined,
        },
      });

      if (error) {
        setErrorMsg(error.message || `Could not connect to ${provider} to auto-fill details.`);
        setIsLoading(false);
        setLoadingProvider(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || `An error occurred while connecting to ${provider}.`);
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  // Main Form Submission (Manual Access Request)
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setErrorMsg("Please verify your name and email with Google first.");
      return;
    }
    if (!turnstileToken) {
      setErrorMsg("Please complete the verification check.");
      return;
    }

    // Strict URL validation for optional LinkedIn / Portfolio Website
    const trimmedWebsite = website.trim();
    if (trimmedWebsite) {
      if (!/^https?:\/\//i.test(trimmedWebsite)) {
        setErrorMsg("LinkedIn / Website URL must start with https:// (e.g. https://linkedin.com/in/username or https://yourdomain.com).");
        return;
      }
      const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i;
      if (!urlPattern.test(trimmedWebsite)) {
        setErrorMsg("Please provide a valid LinkedIn or website URL starting with https:// (e.g. https://linkedin.com/in/username).");
        return;
      }
    }

    setIsLoading(true);
    setLoadingProvider("form");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Name, email and Discord ID are deliberately not sent: the server takes them from the
        // signed cookie created by the Google / Discord sign-in.
        body: JSON.stringify({
          organization: organization.trim(),
          website: website.trim(),
          purpose: purpose.trim(),
          turnstileToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit request. Please try again.");
      }

      const savedRequest = data.request || {
        fullName: fullName.trim(),
        email: email.trim(),
        organization: organization.trim(),
        website: website.trim(),
        discordId: discordId.trim(),
        purpose: purpose.trim(),
        status: "PENDING",
        submittedAt: new Date().toISOString(),
      };

      setPendingRequest(savedRequest);
      setIsEditingPending(false);
      try {
        localStorage.setItem("threatlens_access_application", JSON.stringify(savedRequest));
      } catch {}

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit request. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  // Status refresh check for pending applicants
  const checkLatestStatus = async () => {
    setIsCheckingStatus(true);
    setStatusCheckedNotice(null);
    const targetEmail = pendingRequest?.email || email;
    const targetDiscord = pendingRequest?.discordId || discordId;
    const query = targetEmail ? `email=${encodeURIComponent(targetEmail)}` : `discordId=${encodeURIComponent(targetDiscord)}`;
    try {
      const res = await fetch(`/api/auth/request-access?${query}`);
      const data = await res.json();
      if (data.success && data.request) {
        const merged = { ...(pendingRequest || {}), ...data.request };
        setPendingRequest(merged);
        try {
          localStorage.setItem("threatlens_access_application", JSON.stringify(merged));
        } catch {}
        if (data.request.status === "APPROVED") {
          setStatusCheckedNotice("Clearance Approved! You can now proceed to login.");
        } else if (data.request.status === "REJECTED") {
          setStatusCheckedNotice("Application was reviewed and declined.");
        } else {
          setStatusCheckedNotice("Application is currently under manual review by the SOC Administrator.");
        }
      } else {
        setStatusCheckedNotice("Application is currently under review by SOC administrators.");
      }
    } catch (e) {
      setStatusCheckedNotice("Could not connect to verify status. Please try again.");
    } finally {
      setIsCheckingStatus(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-background text-foreground grid lg:grid-cols-2 relative">
      
      {/* LEFT COLUMN: Access Request Form */}
      <div className="flex flex-col justify-between p-4 sm:p-6 lg:px-8 lg:py-4 min-h-screen lg:h-screen overflow-y-auto">
        
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
        <div className="mx-auto w-full max-w-[440px] my-auto">
          {(!pendingRequest || pendingRequest.status !== "PENDING" || isEditingPending) && (
            <div className="space-y-1 mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Private Access Preview</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Request Account Access</h1>
              <p className="text-xs text-muted-foreground">
                ThreatLens is strictly invite-only. Submit your application for manual SOC authorization:
              </p>
            </div>
          )}

          {/* Alert if redirected from login attempt with no existing account (only if not already pending review) */}
          {isUnauthorizedAttempt && (!pendingRequest || pendingRequest.status !== "PENDING" || isEditingPending) ? (
            <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">
                  No authorized account found for this login
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  We pre-filled your available details from {prefillSource === "google" ? "Google" : prefillSource === "discord" ? "Discord" : "your account"}. Please complete your organization and research focus below to apply for access.
                </p>
              </div>
            </div>
          ) : !isUnauthorizedAttempt && prefillSource && (!pendingRequest || pendingRequest.status !== "PENDING" || isEditingPending) ? (
            <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-foreground flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">
                  Pre-filled via {prefillSource === "google" ? "Google" : "Discord"}.
                </span>{" "}
                <span className="text-muted-foreground text-[11px]">
                  Please complete your organization and research purpose below.
                </span>
              </div>
            </div>
          ) : null}

          {/* 1. Approved State */}
          {pendingRequest && pendingRequest.status === "APPROVED" ? (
            <div className="space-y-5 rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-lg shadow-emerald-500/5 animate-in fade-in zoom-in-95 duration-200">
              <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-semibold mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Clearance Status: Approved & Whitelisted</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Access Clearance Granted!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your identity for <strong className="text-foreground">{pendingRequest.email || email}</strong> has been authorized by the SOC Administrator. You can now log into ThreatLens.
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-500 transition-colors shadow-md"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : pendingRequest && pendingRequest.status === "PENDING" && !isEditingPending ? (
            /* 2. Pending Clearance Review State */
            <div className="space-y-2.5 rounded-2xl border border-amber-500/30 bg-card p-3.5 sm:p-4 shadow-lg shadow-amber-500/5 animate-in fade-in zoom-in-95 duration-200">
              {/* Top Status Header */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs font-semibold">
                  <span>Clearance Status: Pending Review</span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {pendingRequest.submittedAt ? new Date(pendingRequest.submittedAt).toLocaleDateString() : "Active"}
                </span>
              </div>

              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-amber-500" />
                  Application Under SOC Review
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your access application has been submitted and queued for manual SOC authorization. Suraj Vishwanath and the administration team have been alerted.
                </p>
              </div>

              {/* Summary Box */}
              <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-1.5 text-xs">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Submitted Application Summary
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <div className="text-muted-foreground text-[10px]">Full Name</div>
                    <div className="font-medium text-foreground text-xs flex items-center gap-1.5">
                      <User className="size-3 text-primary" />
                      <span>{pendingRequest.fullName || fullName}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-muted-foreground text-[10px]">Email Address</div>
                    <div className="font-medium text-foreground text-xs font-mono flex items-center gap-1.5 truncate">
                      <Mail className="size-3 text-primary" />
                      <span className="truncate">{pendingRequest.email || email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5 pt-1 border-t border-border/60">
                  <div className="text-muted-foreground text-[10px]">Organization / Affiliation</div>
                  <div className="font-medium text-foreground text-xs flex items-center gap-1.5">
                    <Building2 className="size-3 text-primary shrink-0" />
                    <span>{pendingRequest.organization || organization}</span>
                  </div>
                </div>

                {pendingRequest.website && (
                  <div className="space-y-0.5 pt-1 border-t border-border/60">
                    <div className="text-muted-foreground text-[10px]">Portfolio / Website</div>
                    <a
                      href={pendingRequest.website.startsWith("http") ? pendingRequest.website : `https://${pendingRequest.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1.5 truncate text-xs"
                    >
                      <Globe className="size-3 shrink-0" />
                      <span className="truncate">{pendingRequest.website}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </div>
                )}

                {pendingRequest.discordId && (
                  <div className="space-y-0.5 pt-1 border-t border-border/60">
                    <div className="text-muted-foreground text-[10px]">Discord Snowflake ID</div>
                    <div className="font-mono text-foreground text-xs flex items-center gap-1.5">
                      <UserCheck className="size-3 text-[#5865F2]" />
                      <span>{pendingRequest.discordId}</span>
                    </div>
                  </div>
                )}

                {pendingRequest.purpose && (
                  <div className="space-y-0.5 pt-1 border-t border-border/60">
                    <div className="text-muted-foreground text-[10px]">Intended Focus & Research Purpose</div>
                    <p className="text-foreground/90 italic leading-relaxed text-[11px] bg-background/50 p-1.5 rounded-lg border border-border/50">
                      &quot;{pendingRequest.purpose}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Real-time notification check message */}
              {statusCheckedNotice && (
                <div className="p-2 rounded-lg bg-background border border-border text-xs text-foreground flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="size-3.5 text-primary shrink-0" />
                  <span>{statusCheckedNotice}</span>
                </div>
              )}

              {/* Compact Informational SOC Notice */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-muted-foreground">
                <ShieldAlert className="size-3.5 text-amber-500 shrink-0" />
                <span>SOC clearance is manual. Whitelisting is automatic once approved.</span>
              </div>

              {/* Actions */}
              <div className="space-y-1.5 pt-0.5">
                <button
                  onClick={checkLatestStatus}
                  disabled={isCheckingStatus}
                  type="button"
                  className="inline-flex h-8.5 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isCheckingStatus ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  <span>Check Clearance Status</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsEditingPending(true)}
                    type="button"
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Edit3 className="size-3 text-muted-foreground" />
                    <span>Edit Details</span>
                  </button>

                  <Link
                    href="/login"
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="size-3 text-muted-foreground" />
                    <span>Back to Login</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Error banner */}
              {errorMsg && (
                <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3.5 text-sm text-destructive font-medium flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: identity comes from Google (name + email) and, optionally, Discord. It cannot be typed in. */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">1. Verify your identity</span>
                  <span className="text-[11px] text-muted-foreground">
                    {fullName && email ? "Verified" : "Required"}
                  </span>
                </div>
                <button
                  onClick={() => handleOAuthAutofill("google")}
                  disabled={isLoading}
                  type="button"
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {loadingProvider === "google" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <svg className="size-3.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                  )}
                  <span>{fullName && email ? "Use a different Google account" : "Continue with Google"}</span>
                </button>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Your name and email are taken from your Google account and cannot be edited, so your request is tied to a verified address.
                </p>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none text-foreground select-none">Full Name*</label>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Lock className="size-3" />
                      {fullName ? "Verified by Google" : "Filled by Google sign-in"}
                    </span>
                  </div>
                  <div className="relative flex w-full min-w-0 items-center rounded-lg border border-input bg-muted/50 shadow-xs">
                    <div className="flex shrink-0 items-center justify-center pl-3.5 pr-1 text-muted-foreground">
                      <User className="size-4" />
                    </div>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      aria-readonly="true"
                      value={fullName}
                      placeholder="Click “Continue with Google” above"
                      className="h-10 w-full min-w-0 cursor-not-allowed select-text bg-transparent px-2.5 py-2 text-sm text-foreground/90 outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none text-foreground select-none">Email Address*</label>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Lock className="size-3" />
                      {email ? "Verified by Google" : "Filled by Google sign-in"}
                    </span>
                  </div>
                  <div className="relative flex w-full min-w-0 items-center rounded-lg border border-input bg-muted/50 shadow-xs">
                    <div className="flex shrink-0 items-center justify-center pl-3.5 pr-1 text-muted-foreground">
                      <Mail className="size-4" />
                    </div>
                    <input
                      type="email"
                      readOnly
                      tabIndex={-1}
                      aria-readonly="true"
                      value={email}
                      placeholder="Click “Continue with Google” above"
                      className="h-10 w-full min-w-0 cursor-not-allowed select-text bg-transparent px-2.5 py-2 text-sm text-foreground/90 outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Organization / Role */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium leading-none text-foreground select-none">
                    Organization / Academic Affiliation*
                  </label>
                  <div
                    role="group"
                    className="group/input-group relative flex w-full min-w-0 items-center rounded-lg border border-input bg-background shadow-xs transition-all focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25"
                  >
                    <div className="flex shrink-0 items-center justify-center pl-3.5 pr-1 text-muted-foreground transition-colors group-focus-within/input-group:text-foreground">
                      <Building2 className="size-4" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={150}
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. University Researcher, SOC Analyst, Independent"
                      className="h-10 w-full min-w-0 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* LinkedIn / Portfolio Website */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none text-foreground select-none">
                      LinkedIn / Portfolio Website
                    </label>
                    <span className="text-[11px] text-muted-foreground">Optional</span>
                  </div>
                  <div
                    role="group"
                    className="group/input-group relative flex w-full min-w-0 items-center rounded-lg border border-input bg-background shadow-xs transition-all focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25"
                  >
                    <div className="flex shrink-0 items-center justify-center pl-3.5 pr-1 text-muted-foreground transition-colors group-focus-within/input-group:text-foreground">
                      <Globe className="size-4" />
                    </div>
                    <input
                      type="url"
                      maxLength={250}
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      onBlur={() => {
                        const val = website.trim();
                        if (val && !/^https?:\/\//i.test(val) && val.includes('.')) {
                          setWebsite(`https://${val}`);
                        }
                      }}
                      placeholder="e.g. https://linkedin.com/in/username or https://yourdomain.dev"
                      className="h-10 w-full min-w-0 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  {website.trim() && !/^https?:\/\//i.test(website.trim()) && (
                    <p className="text-[11px] text-amber-500/90 font-medium">
                      Must start with https:// (e.g. https://linkedin.com/in/username or https://yourdomain.com)
                    </p>
                  )}
                </div>

                {/* Discord ID: only ever filled by signing in with Discord, never typed */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none text-foreground select-none">Discord User ID</label>
                    <span className="text-[11px] text-muted-foreground">Optional (for Discord RBAC)</span>
                  </div>
                  <div className="relative flex w-full min-w-0 items-center rounded-lg border border-input bg-muted/50 shadow-xs">
                    <div className="flex shrink-0 items-center justify-center pl-3.5 pr-1 text-[#5865F2]">
                      <svg className="size-4 fill-current" viewBox="0 0 127.14 96.36">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.1,46,96,53,91.08,65.69,84.69,65.69Z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      aria-readonly="true"
                      value={discordId}
                      placeholder="Not linked: use the button to fetch it"
                      className="h-10 w-full min-w-0 cursor-not-allowed select-text bg-transparent px-2.5 py-2 text-sm font-mono text-foreground/90 outline-none placeholder:font-sans placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => handleOAuthAutofill("discord")}
                      disabled={isLoading}
                      className="mr-1.5 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-[#5865F2] px-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {loadingProvider === "discord" ? <Loader2 className="size-3 animate-spin" /> : <Link2 className="size-3" />}
                      <span>{discordId ? "Re-link" : "Link Discord"}</span>
                    </button>
                  </div>
                  {discordId && (
                    <p className="flex items-center gap-1 pl-1 text-[11px] text-emerald-500">
                      <Check className="size-3" />
                      <span>Linked via Discord sign-in{discordName ? ` as ${discordName}` : ""}</span>
                    </p>
                  )}
                </div>

                {/* Purpose */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="purpose" className="text-sm font-medium leading-none text-foreground select-none">
                      Intended Research Focus / Purpose*
                    </label>
                    <span className="text-[11px] tabular-nums text-muted-foreground">{purpose.length}/600</span>
                  </div>
                  <textarea
                    id="purpose"
                    required
                    minLength={5}
                    maxLength={600}
                    rows={9}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Tell us what you want to use ThreatLens for: your role, the kind of investigations (IOC hunting, malware telemetry, incident correlation), and anything that helps us review your request."
                    className="min-h-[220px] w-full resize-y rounded-lg border border-input bg-background px-3.5 py-3 text-sm leading-relaxed shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </div>

                {/* Turnstile Captcha container */}
                <div className="flex justify-center py-1 min-h-[65px]" ref={containerRef} />

                {/* Submit button: Button 52 (Orion Button) */}
                <button
                  type="submit"
                  disabled={isLoading || !turnstileToken || !fullName || !email}
                  className="relative inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[inset_0_2px_3px_0_var(--primary),inset_2px_-4px_4px_0_rgba(0,0,0,0.25),inset_-2px_4px_4px_0_rgba(255,255,255,0.35)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_0_var(--primary),inset_1px_-1.5px_2px_0_rgba(0,0,0,0.25),inset_-1px_1.5px_2px_0_rgba(255,255,255,0.35)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                >
                  {isLoading && loadingProvider === "form" ? (
                    <Loader2 className="size-4 animate-spin text-primary-foreground" />
                  ) : (
                    "Submit Access Request"
                  )}
                </button>

                <div className="text-center text-sm text-muted-foreground pt-2">
                  Already authorized on ThreatLens?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-foreground underline-offset-4 hover:underline transition-colors"
                  >
                    Sign in here
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer: Legal & Terms */}
        <div className="text-center sm:text-left text-[11px] text-muted-foreground pt-1 pb-1">
          By submitting, you agree to our{" "}
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

      {/* RIGHT COLUMN: Visual Feature Deck */}
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

          {/* Ambient lighting glow */}
          <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-transparent blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent blur-[100px] pointer-events-none" />
          
          {/* Top Header Deck */}
          <div className="relative z-10 space-y-4 max-w-lg">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.15]">
              Join the ThreatLens Platform
            </h2>

            <p className="text-base text-zinc-300/90 leading-relaxed">
              Explore IOC correlation, automated incident playbooks, and unified forensic telemetry in one responsive workspace.
            </p>
          </div>

          {/* Bottom Feature Card */}
          <div className="relative z-10 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 p-6 sm:p-7 backdrop-blur-md shadow-2xl space-y-5">
            <div className="absolute top-6 right-6 size-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white shadow-inner">
              <Shield className="size-6 text-zinc-200" />
            </div>

            <div className="space-y-1.5 pr-14">
              <h3 className="text-lg font-bold tracking-tight text-white">
                Zero-Trust Whitelisting
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Access is strictly granted to vetted researchers and security teams to maintain SOC boundary integrity.
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
