"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, Target, Calendar, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export function AddCampaignModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetSectors, setTargetSectors] = useState("");
  const [threatActorId, setThreatActorId] = useState("");
  const [actors, setActors] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchActors() {
      const { data } = await supabase.from('threat_actors').select('id, name').order('name');
      if (data) setActors(data);
    }
    fetchActors();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error("Campaign name is required.");
    
    setSubmitting(true);
    
    const payload = {
      name,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      target_sectors: targetSectors.split(',').map(s => s.trim()).filter(s => s.length > 0),
      threat_actor_id: threatActorId || null,
    };

    const { error } = await supabase.from('campaigns').insert([payload]);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Campaign added successfully.");
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <div className="bg-[#111111] border border-border rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Track New Campaign</h2>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="add-campaign-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Campaign Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Operation Ghost"
                className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                Associated Threat Actor
              </label>
              <select 
                value={threatActorId}
                onChange={e => setThreatActorId(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none"
              >
                <option value="">Unknown / Unattributed</option>
                {actors.map(actor => (
                  <option key={actor.id} value={actor.id}>{actor.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Start Date
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  End Date
                </label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Target Sectors (comma separated)</label>
              <input 
                type="text" 
                value={targetSectors}
                onChange={e => setTargetSectors(e.target.value)}
                placeholder="e.g. Healthcare, Finance, Energy"
                className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
              />
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
            form="add-campaign-form"
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Track Campaign'}
          </button>
        </div>

      </div>
    </div>
  );
}
