"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { APIFinding } from "@/types";
import { ShieldAlert, Plus, Search, Lock } from "lucide-react";
import { useIAM } from "@/app/dashboard/layout";
import { toast } from "sonner";
import { AddApiFindingModal } from "./AddApiFindingModal";

export function ApiFindingsTable() {
  const [findings, setFindings] = useState<APIFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const supabase = createClient();
  const iamPolicy = useIAM();
  const isReadOnly = iamPolicy?.read_only;

  const fetchFindings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('api_findings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setFindings(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data once on mount
    fetchFindings();
  }, []);

  const getSeverityBadge = (score: number | null) => {
    if (!score) return <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/20 text-emerald-400 bg-emerald-500/10">UNKNOWN</span>;
    if (score >= 90) return <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-rose-500/20 text-rose-400 bg-rose-500/10">CRITICAL</span>;
    if (score >= 70) return <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-orange-500/20 text-orange-400 bg-orange-500/10">HIGH</span>;
    if (score >= 40) return <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-yellow-500/20 text-yellow-400 bg-yellow-500/10">MEDIUM</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/20 text-emerald-400 bg-emerald-500/10">LOW</span>;
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'text-blue-400';
      case 'POST': return 'text-emerald-400';
      case 'PUT': return 'text-amber-400';
      case 'DELETE': return 'text-rose-400';
      case 'PATCH': return 'text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="relative z-10 w-full animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-rose-950/10 backdrop-blur-md p-4 border-b border-rose-500/10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/50" />
          <input 
            type="text" 
            placeholder="Search API Vulnerabilities..." 
            className="w-full pl-10 pr-4 py-2 bg-background/40 border border-rose-500/20 rounded-md text-sm text-foreground focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all placeholder:text-muted-foreground"
          />
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-foreground rounded-md text-sm font-medium transition-all w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_20px_rgba(244,63,94,0.5)]"
          >
            <Plus className="w-4 h-4" />
            Log API Finding
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Scanning API Endpoints...</div>
      ) : findings.length === 0 ? (
        <div className="text-center py-16">
          <ShieldAlert className="w-10 h-10 mx-auto mb-4 text-zinc-700" />
          <p className="text-muted-foreground font-medium">No API vulnerabilities recorded.</p>
          <p className="text-xs text-muted-foreground mt-1">APIs are clean or awaiting scan results.</p>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase bg-background/40 text-muted-foreground border-b border-white/5 font-mono tracking-widest">
              <tr>
                <th className="px-6 py-4">Endpoint</th>
                <th className="px-6 py-4">Vulnerability Type</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Discovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {findings.map((finding) => {
                const parts = finding.endpoint.split(' ');
                const hasMethod = parts.length > 1 && ['GET','POST','PUT','DELETE','PATCH'].includes(parts[0].toUpperCase());
                const method = hasMethod ? parts[0].toUpperCase() : 'ALL';
                const path = hasMethod ? parts.slice(1).join(' ') : finding.endpoint;

                return (
                  <tr key={finding.id} className="hover:bg-rose-500/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-border ${getMethodColor(method)} bg-background/50`}>
                            {method}
                          </span>
                          <span className="font-mono text-foreground group-hover:text-foreground transition-colors break-all">
                            {path}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1 border-l-2 border-border pl-2 ml-1">
                          {finding.proof_of_concept || "No PoC provided"}
                        </div>
                      </div>
                    </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-foreground">
                      <Lock className="w-3.5 h-3.5 text-rose-500" />
                      {finding.vulnerability_type}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getSeverityBadge(finding.risk_score)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${
                      finding.status === 'Open' ? 'text-rose-400' :
                      finding.status === 'In Progress' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        finding.status === 'Open' ? 'bg-rose-500' :
                        finding.status === 'In Progress' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}></span>
                      {finding.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-muted-foreground font-mono">
                    {new Date(finding.created_at).toISOString().split('T')[0]}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && <AddApiFindingModal onClose={() => { setShowAddModal(false); fetchFindings(); }} />}
    </div>
  );
}
