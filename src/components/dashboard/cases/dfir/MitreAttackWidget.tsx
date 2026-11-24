"use client";

import { Crosshair, Shield, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { addCaseMitre, deleteCaseMitre } from "@/app/actions";

interface MitreAttackWidgetProps {
  caseId: string;
  initialMitreData: any[];
}

export function MitreAttackWidget({ caseId, initialMitreData }: MitreAttackWidgetProps) {
  const [mitreData, setMitreData] = useState<any[]>(initialMitreData || []);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`mitre_${caseId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_mitre', filter: `case_id=eq.${caseId}` }, (payload) => {
        setMitreData(cur => [...cur, payload.new]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'case_mitre', filter: `case_id=eq.${caseId}` }, (payload) => {
        setMitreData(cur => cur.filter(m => m.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseId, supabase]);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await addCaseMitre(
        caseId,
        fd.get('tacticId') as string,
        fd.get('tacticName') as string,
        fd.get('techniqueId') as string,
        fd.get('techniqueName') as string
      );
      setIsAdding(false);
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this MITRE mapping?")) return;
    await deleteCaseMitre(id, caseId);
  };

  // Group by tactic
  const grouped: Record<string, { id: string, name: string, techniques: any[] }> = {};
  mitreData.forEach(m => {
    if (!grouped[m.tactic_id]) {
      grouped[m.tactic_id] = { id: m.tactic_id, name: m.tactic_name, techniques: [] };
    }
    grouped[m.tactic_id].techniques.push(m);
  });
  const tacticsList = Object.values(grouped);

  return (
    <div className="bg-[#020202] border border-border rounded-lg overflow-hidden flex flex-col h-[300px]">
      <div className="flex items-center justify-between p-3 border-b border-border bg-background/50">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-red-500" />
          <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">MITRE ATT&CK® Mapping</h3>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mr-2">Enterprise Matrix v14</span>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 text-[10px] font-mono text-foreground hover:text-foreground border border-border hover:border-indigo-500/50 hover:bg-indigo-500/10 px-2 py-1 rounded transition-all"
          >
            <Plus className="w-3 h-3" /> MAP TACTIC
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-4 bg-background/40">
        {isAdding && (
          <form onSubmit={handleAdd} className="mb-4 bg-indigo-950/20 p-2 border border-indigo-500/30 rounded flex items-center gap-2 min-w-max w-[600px]">
            <input name="tacticId" required placeholder="TA0001" className="w-20 bg-background/50 border border-border rounded px-1 text-foreground text-xs py-1" />
            <input name="tacticName" required placeholder="Initial Access" className="flex-1 bg-background/50 border border-border rounded px-1 text-foreground text-xs py-1" />
            <input name="techniqueId" required placeholder="T1190" className="w-20 bg-background/50 border border-border rounded px-1 text-foreground text-xs py-1" />
            <input name="techniqueName" required placeholder="Exploit Public-Facing App" className="flex-1 bg-background/50 border border-border rounded px-1 text-foreground text-xs py-1" />
            <button type="submit" disabled={isPending} className="bg-indigo-500 text-foreground px-2 py-1 text-xs rounded ml-2">{isPending ? "..." : "Save"}</button>
          </form>
        )}

        {tacticsList.length === 0 && !isAdding && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No MITRE ATT&CK tactics mapped to this case.</div>
        )}

        <div className="flex gap-2 min-w-max">
          {tacticsList.map((tactic) => (
            <div key={tactic.id} className="w-48 flex flex-col gap-2">
              <div className="bg-muted border border-border rounded p-2 sticky top-0 z-10 backdrop-blur-md">
                <div className="text-[9px] font-mono text-muted-foreground mb-0.5">{tactic.id}</div>
                <div className="text-[11px] font-bold text-foreground uppercase tracking-wider truncate" title={tactic.name}>{tactic.name}</div>
              </div>
              
              <div className="flex flex-col gap-1">
                {tactic.techniques.map((tech) => (
                  <div 
                    key={tech.id} 
                    className="group relative p-2 rounded text-[10px] font-mono border transition-all bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)_inset]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>{tech.technique_id}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                    </div>
                    <div className="truncate" title={tech.technique_name}>{tech.technique_name}</div>
                    
                    <button 
                      onClick={() => handleDelete(tech.id)} 
                      className="absolute top-1 right-5 opacity-0 group-hover:opacity-100 text-red-300 hover:text-foreground transition-opacity bg-background/50 rounded p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
