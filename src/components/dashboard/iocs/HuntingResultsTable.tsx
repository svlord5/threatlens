"use client";

import { useState } from "react";
import { AlertOctagon, Terminal, FileWarning, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export function HuntingResultsTable({ results, metrics }: { results: any[], metrics?: any }) {
  const supabase = createClient();
  const [escalating, setEscalating] = useState<string | null>(null);

  if (!results || results.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background/20 p-12 text-center text-muted-foreground">
        <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
        {metrics?.scannedIocs === 0 ? (
          <>
            <p className="font-mono text-sm text-amber-400/80 mb-2">No Active IOCs Found.</p>
            <p className="text-xs opacity-60 max-w-sm mx-auto">The database currently contains zero active Indicators of Compromise. Please navigate to the active IOC database and add some threats to hunt for.</p>
          </>
        ) : metrics?.scannedLogs === 0 ? (
          <>
            <p className="font-mono text-sm text-amber-400/80 mb-2">No Endpoint Logs Available.</p>
            <p className="text-xs opacity-60 max-w-sm mx-auto">There is no recent endpoint telemetry in the database to scan against your active IOCs. Ensure the SIEM ingestion pipeline is running.</p>
          </>
        ) : (
          <>
            <p className="font-mono text-sm text-emerald-400/80 mb-2">Zero Threat Matches.</p>
            <p className="text-xs opacity-60 max-w-sm mx-auto">
              Successfully scanned {metrics?.scannedLogs || 0} endpoint logs against {metrics?.scannedIocs || 0} active IOCs. 
              No overlapping indicators were detected. Your endpoints appear safe from these threats.
            </p>
          </>
        )}
      </div>
    );
  }

  const handleEscalate = async (finding: any) => {
    setEscalating(finding.logId);
    try {
      const title = `IOC Hunt Match: ${finding.iocValue} on ${finding.machineName}`;
      const desc = `Automated IOC Correlation Engine detected a match for active IOC.

**Impacted Host:** ${finding.machineName}
**IOC Matched:** ${finding.iocValue} (${finding.iocType} - ${finding.iocSeverity})
**Log Timestamp:** ${new Date(finding.timestamp).toLocaleString()}
**Log Provider:** ${finding.provider}

**Raw Log Snippet:**
\`\`\`text
${finding.logSnippet}
\`\`\`
`;
      
      const { error } = await supabase.from('case').insert({
        title,
        description: desc,
        status: 'Open',
        severity: finding.iocSeverity === 'Critical' || finding.iocSeverity === 'High' ? 'High' : 'Medium'
      });
      
      if (error) throw error;
      toast.success("Finding escalated to a new Incident Case!");
    } catch (e: any) {
      toast.error("Failed to escalate: " + e.message);
    } finally {
      setEscalating(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'High': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Low': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-muted-foreground bg-zinc-400/10 border-zinc-400/20';
    }
  };

  return (
    <div className="rounded-lg border border-rose-500/20 bg-rose-950/10 overflow-hidden shadow-[0_0_20px_rgba(244,63,94,0.05)]">
      <div className="p-4 border-b border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
        <h3 className="text-rose-400 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
          <AlertOctagon className="w-4 h-4" />
          Correlated Impacted Hosts
        </h3>
        <span className="bg-rose-500/20 text-rose-300 text-xs font-mono px-2 py-0.5 rounded border border-rose-500/30">
          {results.length} Matches Found
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] uppercase bg-background/60 text-muted-foreground border-b border-border font-mono tracking-widest sticky top-0">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
              <th className="px-4 py-3 whitespace-nowrap">Impacted Host</th>
              <th className="px-4 py-3 whitespace-nowrap">IOC Matched</th>
              <th className="px-4 py-3 w-full">Log Snippet</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {results.map((finding, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors group font-mono text-xs">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(finding.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                    {finding.machineName}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-bold">{finding.iocValue}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded border ${getSeverityColor(finding.iocSeverity)}`}>
                      {finding.iocSeverity}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground truncate max-w-sm" title={finding.logSnippet}>
                  {finding.logSnippet || finding.provider}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button 
                    onClick={() => handleEscalate(finding)}
                    disabled={escalating === finding.logId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-md transition-colors disabled:opacity-50"
                  >
                    <FileWarning className="w-3.5 h-3.5" />
                    {escalating === finding.logId ? "Escalating..." : "Escalate to Case"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
