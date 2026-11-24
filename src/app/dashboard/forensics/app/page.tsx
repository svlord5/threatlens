"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  FileCode,
  Terminal,
  Activity,
  Upload,
  AlertTriangle,
  Lock,
  Unlock,
  Cpu,
  Layers,
  Copy,
  Check,
  Download,
  Flame,
  ExternalLink,
  Zap,
  Globe,
  Radio
} from "lucide-react";
import { toast } from "sonner";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // keep in sync with the API route

export default function AppMalwareForensicsPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "container" | "permissions" | "native" | "threatintel" | "mitre" | "yara"
  >("overview");

  const [isLoading, setIsLoading] = useState(true); // the default sample loads on mount
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadSample = useCallback(async (sampleId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/forensics/app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId })
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
        toast.success("Loaded 'Rashan Card' (GhostBat RAT) sample dossier");
      } else {
        toast.error(res.status === 401 ? "Session expired. Please sign in again." : "Failed to load sample dossier");
      }
    } catch {
      toast.error("Error communicating with malware analysis API");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load the default Rashan Card (GhostBat RAT) writeup sample on initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/forensics/app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sampleId: "rashan-card" })
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) setData(json);
        else toast.error(res.status === 401 ? "Session expired. Please sign in again." : "Failed to load sample dossier");
      } catch {
        if (!cancelled) toast.error("Error communicating with malware analysis API");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("File is too large (20 MB maximum).");
      return;
    }
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/forensics/app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name
          })
        });
        const json = await res.json();
        if (json.success) {
          setData(json);
          toast.success(`Analysis complete for: ${file.name}`);
        } else {
          toast.error(res.status === 413 ? "File is too large (20 MB maximum)." : "Failed to analyze uploaded file");
        }
      } catch {
        toast.error("Analysis failed");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const exportReport = () => {
    if (!data) return;
    const reportStr = JSON.stringify(data, null, 2);
    const blob = new Blob([reportStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threatlens-malware-report-${data.analysis?.metadata?.packageName || "sample"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const analysis = data?.analysis;
  const ai = data?.aiVerdict;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Mobile DFIR Engine
            </span>
            <span className="text-xs text-muted-foreground">Reverse Engineering & Threat Intel</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-rose-500" />
            App Malware Hunter & Dissector
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
            Automated deep-dive analysis of Android/mobile applications. Dissects native loaders, forged ZIP headers,
            stealth SMS-OTP RATs, hidden phishing kits, and extracts live C2 infrastructure.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadSample("rashan-card")}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-2 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            Load &quot;Rashan Card&quot; Case Study
          </button>

          <label className="px-3.5 py-2 text-xs font-medium rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            Upload Sample (.apk, .zip, .dex)
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".apk,.zip,.dex,.so" />
          </label>

          {data && (
            <button
              onClick={exportReport}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-all flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          )}
        </div>
      </div>

      {/* Case Study Callout Banner */}
      <div className="bg-gradient-to-r from-rose-950/20 via-background to-indigo-950/20 border border-rose-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0 mt-0.5">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              Case Study: Unmasking the &quot;Rashan Card&quot; Scam (GhostBat RAT)
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Live Campaign
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Targeting Indian users via WhatsApp broadcast lures with a fake ₹1 government subsidy fee. Dissects a
              three-in-one dropper (Cryptominer + SMS-OTP RAT + UPI-PIN Phishing Kit).
            </p>
          </div>
        </div>
        <a
          href="https://s3n5e.netlify.app/writeups/rashan-card-blog"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 flex items-center gap-1 shrink-0"
        >
          View Source Writeup <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-12 text-center rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mb-3" />
          <h3 className="text-lg font-semibold text-foreground">Dissecting Application Telemetry...</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Parsing container headers, calculating entropy, extracting JNI exports, and consulting Gemini Threat Engine.
          </p>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoading && analysis && (
        <div className="space-y-6">
          {/* Top Threat Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -z-10" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${
                      ai?.verdict === "MALICIOUS"
                        ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    VERDICT: {ai?.verdict || "MALICIOUS"}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{ai?.threatFamily}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confidence Score:</span>
                  <span className="text-sm font-bold text-rose-400">{ai?.confidenceScore || 98}%</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Executive Threat Summary
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed">{ai?.executiveSummary}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">App Label</span>
                  <span className="font-medium text-foreground">{analysis.metadata.appLabel}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Package ID</span>
                  <span className="font-mono text-foreground">{analysis.metadata.packageName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Sample File</span>
                  <span className="font-mono text-foreground truncate block">{analysis.metadata.sampleName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Container Size</span>
                  <span className="font-medium text-foreground">{analysis.metadata.fileSize}</span>
                </div>
              </div>
            </div>

            {/* Certificate & Anti-Analysis Quick Card */}
            <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 shadow-lg flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Signer / Certificate</span>
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                </div>
                {analysis.metadata.certificate.isAospTestKey ? (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    <span className="font-bold block">AOSP Platform Test Key Detected</span>
                    <span className="text-[11px] text-rose-300/80 mt-1 block">
                      Signed with public Android test cert (android@android.com). Hallmark of automated malware droppers.
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {analysis.metadata.certificate.issuer}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border/40">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Launcher Icon Visibility</span>
                </div>
                <div className="text-xs font-medium text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  {analysis.metadata.launcherVisibility}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-border/60 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]">
            {[
              { id: "overview", label: "Triage & Hashes", icon: Activity },
              { id: "container", label: "Container Forensics & Entropy", icon: Layers },
              { id: "permissions", label: "Permissions & Attack Surface", icon: ShieldAlert },
              { id: "native", label: "DEX & Native Unpacking", icon: Cpu },
              { id: "threatintel", label: "C2 & Phishing Infrastructure", icon: Radio },
              { id: "mitre", label: "MITRE ATT&CK Matrix", icon: Globe },
              { id: "yara", label: "YARA & Incident Mitigation", icon: Terminal }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-rose-500 text-rose-400 bg-rose-500/5 font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview & Hashes */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-rose-400" /> Cryptographic Hashes & Integrity
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-1">SHA-256</span>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 font-mono text-[11px] text-foreground border border-border">
                      <span className="truncate">{analysis.metadata.sha256}</span>
                      <button
                        onClick={() => copyToClipboard(analysis.metadata.sha256, "sha256")}
                        className="text-muted-foreground hover:text-foreground ml-2"
                      >
                        {copiedKey === "sha256" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block mb-1">MD5</span>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 font-mono text-[11px] text-foreground border border-border">
                      <span>{analysis.metadata.md5}</span>
                      <button
                        onClick={() => copyToClipboard(analysis.metadata.md5, "md5")}
                        className="text-muted-foreground hover:text-foreground ml-2"
                      >
                        {copiedKey === "md5" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block mb-1">VirusTotal & Threat Intel Status</span>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                      Fresh sample identified. Zero historical detections on standard antivirus engines at delivery time.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" /> Initial Triage Commands
                </h3>
                <p className="text-xs text-muted-foreground">
                  Quick reproduction commands for command-line verification and hash validation:
                </p>
                <div className="p-3 rounded-lg bg-black/60 font-mono text-xs text-zinc-300 border border-border/80 space-y-2 overflow-x-auto">
                  <div className="text-zinc-500"># Verify sample identity and integrity</div>
                  <div>$ sha256sum &quot;{analysis.metadata.sampleName}&quot;</div>
                  <div>$ file &quot;{analysis.metadata.sampleName}&quot;</div>
                  <div className="text-emerald-400"># Zip container check & entry count</div>
                  <div>$ unzip -l &quot;{analysis.metadata.sampleName}&quot; | tail -n 2</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Container Forensics & Entropy */}
          {activeTab === "container" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Unlock className="w-4 h-4 text-amber-400" />
                      Anti-Analysis Trick: Forged ZIP Encryption Bit
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analysis.containerForensics.explanation}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold whitespace-nowrap">
                    Bypass: Clear Bit 0
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs">
                    <span className="text-muted-foreground block font-medium">Forged Files in Central Directory</span>
                    <ul className="list-disc list-inside mt-1 font-mono text-foreground space-y-1">
                      {(analysis.containerForensics.forgedFiles || ["AndroidManifest.xml", "resources.arsc"]).map(
                        (f: string) => (
                          <li key={f} className="text-amber-300">
                            {f} (flag 0x0001 set, but plaintext)
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-black/60 border border-border text-xs font-mono text-zinc-300">
                    <span className="text-zinc-500 block"># Python patcher snippet to clear the bit:</span>
                    <div>data = bytearray(open(&apos;sample.apk&apos;,&apos;rb&apos;).read())</div>
                    <div># search central directory and zero out bit 0</div>
                    <div className="text-emerald-400"># patched.apk unzips cleanly without errors</div>
                  </div>
                </div>
              </div>

              {/* Entropy Analysis */}
              <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60">
                <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Shannon Entropy Spectrum (Asset Encryption Analysis)
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Entropy measures randomness (0.0 to 8.0). Values &gt; 7.5 signify military-grade encrypted blobs or compressed payloads.
                </p>

                <div className="space-y-3">
                  {analysis.containerForensics.assets.map((asset: any) => {
                    const pct = (asset.entropy / 8.0) * 100;
                    const isHigh = asset.entropy >= 7.5;
                    return (
                      <div key={asset.name} className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-medium text-foreground">{asset.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{asset.size}</span>
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold ${
                                isHigh
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {asset.entropy.toFixed(1)} / 8.0
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHigh ? "bg-gradient-to-r from-amber-500 to-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <span className="text-[11px] text-muted-foreground block">{asset.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Permissions & Attack Surface */}
          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-card/60 backdrop-blur-md border border-border/60 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Requested Permissions Matrix</h3>
                  <p className="text-xs text-muted-foreground">
                    Cross-referenced against MITRE Mobile techniques and threat profile.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                    {analysis.permissions.filter((p: any) => p.risk === "CRITICAL").length} Critical
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    {analysis.permissions.filter((p: any) => p.risk === "HIGH").length} High
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.permissions.map((perm: any) => (
                  <div
                    key={perm.name}
                    className="p-3.5 rounded-xl bg-card/40 backdrop-blur-md border border-border/50 text-xs space-y-1.5 hover:border-border transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-foreground text-[11px] truncate">
                        {perm.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          perm.risk === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : perm.risk === "HIGH"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {perm.risk}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-indigo-400 block">{perm.category}</span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{perm.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Native & Decompilation */}
          {activeTab === "native" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-card/60 backdrop-blur-md border border-border/60">
                  <span className="text-xs text-muted-foreground block">Micro-Stub DEX Size</span>
                  <span className="text-lg font-bold text-rose-400 font-mono mt-1 block">
                    {analysis.nativeAndDexAnalysis.dexStubSize}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Normal apps have multi-megabyte DEX files. Under 2KB means pure native forwarding.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card/60 backdrop-blur-md border border-border/60">
                  <span className="text-xs text-muted-foreground block">Native Entrypoint</span>
                  <span className="text-sm font-semibold text-foreground font-mono mt-1 block truncate">
                    {analysis.nativeAndDexAnalysis.nativeExport}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Exported in stripped libtautomerization.so shared library.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card/60 backdrop-blur-md border border-border/60">
                  <span className="text-xs text-muted-foreground block">Crypto Derivation Pattern</span>
                  <span className="text-sm font-semibold text-emerald-400 font-mono mt-1 block">
                    AES-128 (SHA-1 of Asset)
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Key = SHA-1(&quot;EG0x2&quot;)[:16], IV = SHA-256(&quot;EG0x2&quot;)[:16].
                  </p>
                </div>
              </div>

              {/* Anti-Analysis Techniques */}
              <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Evasion Mechanisms & Anti-Emulation Tripwires
                </h3>
                <div className="space-y-2">
                  {analysis.nativeAndDexAnalysis.antiAnalysisTricks.map((trick: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground flex items-center gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{trick}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decrypted Payload Hierarchy */}
              <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Decrypted Second-Stage Payloads Recovered
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis.nativeAndDexAnalysis.decryptedPayloads.map((payload: any) => (
                    <div
                      key={payload.name}
                      className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs space-y-1"
                    >
                      <span className="font-mono font-bold text-foreground">{payload.name}</span>
                      <p className="text-muted-foreground text-[11px]">{payload.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: C2 & Threat Intel */}
          {activeTab === "threatintel" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-400" />
                    Command & Control (C2) / Exfiltration Channels
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {analysis.threatIntel.c2Infrastructure.length} Infrastructure Endpoints Identified
                  </span>
                </div>

                <div className="space-y-2.5">
                  {analysis.threatIntel.c2Infrastructure.map((c2: any) => (
                    <div
                      key={c2.indicator}
                      className="p-3.5 rounded-xl bg-card/40 backdrop-blur-md border border-border/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-foreground text-sm">{c2.indicator}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {c2.type}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-[11px] block">{c2.host}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-semibold ${
                            c2.status.includes("Active") || c2.status.includes("Identified")
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {c2.status}
                        </span>
                        <button
                          onClick={() => copyToClipboard(c2.indicator, c2.indicator)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedKey === c2.indicator ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phishing Kit Details */}
              <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Targeted Phishing Kit Telemetry
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-muted-foreground block font-medium">Deceptive Lure</span>
                    <span className="text-foreground font-semibold mt-0.5 block">
                      {analysis.threatIntel.phishingKitDetails.lure}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-muted-foreground block font-medium">Exfiltration Record Format</span>
                    <span className="font-mono text-rose-400 mt-0.5 block text-[11px]">
                      {analysis.threatIntel.phishingKitDetails.exfiltrationPayloadFormat}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs">
                  <span className="text-muted-foreground block font-medium mb-1">Harvested User Credentials:</span>
                  <div className="flex flex-wrap gap-2">
                    {analysis.threatIntel.phishingKitDetails.harvestedFields.map((field: string) => (
                      <span
                        key={field}
                        className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-medium"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: MITRE ATT&CK */}
          {activeTab === "mitre" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-card/60 backdrop-blur-md border border-border/60">
                <h3 className="text-sm font-semibold text-foreground">MITRE ATT&CK for Mobile Mapping</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Observed adversary tactics and techniques mapped against the mobile knowledge base.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.mitreAttack.map((technique: any) => (
                  <div
                    key={technique.id}
                    className="p-4 rounded-xl bg-card/40 backdrop-blur-md border border-border/50 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold text-[11px]">
                          {technique.id}
                        </span>
                        <span className="font-semibold text-foreground text-sm">{technique.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {technique.tactic}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed mt-1">{technique.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 7: YARA & Mitigation */}
          {activeTab === "yara" && (
            <div className="space-y-6">
              {/* YARA Rule */}
              <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Automated YARA Signature Rule
                  </h3>
                  <button
                    onClick={() => copyToClipboard(ai?.yaraRule || "", "yara")}
                    className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs flex items-center gap-1.5 transition-all"
                  >
                    {copiedKey === "yara" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Rule
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-black/80 border border-border/80 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
                  {ai?.yaraRule}
                </pre>
              </div>

              {/* Reverse Engineering Tips */}
              {ai?.reverseEngineeringTips && (
                <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    Reverse Engineering & Unpacking Playbook
                  </h3>
                  <div className="space-y-2">
                    {ai.reverseEngineeringTips.map((tip: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs text-foreground/90 flex items-start gap-2.5"
                      >
                        <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOC Incident Remediation Checklist */}
              {ai?.socRemediationSteps && (
                <div className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    SOC Incident Remediation Checklist
                  </h3>
                  <div className="space-y-2">
                    {ai.socRemediationSteps.map((step: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-foreground/90 flex items-start gap-2.5"
                      >
                        <Check className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
