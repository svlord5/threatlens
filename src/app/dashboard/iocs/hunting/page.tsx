"use client";

import { useState } from "react";
import { runIocHunt, HuntFinding } from "@/app/actions/hunting";
import { Target, Activity, Search, ShieldAlert, Loader2 } from "lucide-react";
import { HuntingResultsTable } from "@/components/dashboard/iocs/HuntingResultsTable";
import { toast } from "sonner";

export default function HuntingEnginePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<HuntFinding[] | null>(null);
  const [metrics, setMetrics] = useState<{scannedLogs: number, scannedIocs: number, hits: number} | null>(null);

  const startHunt = async () => {
    setIsScanning(true);
    setResults(null);
    setMetrics(null);
    
    try {
      const response = await runIocHunt();
      if (response.error) {
        toast.error("Hunt failed: " + response.error);
        return;
      }
      
      setResults(response.findings);
      setMetrics(response.metrics);
      
      if (response.metrics.scannedIocs === 0) {
        toast.warning("Hunt aborted: No active IOCs found in the database. Add some IOCs first.");
      } else if (response.metrics.scannedLogs === 0) {
        toast.warning("Hunt aborted: No recent endpoint telemetry found to scan.");
      } else if (response.findings.length > 0) {
        toast.error(`Hunt complete! Found ${response.findings.length} impacted hosts.`);
      } else {
        toast.success(`Hunt complete! Scanned ${response.metrics.scannedLogs} logs against ${response.metrics.scannedIocs} active IOCs. No hits detected.`);
      }
    } catch (e: any) {
      toast.error("An unexpected error occurred during the hunt.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
              <Target className="w-6 h-6 text-rose-500" />
              Automated Hunting Engine
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono tracking-wide">
            Cross-reference the active IOC database against historical SIEM endpoint telemetry.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-gradient-to-r from-zinc-900 to-black border border-white/5 p-8 rounded-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex-1 space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Retrospective Threat Hunt
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Initiate a full-spectrum correlation scan. The engine will retrieve all active Indicators of Compromise (Hashes, IPs, Domains) and scan the last 5,000 endpoint event logs for any matches to identify silently impacted hosts.
            </p>
          </div>
          
          <div className="shrink-0 w-full md:w-auto flex flex-col gap-3">
            <button 
              onClick={startHunt}
              disabled={isScanning}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-foreground font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] disabled:opacity-50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none"></div>
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Correlation Engine...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Automated Hunt
                </>
              )}
            </button>
            
            {metrics && (
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-muted-foreground mt-2">
                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-indigo-400" /> {metrics.scannedLogs} Logs Scanned</span>
                <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-amber-400" /> {metrics.scannedIocs} Active IOCs</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <HuntingResultsTable results={results} metrics={metrics} />
        </div>
      )}

    </div>
  );
}
