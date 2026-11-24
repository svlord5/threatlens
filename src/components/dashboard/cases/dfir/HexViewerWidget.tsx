"use client";

import { Terminal, Binary, Fingerprint, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { addCaseHex, deleteCaseHex } from "@/app/actions";

interface HexViewerWidgetProps {
  caseId: string;
  initialHexData: any[];
}

export function HexViewerWidget({ caseId, initialHexData }: HexViewerWidgetProps) {
  const [hexData, setHexData] = useState<any[]>(initialHexData || []);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`hex_${caseId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_hex', filter: `case_id=eq.${caseId}` }, (payload) => {
        setHexData(cur => [...cur, payload.new]); // Append to bottom
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'case_hex', filter: `case_id=eq.${caseId}` }, (payload) => {
        setHexData(cur => cur.filter(h => h.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseId, supabase]);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await addCaseHex(
        caseId,
        fd.get('offset') as string,
        fd.get('hex') as string,
        fd.get('ascii') as string,
        fd.get('malicious') === 'on'
      );
      setIsAdding(false);
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this hex dump line?")) return;
    await deleteCaseHex(id, caseId);
  };

  // Extract strings that look malicious or are just printable ascii for the right pane
  const strings = hexData.filter(h => h.decoded_ascii.trim().length > 0).map(h => h.decoded_ascii);
  const maliciousHashes = hexData.filter(h => h.is_malicious && h.decoded_ascii.length === 64).map(h => h.decoded_ascii);

  return (
    <div className="bg-[#020202] border border-border rounded-lg overflow-hidden flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">Memory Dump / Strings</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 text-[10px] font-mono text-foreground hover:text-foreground border border-border hover:border-indigo-500/50 hover:bg-indigo-500/10 px-2 py-1 rounded transition-all"
          >
            <Plus className="w-3 h-3" /> ADD STRING
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Hex Viewer */}
        <div className="w-2/3 border-r border-border p-4 font-mono text-[10px] leading-relaxed text-muted-foreground overflow-y-auto bg-card custom-scrollbar">
          <div className="text-indigo-500/50 mb-2 border-b border-white/5 pb-2 sticky top-0 bg-card">
            OFFSET    00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F  DECODED ASCII
          </div>
          
          {isAdding && (
            <form onSubmit={handleAdd} className="mb-4 bg-indigo-950/20 p-2 border border-indigo-500/30 rounded flex items-center gap-2">
              <input name="offset" required placeholder="00000000" className="w-20 bg-background/50 border border-border rounded px-1 text-foreground" />
              <input name="hex" required placeholder="4D 5A 90 00 03 00 00 00 04 00..." className="flex-1 bg-background/50 border border-border rounded px-1 text-foreground" />
              <input name="ascii" required placeholder="MZ.............." className="w-32 bg-background/50 border border-border rounded px-1 text-foreground" />
              <label className="flex items-center gap-1 text-red-400 font-bold"><input type="checkbox" name="malicious" /> Malicious</label>
              <button type="submit" disabled={isPending} className="bg-indigo-500 text-foreground px-2 py-0.5 rounded ml-2">{isPending ? "..." : "Save"}</button>
            </form>
          )}

          {hexData.length === 0 && !isAdding && (
             <div className="py-8 text-center text-muted-foreground">No memory strings extracted.</div>
          )}

          <div className="space-y-1">
            {hexData.map((row) => (
              <div key={row.id} className="hover:bg-muted transition-colors group flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground w-20 inline-block">{row.offset_address}</span>
                  <span className={`mx-2 ${row.is_malicious ? 'text-red-400 font-bold' : 'text-indigo-400'}`}>{row.hex_bytes}</span>
                  <span className={row.is_malicious ? 'text-red-300' : 'text-muted-foreground'}>{row.decoded_ascii}</span>
                </div>
                <button onClick={() => handleDelete(row.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all px-2"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Extracted Artifacts */}
        <div className="w-1/3 p-4 flex flex-col gap-4 bg-background/40 overflow-y-auto custom-scrollbar">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-2 border-b border-border pb-1">
              <Fingerprint className="w-3 h-3 text-red-500" />
              File Hashes
            </div>
            <div className="space-y-2">
              {maliciousHashes.length === 0 ? <div className="text-[10px] text-muted-foreground font-mono">No hashes detected.</div> : maliciousHashes.map((hash, i) => (
                <div key={i} className="bg-muted p-2 rounded border border-white/5">
                  <div className="text-[9px] text-muted-foreground mb-0.5 font-mono">SHA-256 (Malicious)</div>
                  <div className="text-[10px] font-mono text-red-400 break-all select-all">{hash}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-2 border-b border-border pb-1">
              <Binary className="w-3 h-3 text-emerald-500" />
              Extracted Strings
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              {strings.length === 0 ? <div className="text-[10px] text-muted-foreground font-mono">No strings available.</div> : strings.map((str, i) => (
                <div key={i} className="text-emerald-400 bg-emerald-500/5 px-1.5 py-1 rounded truncate hover:bg-emerald-500/10 cursor-pointer transition-colors" title={str}>
                  {str}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
