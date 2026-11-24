"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Terminal, Copy, Check, Activity, ShieldAlert, CheckCircle2, Globe, Compass, Flame, Monitor } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COMMANDS: Record<string, Record<string, string>> = {
  "network-connections": {
    "Windows": "netstat -abno",
    "Linux": "ss -tupan",
    "macOS": "lsof -i -n -P",
  },
  "scheduled-tasks": {
    "Windows": "Get-ScheduledTask | Where-Object State -ne 'Disabled' | Select-Object TaskPath, TaskName, State | Format-Table -AutoSize",
    "Linux": "crontab -l; ls -al /etc/cron.*",
  },
  "auth-logs": {
    "Windows": "Get-EventLog -LogName Security -InstanceId 4624,4625 -Newest 500 | Format-Table -AutoSize",
    "Linux": "cat /var/log/auth.log | tail -n 500",
  },
  "process-list": {
    "Windows": "Get-WmiObject Win32_Process | Select-Object Name, ProcessId, CommandLine | Format-Table -AutoSize",
    "Linux": "ps auxfw",
    "macOS": "ps aux",
  },
  "browser-history": {
    "Windows": "Select a browser...",
    "Linux": "Select a browser...",
    "macOS": "Select a browser...",
  }
};

const MODULE_NAMES: Record<string, string> = {
  "network-connections": "Live Network Connections",
  "scheduled-tasks": "Scheduled Tasks & Cron",
  "auth-logs": "Authentication Logs",
  "process-list": "Running Processes",
  "browser-history": "Browser Artifacts"
};

function AnalyzerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const moduleId = searchParams?.get("module") || "network-connections";
  const os = searchParams?.get("os") || "Windows";
  
  const [copied, setCopied] = useState(false);
  const [logData, setLogData] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [selectedBrowser, setSelectedBrowser] = useState("Chrome");

  let command = COMMANDS[moduleId]?.[os] || "echo 'Command not available for this OS'";
  if (moduleId === "browser-history") {
    if (os === "Windows") {
      if (selectedBrowser === "Chrome") command = `copy "%LocalAppData%\\Google\\Chrome\\User Data\\Default\\History" "%TEMP%\\h.db" && sqlite3 "%TEMP%\\h.db" "SELECT url, title FROM urls ORDER BY last_visit_time DESC LIMIT 500;"`;
      if (selectedBrowser === "Edge") command = `copy "%LocalAppData%\\Microsoft\\Edge\\User Data\\Default\\History" "%TEMP%\\h.db" && sqlite3 "%TEMP%\\h.db" "SELECT url, title FROM urls ORDER BY last_visit_time DESC LIMIT 500;"`;
      if (selectedBrowser === "Firefox") command = `copy "%AppData%\\Mozilla\\Firefox\\Profiles\\*.default-release\\places.sqlite" "%TEMP%\\h.db" && sqlite3 "%TEMP%\\h.db" "SELECT url, title FROM moz_places ORDER BY last_visit_date DESC LIMIT 500;"`;
    } else if (os === "macOS") {
      if (selectedBrowser === "Chrome") command = `cp "~/Library/Application Support/Google/Chrome/Default/History" /tmp/h.db && sqlite3 /tmp/h.db "SELECT url, title FROM urls ORDER BY last_visit_time DESC LIMIT 500;"`;
      if (selectedBrowser === "Edge") command = `cp "~/Library/Application Support/Microsoft Edge/Default/History" /tmp/h.db && sqlite3 /tmp/h.db "SELECT url, title FROM urls ORDER BY last_visit_time DESC LIMIT 500;"`;
      if (selectedBrowser === "Safari") command = `cp ~/Library/Safari/History.db /tmp/h.db && sqlite3 /tmp/h.db "SELECT history_items.url, history_visits.title FROM history_items JOIN history_visits ON history_items.id = history_visits.history_item ORDER BY history_visits.visit_time DESC LIMIT 500;"`;
      if (selectedBrowser === "Firefox") command = `cp ~/Library/Application\\ Support/Firefox/Profiles/*.default-release/places.sqlite /tmp/h.db && sqlite3 /tmp/h.db "SELECT url, title FROM moz_places ORDER BY last_visit_date DESC LIMIT 500;"`;
    } else if (os === "Linux") {
      if (selectedBrowser === "Chrome") command = `cp ~/.config/google-chrome/Default/History /tmp/h.db && sqlite3 /tmp/h.db "SELECT url, title FROM urls ORDER BY last_visit_time DESC LIMIT 500;"`;
      if (selectedBrowser === "Firefox") command = `cp ~/.mozilla/firefox/*.default-release/places.sqlite /tmp/h.db && sqlite3 /tmp/h.db "SELECT url, title FROM moz_places ORDER BY last_visit_date DESC LIMIT 500;"`;
      if (selectedBrowser === "Edge") command = `echo 'Edge not supported on Linux'`;
    }
  }
  const moduleName = MODULE_NAMES[moduleId] || "Custom Analysis";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Command copied to clipboard!");
  };

  const handleAnalyze = async () => {
    if (!logData.trim()) {
      toast.error("Please paste the log output first.");
      return;
    }

    setIsAnalyzing(true);
    setResults(null);

    // ZERO-DATA-TRANSFER Client-side parsing for Browser History
    if (moduleId === "browser-history") {
      try {
        // Simulate processing delay for UI consistency
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const parsedResults = logData.split('\n')
          .map(line => line.trim())
          .filter(line => line !== '')
          .map(line => {
             const parts = line.split('|');
             if (parts.length < 2) return null;
             
             const url = parts[0] || '';
             const title = parts.slice(1).join('|') || '';
             const isSuspicious = url.includes('.onion') || url.includes('.ru') || url.includes('ngrok.io') || url.includes('bit.ly') || url.includes('pastebin') || url.includes('telegram.org');
             
             return {
                url: url.substring(0, 70) + (url.length > 70 ? '...' : ''),
                title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
                explanation: isSuspicious ? "Suspicious domain or redirector" : "Standard browsing",
                is_suspicious: isSuspicious
             };
          })
          .filter(Boolean);

        setResults(parsedResults);
        toast.success("Zero-Data-Transfer Analysis complete! Data never left your browser.");
      } catch (error) {
        toast.error("Failed to parse browser history locally.");
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/forensics/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, os, logs: logData })
      });

      if (!res.ok) throw new Error("Failed to analyze logs");

      const data = await res.json();
      setResults(data.parsed);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error(error);
      toast.error("Error analyzing the forensic artifact. The output might be too large or malformed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/forensics" className="p-2 bg-muted hover:bg-muted/80 rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {moduleName} <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md ml-2 border border-indigo-500/20">{os}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Guided Artifact Extraction & AI Parsing</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Top Row: Instructions & Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Step 1: Run Command */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold">1</span>
              Run Command
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Execute this command on the target {os} machine to extract the forensic artifact.
            </p>
            
            {moduleId === "browser-history" && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Select Browser target:</label>
                <Select value={selectedBrowser} onValueChange={(value) => value && setSelectedBrowser(value)}>
                  <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-300">
                    <SelectValue placeholder="Select a browser" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
                    <SelectItem value="Chrome" className="hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        Google Chrome
                      </div>
                    </SelectItem>
                    <SelectItem value="Firefox" className="hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        Mozilla Firefox
                      </div>
                    </SelectItem>
                    {os !== "Linux" && (
                      <SelectItem value="Edge" className="hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-sky-400" />
                          Microsoft Edge
                        </div>
                      </SelectItem>
                    )}
                    {os === "macOS" && (
                      <SelectItem value="Safari" className="hover:bg-zinc-900 focus:bg-zinc-900 focus:text-white cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-sky-500" />
                          Safari
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="relative group">
              <div className="bg-zinc-950 rounded-lg p-4 pr-10 border border-zinc-800 font-mono text-[11px] sm:text-xs text-zinc-300 whitespace-pre-wrap break-all">
                {command}
              </div>
              <button 
                onClick={copyToClipboard}
                className="absolute right-3 top-3 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 2: Paste Output */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold">2</span>
              Paste Output
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Paste the raw terminal output here. The AI engine will structure and analyze it.
            </p>
            <textarea
              value={logData}
              onChange={(e) => setLogData(e.target.value)}
              placeholder="Paste raw log data here..."
              className="w-full flex-1 min-h-[120px] bg-muted/50 border border-border rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
            />
            
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !logData}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              {isAnalyzing ? (
                <><Activity className="w-4 h-4 animate-pulse" /> Processing via ThreatLens AI...</>
              ) : (
                <><Terminal className="w-4 h-4" /> Parse & Analyze</>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Row: Results */}
        <div className="w-full">
          <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
            <div className="px-5 py-4 border-b border-border bg-muted/30 shrink-0">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold">3</span>
                Analysis Results
              </h3>
            </div>
            
            <div className="flex-1 p-0 overflow-auto bg-muted/10 relative">
              {!results && !isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50 p-6 text-center">
                  <Terminal className="w-12 h-12 mb-4" />
                  <p>Awaiting raw log data for processing.</p>
                </div>
              )}
              
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400 p-6 text-center">
                  <Activity className="w-12 h-12 mb-4 animate-spin-slow" />
                  <h3 className="text-lg font-medium mb-1">Extracting Artifacts</h3>
                  <p className="text-sm opacity-80">Using Gemini 2.5 to parse unstructured terminal output...</p>
                </div>
              )}

              {results && results.length > 0 && (
                <div className="p-0">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        {Object.keys(results[0]).map(key => (
                          <th key={key} className="px-4 py-3 font-medium text-muted-foreground capitalize whitespace-nowrap">
                            {key.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {results.map((row, i) => {
                        const isSuspicious = row.is_suspicious || row.severity === 'high' || row.status === 'malicious';
                        return (
                          <tr key={i} className={`hover:bg-muted/30 transition-colors ${isSuspicious ? 'bg-rose-500/5' : ''}`}>
                            {Object.entries(row).map(([key, val]) => (
                              <td key={key} className="px-4 py-3 align-top max-w-[150px] sm:max-w-[250px] lg:max-w-[400px] break-all whitespace-normal">
                                {key === 'is_suspicious' || key === 'severity' || key === 'status' ? (
                                  isSuspicious ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                      <ShieldAlert className="w-3 h-3" /> Flagged
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      <CheckCircle2 className="w-3 h-3" /> Clean
                                    </span>
                                  )
                                ) : (
                                  <span className={`font-mono text-xs ${isSuspicious ? 'text-rose-400' : 'text-foreground'}`}>
                                    {String(val)}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {results && results.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50 p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500" />
                  <h3 className="text-lg font-medium text-foreground">No Suspicious Artifacts Found</h3>
                  <p className="text-sm mt-1">The AI engine parsed the log but found nothing worth extracting based on the module&apos;s criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForensicsAnalyzer() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center text-muted-foreground">Loading analyzer module...</div>}>
      <AnalyzerContent />
    </Suspense>
  );
}
