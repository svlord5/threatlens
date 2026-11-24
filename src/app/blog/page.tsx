import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ThreatLens Intelligence Blog | Suraj Vishwanath',
  description: 'Deep-dives into the latest malware campaigns, reverse engineering reports, and tactical threat intelligence by Suraj Vishwanath.',
  authors: [{ name: 'Suraj Vishwanath', url: 'https://surajv5.in' }],
  openGraph: {
    title: 'ThreatLens Intelligence Blog | Suraj Vishwanath',
    description: 'Deep-dives into the latest malware campaigns, reverse engineering reports, and tactical threat intelligence by Suraj Vishwanath.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThreatLens Intelligence Blog | Suraj Vishwanath',
    description: 'Deep-dives into the latest malware campaigns, reverse engineering reports, and tactical threat intelligence by Suraj Vishwanath.',
  },
};

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight leading-none mb-1">ThreatLens<span className="text-indigo-500">.</span>Blog</span>
              <span className="text-[11px] sm:text-xs text-muted-foreground flex flex-wrap sm:flex-nowrap items-center gap-1 mt-0.5">
                <span className="hidden sm:inline">Researched & Built by</span>
                <span className="sm:hidden">By</span>
                <a href="https://surajv5.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-foreground hover:text-indigo-400 transition-colors whitespace-nowrap">
                  <img src="/api/avatar?u=https%3A%2F%2Fsurajv5.in%2Ficons%2FIcon.png" referrerPolicy="no-referrer" alt="Suraj Vishwanath" className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                  Suraj Vishwanath
                </a>
              </span>
            </div>
          </div>
          <Link href="/dashboard" className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-4 sm:mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
          Intelligence & Research
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Deep-dives into the latest malware campaigns, reverse engineering reports, and tactical threat intelligence.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Featured Article */}
          <Link href="/blog/threat-intel-q2-2026" className="group block col-span-1 md:col-span-2">
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-5 sm:p-8 md:p-12">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Threat Intel
                  </span>
                  <span className="text-xs sm:text-sm font-mono text-muted-foreground">June 27, 2026</span>
                </div>
                
                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 group-hover:text-indigo-400 transition-colors leading-snug">
                  Q2 2026 Campaign Analysis: Volt Typhoon, Scattered Spider, & Midnight Blizzard
                </h2>
                
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-3xl leading-relaxed">
                  A comprehensive structural analysis of three highly sophisticated cyber campaigns. We abstract their execution flows into the MITRE ATT&CK framework and identify critical IOCs and TTPs.
                </p>
                
                <div className="flex items-center text-sm sm:text-base text-indigo-400 font-medium">
                  Read Full Report <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Placeholder Article 1 */}
          <div className="bg-card/50 border border-white/5 rounded-2xl p-8 opacity-50 grayscale">
             <div className="flex items-center gap-3 mb-6">
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Malware Analysis
                </span>
                <span className="text-sm font-mono text-muted-foreground">May 12, 2026</span>
              </div>
              <h2 className="text-xl font-bold mb-3">Deobfuscating DragonForce Ransomware</h2>
              <p className="text-muted-foreground mb-6">A deep technical dive into the encryption routines and persistence mechanisms.</p>
              <div className="flex items-center text-muted-foreground font-medium">
                Coming Soon <ArrowRight className="ml-2 w-4 h-4" />
              </div>
          </div>

          {/* Placeholder Article 2 */}
          <div className="bg-card/50 border border-white/5 rounded-2xl p-8 opacity-50 grayscale">
             <div className="flex items-center gap-3 mb-6">
                <span className="bg-rose-500/20 text-rose-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Zero Day
                </span>
                <span className="text-sm font-mono text-muted-foreground">April 03, 2026</span>
              </div>
              <h2 className="text-xl font-bold mb-3">CVE-2026-9999: Exploiting Edge Routers</h2>
              <p className="text-muted-foreground mb-6">How state-sponsored actors are bypassing pre-auth constraints in VPN appliances.</p>
              <div className="flex items-center text-muted-foreground font-medium">
                Coming Soon <ArrowRight className="ml-2 w-4 h-4" />
              </div>
          </div>

        </div>
      </div>

    </div>
  );
}
