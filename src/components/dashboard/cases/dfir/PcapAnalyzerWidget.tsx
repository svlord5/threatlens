"use client";

import { Network, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { addCasePcap, deleteCasePcap } from "@/app/actions";

interface PcapAnalyzerWidgetProps {
  caseId: string;
  initialPackets: any[];
}

export function PcapAnalyzerWidget({ caseId, initialPackets }: PcapAnalyzerWidgetProps) {
  const [packets, setPackets] = useState<any[]>(initialPackets || []);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`pcap_${caseId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_pcap', filter: `case_id=eq.${caseId}` }, (payload) => {
        setPackets(cur => [payload.new, ...cur]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'case_pcap', filter: `case_id=eq.${caseId}` }, (payload) => {
        setPackets(cur => cur.filter(p => p.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseId, supabase]);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await addCasePcap(
        caseId,
        fd.get('time') as string,
        fd.get('src') as string,
        fd.get('dst') as string,
        fd.get('proto') as string,
        parseInt(fd.get('len') as string, 10),
        fd.get('info') as string,
        fd.get('malicious') === 'on'
      );
      setIsAdding(false);
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this packet?")) return;
    await deleteCasePcap(id, caseId);
  };

  return (
    <div className="bg-[#020202] border border-border rounded-lg overflow-hidden flex flex-col h-[350px]">
      <div className="flex items-center justify-between p-3 border-b border-border bg-background/50">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">Network Packet Capture</h3>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 text-[10px] font-mono text-foreground hover:text-foreground border border-border hover:border-indigo-500/50 hover:bg-indigo-500/10 px-2 py-1 rounded transition-all"
          >
            <Plus className="w-3 h-3" /> ADD PACKET
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-background/40">
        <table className="w-full text-left font-mono text-[10px] whitespace-nowrap">
          <thead className="bg-muted text-muted-foreground sticky top-0 z-10 shadow-md">
            <tr>
              <th className="px-3 py-2 font-normal w-24">Time</th>
              <th className="px-3 py-2 font-normal w-32">Source</th>
              <th className="px-3 py-2 font-normal w-32">Destination</th>
              <th className="px-3 py-2 font-normal w-16">Proto</th>
              <th className="px-3 py-2 font-normal w-16">Len</th>
              <th className="px-3 py-2 font-normal">Info</th>
              <th className="px-3 py-2 font-normal w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {isAdding && (
              <tr className="bg-indigo-950/20">
                <td colSpan={7} className="p-0 border-l-2 border-indigo-500">
                  <form onSubmit={handleAdd} className="flex w-full items-center">
                    <div className="px-2 py-1.5 w-24"><input name="time" required defaultValue={new Date().toISOString().split('T')[1].substring(0,8)} className="w-full bg-background/50 border border-border rounded px-1 text-foreground" /></div>
                    <div className="px-2 py-1.5 w-32"><input name="src" required placeholder="Source IP" className="w-full bg-background/50 border border-border rounded px-1 text-foreground" /></div>
                    <div className="px-2 py-1.5 w-32"><input name="dst" required placeholder="Dest IP" className="w-full bg-background/50 border border-border rounded px-1 text-foreground" /></div>
                    <div className="px-2 py-1.5 w-16"><input name="proto" required placeholder="TCP" className="w-full bg-background/50 border border-border rounded px-1 text-foreground" /></div>
                    <div className="px-2 py-1.5 w-16"><input name="len" type="number" required placeholder="64" className="w-full bg-background/50 border border-border rounded px-1 text-foreground" /></div>
                    <div className="px-2 py-1.5 flex-1 flex items-center gap-2">
                      <input name="info" required placeholder="Payload info..." className="flex-1 bg-background/50 border border-border rounded px-1 text-foreground" />
                      <label className="flex items-center gap-1 text-red-400 font-bold"><input type="checkbox" name="malicious" /> Malicious</label>
                      <button type="submit" disabled={isPending} className="bg-indigo-500 text-foreground px-2 py-0.5 rounded ml-2">{isPending ? "..." : "Save"}</button>
                    </div>
                  </form>
                </td>
              </tr>
            )}
            
            {packets.length === 0 && !isAdding && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No packets captured. Click &quot;Add Packet&quot; to insert real PCAP data.</td>
              </tr>
            )}

            {packets.map((p) => (
              <tr key={p.id} className={`transition-colors group ${p.is_malicious ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'hover:bg-muted text-muted-foreground'}`}>
                <td className="px-3 py-2 border-l-2 border-transparent" style={{ borderLeftColor: p.is_malicious ? '#ef4444' : 'transparent' }}>{p.packet_time}</td>
                <td className="px-3 py-2 truncate">{p.source_ip}</td>
                <td className="px-3 py-2 truncate">{p.dest_ip}</td>
                <td className={`px-3 py-2 ${p.is_malicious ? 'text-red-300 font-bold' : 'text-indigo-400'}`}>{p.protocol}</td>
                <td className="px-3 py-2">{p.length}</td>
                <td className="px-3 py-2 truncate flex items-center gap-2">
                  {p.is_malicious && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                  {p.info}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => handleDelete(p.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"><Trash2 className="w-3 h-3" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
