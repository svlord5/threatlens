"use client";

import { useState } from "react";
import { Search, ShieldAlert, Activity, Server, Clock, SearchCode } from "lucide-react";

export default function LogHunterClient() {
  const [iocInput, setIocInput] = useState("198.51.100.45\nlogin-secure-auth22.com\n5e884898da28047151d0e56f8dc62927");
  const [isHunting, setIsHunting] = useState(false);
  const [huntResults, setHuntResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleHunt = async () => {
    if (!iocInput.trim()) return;
    
    setIsHunting(true);
    setError(null);
    setHuntResults(null);

    const iocs = iocInput.split("\n").map(i => i.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/forensics/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iocs }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to search logs.");
      }

      setHuntResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsHunting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg font-mono text-xs">
          ERROR: {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-foreground font-medium flex items-center gap-2">
          <SearchCode className="w-4 h-4 text-cyan-400" />
          Target IOCs
        </h2>
        <p className="text-xs text-muted-foreground">Paste your Indicators of Compromise (one per line) to search across all available SIEM logs.</p>
        
        <textarea
          value={iocInput}
          onChange={(e) => setIocInput(e.target.value)}
          placeholder={"198.51.100.45\nmalicious-domain.com\n5e884898da28047151d0e56f8dc62927"}
          rows={4}
          className="w-full bg-background border border-border rounded-lg p-4 text-sm text-cyan-400 font-mono placeholder-zinc-700 focus:outline-none focus:border-cyan-500/50 resize-none"
        />

        <div className="flex justify-end">
          <button 
            onClick={handleHunt}
            disabled={isHunting || !iocInput.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            {isHunting ? (
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" />
                Querying Logs...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Run Hunt
              </span>
            )}
          </button>
        </div>
      </div>

      {huntResults && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center items-center gap-2">
              <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Matched Logs</span>
              <span className="text-4xl font-bold text-foreground">{huntResults.matchesFound}</span>
            </div>
            <div className="bg-card border border-red-500/30 rounded-xl p-6 flex flex-col justify-center items-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.05)]">
              <span className="text-red-400/80 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Impacted Hosts
              </span>
              <div className="flex flex-col items-center">
                {huntResults.impactedHosts.length > 0 ? (
                  huntResults.impactedHosts.map((h: string) => (
                    <span key={h} className="text-xl font-bold text-red-500">{h}</span>
                  ))
                ) : (
                  <span className="text-xl font-bold text-emerald-500">None</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-sm font-medium text-foreground">Log Hunt Results</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="p-4 font-semibold w-48">Timestamp</th>
                    <th className="p-4 font-semibold w-40">Source</th>
                    <th className="p-4 font-semibold w-40">Host</th>
                    <th className="p-4 font-semibold">Raw Log Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {huntResults.logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground text-sm italic">
                        No logs matched the provided IOCs.
                      </td>
                    </tr>
                  )}
                  {huntResults.logs.map((log: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-cyan-500/50" />
                          {log.timestamp}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-foreground whitespace-nowrap">
                        {log.source}
                      </td>
                      <td className="p-4 text-xs font-mono font-bold text-red-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Server className="w-3 h-3" />
                          {log.host}
                        </div>
                      </td>
                      <td className="p-4 text-xs font-mono text-muted-foreground break-all leading-relaxed">
                        {log.raw}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
