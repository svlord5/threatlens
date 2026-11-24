"use client";

import { useState } from "react";
import { Globe, ShieldAlert, Activity, Link as LinkIcon, Mail, Phone, RefreshCw, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function WebsiteAnalyzerClient() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  const [scanData, setScanData] = useState<any>(null);
  const [aiVerdict, setAiVerdict] = useState<any>(null);

  const handleScan = async () => {
    if (!url) return;
    setIsScanning(true);
    setScanData(null);
    setAiVerdict(null);
    setErrorState(null);

    let step = "starting";
    try {
      step = "fetching website";
      // 1. Scrape Website
      const res = await fetch("/api/forensics/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      step = "parsing website response";
      const data = await res.json();
      step = "checking success";
      if (!data.success) throw new Error("Backend Error: " + data.error);
      
      step = "setting scan data";
      setScanData(data);

      step = "checking iocs";
      // 2. Run Threat Intel Analysis on the extracted IOCs
      if (data.iocsForIntel && data.iocsForIntel.length > 0) {
        setIsAiAnalyzing(true);
        step = "fetching analyze";
        const aiRes = await fetch("/api/forensics/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "website",
            iocs: data.iocsForIntel,
            contextData: { 
              url: data.url, 
              htmlLength: data.htmlLength,
              extractedEmails: data.extracted.emails,
              extractedPhones: data.extracted.phones,
              networkIntelligence: data.networkIntelligence
            },
            screenshotBase64: data.screenshotBase64
          })
        });
        
        step = "checking ai res ok";
        if (aiRes.ok) {
          step = "parsing analyze response";
          const aiData = await aiRes.json();
          step = "setting ai verdict";
          setAiVerdict(aiData);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        setErrorState(`Failed at step '${step}'. ${e.name}: ${e.message}\nStack: ${e.stack}`);
      } else {
        setErrorState(`Failed at step '${step}'. ${String(e)}`);
      }
    } finally {
      setIsScanning(false);
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {errorState && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg font-mono text-xs">
          CRASH DETECTED: {errorState}
        </div>
      )}

      {/* Input Panel */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-foreground font-medium flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          Target URL
        </h2>
        
        <div className="flex flex-col gap-3">
          <div className="flex gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-muted-foreground group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter suspicious URL (e.g., https://example.com)"
                className="w-full bg-card border border-border text-foreground rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono text-sm placeholder:text-muted-foreground shadow-inner"
              />
            </div>
            
            <button
              onClick={handleScan}
              disabled={isScanning || !url}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center gap-2 shrink-0"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Scan Target
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {scanData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* AI Verdict */}
          {aiVerdict && (
            <div className={`p-6 rounded-xl border ${aiVerdict.verdict === 'MALICIOUS' ? 'bg-red-500/10 border-red-500/30' : aiVerdict.verdict === 'SUSPICIOUS' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Activity className={`w-6 h-6 ${aiVerdict.verdict === 'MALICIOUS' ? 'text-red-400' : aiVerdict.verdict === 'SUSPICIOUS' ? 'text-yellow-400' : 'text-green-400'}`} />
                  <h3 className={`text-xl font-bold tracking-wider ${aiVerdict.verdict === 'MALICIOUS' ? 'text-red-400' : aiVerdict.verdict === 'SUSPICIOUS' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {aiVerdict.verdict}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-foreground">{aiVerdict.score}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Risk Score</div>
                </div>
              </div>
              <p className="text-foreground text-sm leading-relaxed border-t border-white/5 pt-4">
                {aiVerdict.justification}
              </p>
            </div>
          )}
          
          {/* Website Visuals - Base64 Screenshot */}
          {scanData.screenshotBase64 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl space-y-3 p-1">
              <div className="px-4 pt-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Live Target Render
                </h3>
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">Visual Forensics</span>
              </div>
              <div className="relative w-full aspect-video border-t border-white/5 bg-background">
                <img 
                  src={`data:image/png;base64,${scanData.screenshotBase64}`} 
                  alt="Target render" 
                  className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </div>
          )}

          {/* Network Intelligence / OSINT */}
          {scanData.networkIntelligence && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-5">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Globe className="w-4 h-4 text-blue-400" />
                Deterministic Network Forensics
              </h3>
              
              {/* Reputation / OTX */}
              {scanData.networkIntelligence.reputation && (
                <div className="bg-muted border border-white/5 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs text-muted-foreground uppercase font-semibold">AlienVault OTX Reputation</h4>
                    <p className="text-[11px] text-muted-foreground mt-1">Global Threat Pulses</p>
                  </div>
                  <div>
                    {scanData.networkIntelligence.reputation.isWhitelisted ? (
                      <span className="text-sm font-semibold text-emerald-400 flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-md">
                        ✓ Whitelisted Domain
                      </span>
                    ) : scanData.networkIntelligence.reputation.pulseCount > 0 ? (
                      <span className="text-sm font-semibold text-red-400 flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-md">
                        ⚠️ Reported in {scanData.networkIntelligence.reputation.pulseCount} Threat Pulses
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
                        No Threat Pulses Found
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Registration & SSL */}
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Domain Registration</span>
                    <div className="mt-1 flex items-center gap-2">
                      {scanData.networkIntelligence.registrationDate ? (
                        <span className="text-sm text-foreground font-mono bg-muted px-2 py-1 rounded">
                          {new Date(scanData.networkIntelligence.registrationDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unknown (RDAP Error)</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">SSL/TLS Certificate</span>
                    <div className="mt-1 space-y-1">
                      {scanData.networkIntelligence.ssl ? (
                        <>
                          <div className="text-sm text-foreground">Issuer: <span className="font-mono text-emerald-400/80">{scanData.networkIntelligence.ssl.issuer}</span></div>
                          <div className="text-xs text-muted-foreground">Expires: {new Date(scanData.networkIntelligence.ssl.validTo).toLocaleDateString()}</div>
                        </>
                      ) : (
                        <span className="text-sm text-red-400">No Valid Certificate</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* DNS Records */}
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">DNS Records</span>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {scanData.networkIntelligence.dns.A.map((ip: string, i: number) => (
                      <div key={'a'+i} className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded flex justify-between">
                        <span>A</span> <span className="text-blue-400/80">{ip}</span>
                      </div>
                    ))}
                    {scanData.networkIntelligence.dns.MX.map((mx: string, i: number) => (
                      <div key={'mx'+i} className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded flex justify-between">
                        <span>MX</span> <span className="text-purple-400/80">{mx}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Security Headers */}
              <div className="pt-2 border-t border-white/5 flex gap-4 overflow-x-auto">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold self-center shrink-0">Security Headers</span>
                {Object.entries(scanData.networkIntelligence.securityHeaders).map(([key, valid]) => (
                  <div key={key} className={`text-xs px-2 py-1 rounded shrink-0 ${valid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {key.toUpperCase()}: {valid ? 'PASS' : 'FAIL'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phishing Heuristics Panel */}
          {scanData.heuristics && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2 border-b border-white/5 pb-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Phishing Heuristics Engine
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Typo-Squatting */}
                <div className={`p-3 rounded-lg border ${scanData.heuristics.typoSquatting.failed ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Typo-Squatting</span>
                    {scanData.heuristics.typoSquatting.failed ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  {scanData.heuristics.typoSquatting.failed ? (
                    <p className="text-xs text-red-400 mt-2 font-mono">{scanData.heuristics.typoSquatting.details}</p>
                  ) : (
                    <p className="text-xs text-emerald-500/70 mt-1 font-mono">No brand impersonation detected.</p>
                  )}
                </div>

                {/* Form Hijacking */}
                <div className={`p-3 rounded-lg border ${scanData.heuristics.formHijacking.failed ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Form Hijacking</span>
                    {scanData.heuristics.formHijacking.failed ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  {scanData.heuristics.formHijacking.failed ? (
                    <p className="text-xs text-red-400 mt-2 font-mono">{scanData.heuristics.formHijacking.details}</p>
                  ) : (
                    <p className="text-xs text-emerald-500/70 mt-1 font-mono">No external password form submissions.</p>
                  )}
                </div>

                {/* Suspicious TLD */}
                <div className={`p-3 rounded-lg border ${scanData.heuristics.suspiciousTld.failed ? 'bg-orange-500/10 border-orange-500/30' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">TLD Reputation</span>
                    {scanData.heuristics.suspiciousTld.failed ? <AlertTriangle className="w-4 h-4 text-orange-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  {scanData.heuristics.suspiciousTld.failed ? (
                    <p className="text-xs text-orange-400 mt-2 font-mono">{scanData.heuristics.suspiciousTld.details}</p>
                  ) : (
                    <p className="text-xs text-emerald-500/70 mt-1 font-mono">TLD appears standard.</p>
                  )}
                </div>

                {/* Template Links */}
                <div className={`p-3 rounded-lg border ${scanData.heuristics.templateLinks.failed ? 'bg-orange-500/10 border-orange-500/30' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dead Social Links</span>
                    {scanData.heuristics.templateLinks.failed ? <AlertTriangle className="w-4 h-4 text-orange-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  {scanData.heuristics.templateLinks.failed ? (
                    <p className="text-xs text-orange-400 mt-2 font-mono">{scanData.heuristics.templateLinks.details}</p>
                  ) : (
                    <p className="text-xs text-emerald-500/70 mt-1 font-mono">No template social links found.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAiAnalyzing && (
            <div className="p-6 rounded-xl border border-white/5 bg-muted flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-sm text-muted-foreground">Running AI Threat Evaluation...</span>
            </div>
          )}

          {/* Extracted IOCs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emails */}
            <div className="bg-card border border-white/5 rounded-xl p-4 space-y-3 shadow-lg">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                Email Intelligence
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {scanData.extracted.emails.length > 0 ? (
                  scanData.extracted.emails.map((eObj: any, i: number) => (
                    <div key={i} className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded break-all flex flex-col gap-1 border border-white/5">
                      <span className="text-cyan-400/80">{eObj.address}</span>
                      <div className="flex gap-2 mt-1">
                        {eObj.isDisposable && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded w-fit uppercase font-semibold tracking-wider">⚠️ Disposable Email</span>
                        )}
                        {eObj.breachCount > 0 && (
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded w-fit uppercase font-semibold tracking-wider">
                            ⚠️ In {eObj.breachCount} Data Breaches
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground italic">No emails detected</div>
                )}
              </div>
            </div>
            
            {/* Outbound Links */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-cyan-400" />
                Outbound Links ({scanData.extracted.links.length})
              </h3>
              <div className="h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {scanData.extracted.links.map((link: string, i: number) => (
                  <div key={i} className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded truncate" title={link}>
                    {link}
                  </div>
                ))}
              </div>
            </div>

            {/* Other IOCs */}
            <div className="space-y-4">

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-400" />
                  Extracted Phone Numbers
                </h3>
                <div className="space-y-2">
                  {scanData.extracted.phones.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No phones found in DOM</div>
                  ) : (
                    scanData.extracted.phones.map((p: string, i: number) => (
                      <div key={i} className="text-xs font-mono text-orange-400/80 bg-orange-500/10 p-2 rounded">{p}</div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
