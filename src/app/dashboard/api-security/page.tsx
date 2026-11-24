import { Shield, Server, AlertOctagon, LockOpen, Activity } from "lucide-react";
import { ApiFindingsTable } from "@/components/dashboard/api-security/ApiFindingsTable";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function ApiSecurityPage() {
  const supabase = await createClient();
  const { data: findings } = await supabase.from('api_findings').select('*');
  
  const allFindings = findings || [];
  const totalFindings = allFindings.length;
  const criticalFindings = allFindings.filter(f => (f.risk_score || 0) >= 90).length;
  const openFindings = allFindings.filter(f => f.status === 'Open').length;
  const avgRisk = allFindings.length > 0 
    ? Math.round(allFindings.reduce((acc, f) => acc + (f.risk_score || 0), 0) / allFindings.length)
    : 0;

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
              <Shield className="w-6 h-6 text-rose-500" />
              API Security Workspace
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono tracking-wide flex items-center gap-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            Track, analyze, and remediate broken object level authorization and endpoint vulnerabilities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-rose-500/10 p-5 rounded-md relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Total Findings</span>
            <Activity className="w-4 h-4 text-muted-foreground group-hover:text-rose-400 transition-colors" />
          </div>
          <div className="text-3xl font-bold text-foreground">{totalFindings}</div>
        </div>

        <div className="bg-card border border-rose-500/10 p-5 rounded-md relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Critical Vulns</span>
            <AlertOctagon className={`w-4 h-4 transition-colors ${criticalFindings > 0 ? 'text-rose-500 animate-pulse' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-3xl font-bold text-foreground">{criticalFindings}</div>
        </div>

        <div className="bg-card border border-rose-500/10 p-5 rounded-md relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Open Tasks</span>
            <LockOpen className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-3xl font-bold text-foreground">{openFindings}</div>
        </div>

        <div className="bg-card border border-rose-500/10 p-5 rounded-md relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Avg Risk Score</span>
            <Shield className="w-4 h-4 text-muted-foreground group-hover:text-rose-400 transition-colors" />
          </div>
          <div className="text-3xl font-bold text-foreground flex items-baseline gap-1">
            {avgRisk} <span className="text-xs text-muted-foreground font-mono">/ 100</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-b from-[#0a0a0a] to-[#050505] border border-rose-500/10 rounded-xl overflow-hidden shadow-2xl relative group">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        <ApiFindingsTable />
      </div>

    </div>
  );
}
