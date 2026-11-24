import { Server, Activity } from "lucide-react";
import { SiemResetButton } from "@/components/dashboard/siem/SiemResetButton";
import { LogStreamTable } from "@/components/dashboard/siem/LogStreamTable";
import { SiemMetricsGrid } from "@/components/dashboard/siem/SiemMetricsGrid";
import { SiemAnalyticsCharts } from "@/components/dashboard/siem/SiemAnalyticsCharts";

export const dynamic = "force-dynamic";

export default function SiemDashboardPage() {
  return (
    <div className="space-y-6">
      
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
              <Server className="w-6 h-6 text-indigo-500" />
              SIEM & Endpoint Telemetry
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono tracking-wide">
            Real-time Windows Event Log ingestion and threat detection.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <SiemResetButton />
          
          <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-md">
            <div className="text-xs font-mono text-indigo-400 mb-1">API INGESTION STATUS</div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Activity className="w-4 h-4 text-emerald-500" />
              Active (Port 3000)
            </div>
          </div>
        </div>
      </div>

      <SiemMetricsGrid />

      <SiemAnalyticsCharts />

      <div className="bg-gradient-to-b from-[#0a0a0a] to-[#050505] border border-indigo-500/10 rounded-xl overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Live Event Stream
          </h2>
          <LogStreamTable />
        </div>
      </div>

    </div>
  );
}
