"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Terminal, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useIAM } from "@/app/dashboard/layout";

export function InvestigationsWidget({ caseId, initialInvestigations, caseCreatedAt }: { caseId: string, initialInvestigations: any[], caseCreatedAt: string }) {
  const [investigations, setInvestigations] = useState(initialInvestigations);
  const [newEvent, setNewEvent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();
  const iamPolicy = useIAM();
  const isReadOnly = iamPolicy?.read_only;

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent) return;
    
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    
    const payload = {
      case_id: caseId,
      timeline_event: newEvent,
      event_time: new Date().toISOString(),
      analyst_id: userData?.user?.id || null,
    };

    const { data, error } = await supabase.from('investigations').insert([payload]).select("*, analyst:auth.users(id, raw_user_meta_data)").single();
    
    if (error) {
      toast.error(error.message);
    } else if (data) {
      setInvestigations([data, ...investigations]);
      setNewEvent("");
      toast.success("Event logged to timeline.");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-[#020202] border border-border p-5 rounded-lg space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-xs font-mono font-bold flex items-center gap-2 text-foreground uppercase tracking-widest">
          <Terminal className="w-4 h-4 text-indigo-500" />
          System Trace & Investigation Timeline
        </h2>
      </div>
      
      {!isReadOnly && (
        <form onSubmit={handleAddEvent} className="flex gap-2">
          <input 
            type="text" 
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
            placeholder="Log an investigation event..." 
            className="flex-1 bg-background/50 border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={submitting || !newEvent}
            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-[1px] before:bg-white/10 pt-2 max-h-[500px] overflow-y-auto custom-scrollbar">
          {investigations.map((inv) => (
            <div key={inv.id} className="relative flex items-center gap-4 group">
              <div className="flex items-center justify-center w-4 h-4 rounded-full border border-indigo-500/50 bg-background shrink-0 relative z-10 shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              </div>
              <div className="flex-1 bg-white/[0.02] border border-white/5 p-3 rounded hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="font-mono text-muted-foreground text-[10px] uppercase tracking-widest mb-1">
                    {formatDistanceToNow(new Date(inv.event_time), { addSuffix: true })}
                  </div>
                  {inv.analyst?.raw_user_meta_data?.full_name && (
                    <div className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-white/5">
                      {inv.analyst.raw_user_meta_data.full_name}
                    </div>
                  )}
                </div>
                <div className="text-foreground text-xs">{inv.timeline_event}</div>
              </div>
            </div>
          ))}

          {/* Genesis Event */}
          <div className="relative flex items-center gap-4 group">
            <div className="flex items-center justify-center w-4 h-4 rounded-full border border-emerald-500/50 bg-background shrink-0 relative z-10 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <div className="flex-1 bg-emerald-900/10 border border-emerald-500/20 p-3 rounded transition-colors">
              <div className="font-mono text-muted-foreground text-[10px] uppercase tracking-widest mb-1">{formatDistanceToNow(new Date(caseCreatedAt), { addSuffix: true })}</div>
              <div className="text-emerald-400/80 text-xs font-mono">Case manually opened by System</div>
            </div>
          </div>
      </div>
    </div>
  );
}
