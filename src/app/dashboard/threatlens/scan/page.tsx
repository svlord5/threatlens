"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, ArrowLeft, Globe, Zap, Lock, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { runFullDomainScan } from "@/lib/scanner";
import Link from "next/link";

export default function ThreatLensScanPage() {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;
    
    // Clean the input to extract domain
    let cleanDomain = domain.toLowerCase().trim();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '').split('/')[0];
    
    // Basic domain validation
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(cleanDomain)) {
      setErrorMsg("Please enter a valid domain name (e.g., example.com)");
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    try {
      const scanId = await runFullDomainScan(cleanDomain);
      router.push(`/dashboard/threatlens/report/${scanId}`);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to run scan. Please try again.");
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-8 pb-20">
      <Link href="/dashboard/threatlens" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mb-10 w-fit px-3 py-1.5 rounded-full hover:bg-muted">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Scanner Card */}
        <div className="lg:col-span-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-blue-500/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition duration-1000 group-hover:duration-200" />
            
            <div className="relative bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 lg:p-10 shadow-2xl">
              <div className="flex flex-col mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                  <ScanLine className="w-7 h-7 text-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">
                  Threat Intelligence Scan
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                  Deploy our autonomous analysis engine against any domain to map its attack surface, identify missing security headers, and generate an AI posture report.
                </p>
              </div>

              <form onSubmit={handleScan} className="space-y-6">
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    {errorMsg}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Target Domain</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within/input:text-indigo-400 transition-colors">
                      <Globe className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                      placeholder="e.g. yourcompany.com"
                      disabled={isScanning}
                      className="w-full bg-muted/50 border border-border rounded-xl py-4 pl-12 pr-4 text-foreground placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-muted transition-all disabled:opacity-50 text-lg shadow-inner"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isScanning || !domain}
                  className="w-full relative overflow-hidden group/btn bg-white text-black rounded-xl py-4 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  
                  <div className="relative flex items-center gap-2">
                    {isScanning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        <span>Running analysis engine...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 text-indigo-600 group-hover/btn:scale-110 transition-transform" />
                        <span>Launch Security Scan</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-muted/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-indigo-400" />
              What we analyze
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] shrink-0" />
                <span className="text-muted-foreground">DNS Infrastructure (A, AAAA, MX, TXT) to identify hosting providers and misconfigurations.</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0" />
                <span className="text-muted-foreground">Email Security Policies including SPF and DMARC enforcement.</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <span className="text-muted-foreground">HTTP Security Headers (CSP, HSTS, X-Frame-Options) for browser-level attack prevention.</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
                <span className="text-muted-foreground">Generative AI analysis of findings via Google Gemini 2.5.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
