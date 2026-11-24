"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FileText, Plus, Hash, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useIAM } from "@/app/dashboard/layout";

export function EvidenceWidget({ caseId, initialEvidence }: { caseId: string, initialEvidence: any[] }) {
  const [evidence, setEvidence] = useState(initialEvidence);
  const [description, setDescription] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const supabase = createClient();
  const iamPolicy = useIAM();
  const isReadOnly = iamPolicy?.read_only;

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return toast.error("Description is required.");
    
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    
    const payload = {
      case_id: caseId,
      description,
      file_hash: fileHash || null,
      file_url: fileUrl || null,
      uploaded_by: userData?.user?.id || null,
    };

    const { data, error } = await supabase.from('evidence').insert([payload]).select("*, uploaded_by:auth.users(id, raw_user_meta_data)").single();
    
    if (error) {
      toast.error(error.message);
    } else if (data) {
      setEvidence([data, ...evidence]);
      setDescription("");
      setFileHash("");
      setFileUrl("");
      setShowAddForm(false);
      toast.success("Evidence logged to vault.");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-[#020202] border border-border p-5 rounded-lg space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-xs font-mono font-bold flex items-center gap-2 text-foreground uppercase tracking-widest">
          <FileText className="w-4 h-4 text-amber-500" />
          Evidence Vault
        </h2>
        {!isReadOnly && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Evidence
          </button>
        )}
      </div>
      
      {showAddForm && !isReadOnly && (
        <form onSubmit={handleAddEvidence} className="bg-white/[0.02] border border-white/5 p-4 rounded-lg space-y-3 mb-4">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">Description</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Memory Dump from compromised server" 
              className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">File Hash (Optional)</label>
              <input 
                type="text" 
                value={fileHash}
                onChange={(e) => setFileHash(e.target.value)}
                placeholder="SHA256" 
                className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-foreground font-mono text-xs focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">File URL (Optional)</label>
              <input 
                type="text" 
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..." 
                className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-foreground text-xs focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting || !description}
              className="bg-amber-600 hover:bg-amber-500 text-foreground rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Evidence'}
            </button>
          </div>
        </form>
      )}

      {evidence.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm font-mono">No evidence logged yet.</div>
      ) : (
        <div className="space-y-3">
          {evidence.map((ev) => (
            <div key={ev.id} className="bg-background/30 border border-white/5 p-3 rounded hover:border-amber-500/30 transition-colors flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="text-foreground text-sm font-medium">{ev.description}</div>
                <div className="font-mono text-muted-foreground text-[10px] uppercase tracking-widest whitespace-nowrap">
                  {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}
                </div>
              </div>
              
              {(ev.file_hash || ev.file_url) && (
                <div className="flex flex-wrap gap-3 mt-1">
                  {ev.file_hash && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-white/5">
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      {ev.file_hash.substring(0, 16)}...
                    </div>
                  )}
                  {ev.file_url && (
                    <a href={ev.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/20 transition-colors">
                      <Download className="w-3 h-3" />
                      Download Evidence
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
