"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, UserX, Globe, Hash } from "lucide-react";
import { toast } from "sonner";

export function AddThreatActorModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState("");
  const [description, setDescription] = useState("");
  const [originCountry, setOriginCountry] = useState("");
  const [mitreId, setMitreId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error("Actor name is required.");
    
    setSubmitting(true);
    
    const payload = {
      name,
      aliases: aliases.split(',').map(a => a.trim()).filter(a => a.length > 0),
      description,
      origin_country: originCountry,
      mitre_id: mitreId,
    };

    const { error } = await supabase.from('threat_actors').insert([payload]);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Threat Actor added successfully.");
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <div className="bg-[#111111] border border-border rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <UserX className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Add Threat Actor</h2>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="add-actor-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Actor Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. APT29, Lazarus Group"
                className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Aliases (comma separated)</label>
              <input 
                type="text" 
                value={aliases}
                onChange={e => setAliases(e.target.value)}
                placeholder="e.g. Cozy Bear, The Dukes"
                className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the threat actor's typical targets and TTPs..."
                className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none min-h-[100px] resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  Origin Country
                </label>
                <input 
                  type="text" 
                  value={originCountry}
                  onChange={e => setOriginCountry(e.target.value)}
                  placeholder="e.g. Russia, DPRK"
                  className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                  MITRE ID
                </label>
                <input 
                  type="text" 
                  value={mitreId}
                  onChange={e => setMitreId(e.target.value)}
                  placeholder="e.g. G0016"
                  className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground font-mono text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none"
                />
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button 
            form="add-actor-form"
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-foreground rounded-md text-sm font-medium transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Add Actor'}
          </button>
        </div>

      </div>
    </div>
  );
}
