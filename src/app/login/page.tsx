"use client";

import Link from "next/link";
import { ChevronLeft, Shield, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const siteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_TURNSTILE_KEY ||
    process.env.CLOUDFLARE_SITE_TURNSTILE_KEY ||
    "";

  return (
    <div className="min-h-screen w-full bg-background text-foreground grid lg:grid-cols-2">
      
      {/* LEFT COLUMN: Clean Shadcn Login Form */}
      <div className="flex flex-col justify-between p-4 sm:p-8 lg:p-10 min-h-screen lg:h-screen overflow-y-auto">
        
        {/* Top Header: Brand & Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Shield className="size-4.5" />
            </div>
            <span className="font-bold">ThreatLens</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              <span>Back to home</span>
            </Link>
            <div className="h-3.5 w-px bg-border"></div>
            <ThemeToggle />
          </div>
        </div>

        {/* Center: Main Login Container */}
        <div className="mx-auto w-full max-w-[420px] py-4 sm:py-6 my-auto">
          <div className="space-y-1.5 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sign In to ThreatLens</h1>
            <p className="text-sm text-muted-foreground">
              Authenticate via your authorized security provider:
            </p>
          </div>

          <LoginForm siteKey={siteKey} />
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
              Unified Cyber Threat Intelligence Platform
            </h2>

            <p className="text-base text-zinc-300/90 leading-relaxed">
              Access real-time IOC correlation, automated incident playbooks, and unified forensic telemetry in one responsive workspace.
            </p>
          </div>

          {/* Bottom Feature Card & Social Proof */}
          <div className="relative z-10 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 p-6 sm:p-7 backdrop-blur-md shadow-2xl space-y-5">
            {/* Top-Right Square Icon Badge */}
            <div className="absolute top-6 right-6 size-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white shadow-inner">
              <Shield className="size-6 text-zinc-200" />
            </div>

            {/* Card Content */}
            <div className="space-y-1.5 pr-14">
              <h3 className="text-lg font-bold tracking-tight text-white">
                Zero-Trust SOC Whitelisting
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Invite-only RBAC authorization with verified Google credentials.
              </p>
            </div>

            {/* Branding & Creator Attribution Deck */}
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
