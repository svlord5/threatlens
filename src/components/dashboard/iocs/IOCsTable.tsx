"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Search, ShieldAlert, Trash2, Filter } from "lucide-react";
import { IOC } from "@/types";
import { AddIocModal } from "./AddIocModal";
import { toast } from "sonner";
import { useIAM } from "@/app/dashboard/layout";

export function IOCsTable({ initialIocs }: { initialIocs: IOC[] }) {
  const [iocs, setIocs] = useState<IOC[]>(initialIocs);
  const [showAddModal, setShowAddModal] = useState(false);
  const supabase = createClient();
  const iamPolicy = useIAM();
  const isReadOnly = iamPolicy?.read_only;

  useEffect(() => {
    const channel = supabase
      .channel("schema-db-changes-iocs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "iocs" },
        async (payload) => {
          // Re-fetch everything to include tags joined
          const { data, error } = await supabase
            .from("iocs")
            .select("*, ioc_tags(tag)")
            .order("created_at", { ascending: false });
          
          if (!error && data) {
            setIocs(data.map((ioc: any) => ({
              ...ioc,
              tags: ioc.ioc_tags.map((t: any) => t.tag)
            })));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (isReadOnly) {
      toast.error("Read-only analysts cannot delete IOCs.");
      return;
    }
    const { error } = await supabase.from("iocs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete IOC: " + error.message);
    } else {
      toast.success("IOC Deleted from the database.");
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
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/50 p-4 border border-white/5 rounded-lg">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search IOCs, hashes, IPs..." 
            className="w-full pl-10 pr-4 py-2 bg-background/40 border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-3 py-2 bg-background/40 border border-border rounded-md text-sm text-foreground hover:bg-muted hover:text-foreground transition-all w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {!isReadOnly && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md text-sm font-medium transition-all w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
            >
              <Plus className="w-4 h-4" />
              Add IOC
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-background/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/80 text-muted-foreground border-b border-border font-mono tracking-wider">
              <tr>
                <th className="px-6 py-4">Indicator Value</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4">Expiration</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {iocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="font-mono text-sm">No Indicators found in the database.</p>
                  </td>
                </tr>
              ) : iocs.map((ioc) => {
                const isExpired = ioc.expiration_date && new Date(ioc.expiration_date) < new Date();
                
                return (
                  <tr key={ioc.id} className={`hover:bg-muted transition-colors ${isExpired ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 font-mono text-foreground">
                      {ioc.value}
                      {isExpired && <span className="ml-2 text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-widest">Expired</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-foreground text-xs font-mono border border-zinc-700">
                        {ioc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getSeverityColor(ioc.severity)}`}>
                        {ioc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${ioc.confidence_score > 75 ? 'bg-red-500' : ioc.confidence_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${ioc.confidence_score}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground font-mono text-xs">{ioc.confidence_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {ioc.tags?.map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {ioc.expiration_date ? new Date(ioc.expiration_date).toISOString().split('T')[0] : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(ioc.id)}
                        className={`p-2 rounded-md transition-colors ${isReadOnly ? 'opacity-30 cursor-not-allowed' : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'}`}
                        disabled={isReadOnly}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && <AddIocModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
