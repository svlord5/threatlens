"use client";

import { useState } from "react";
import { List, Network, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import ThreatLensGraphView from "./ThreatLensGraphView";

export default function ThreatLensViewContainer({ domains }: { domains: any[] }) {
  const [view, setView] = useState<'list' | 'graph'>('list');

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          Monitored Domains
        </h2>
        <div className="bg-card border border-border rounded-lg p-1 flex items-center">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              view === 'list' 
                ? 'bg-white/10 text-foreground font-medium' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setView('graph')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              view === 'graph' 
                ? 'bg-white/10 text-foreground font-medium' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Network className="w-4 h-4" />
            Graph
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="bg-muted border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="divide-y divide-white/10">
            {domains.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No domains currently monitored. Start a new scan.
              </div>
            ) : (
              domains.map((domain: any) => {
                const latestScan = domain.threatlens_scans?.sort((a:any,b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                
                let riskColor = "bg-zinc-700";
                if (latestScan) {
                  if (latestScan.risk_score >= 80) riskColor = "bg-emerald-500";
                  else if (latestScan.risk_score >= 50) riskColor = "bg-amber-500";
                  else riskColor = "bg-rose-500";
                }

                return (
                  <div key={domain.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${riskColor}`} />
                      <div>
                        <h3 className="font-medium text-foreground">{domain.domain}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {domain.last_scanned ? formatDistanceToNow(new Date(domain.last_scanned), { addSuffix: true }) : 'Never scanned'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {latestScan && (
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-medium text-foreground tracking-tight">
                            {latestScan.risk_score}<span className="text-muted-foreground text-sm">/100</span>
                          </span>
                        </div>
                      )}
                      <Link href={latestScan ? `/dashboard/threatlens/report/${latestScan.id}` : '#'} className="text-muted-foreground group-hover:text-foreground transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <ThreatLensGraphView domains={domains} />
        </div>
      )}
    </div>
  );
}
