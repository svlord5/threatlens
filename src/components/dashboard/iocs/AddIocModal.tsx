"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, Target, Calendar, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { IOCType, SeverityLevel } from "@/types";

export function AddIocModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("");
  const [type, setType] = useState<IOCType>("IP");
  const [severity, setSeverity] = useState<SeverityLevel>("Medium");
  const [confidence, setConfidence] = useState(50);
  const [expiration, setExpiration] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return toast.error("Indicator value is required.");
    
    setSubmitting(true);
    
    // 1. Get User ID for RLS
    const { data: { user } } = await supabase.auth.getUser();
    
    // 2. Insert IOC
    const payload = {
      value,
      type,
      severity,
      confidence_score: confidence,
      expiration_date: expiration ? new Date(expiration).toISOString() : null,
      created_by: user?.id,
    };

    const { data: iocData, error: iocError } = await supabase.from('iocs').insert([payload]).select().single();
    
    if (iocError) {
      toast.error(iocError.message);
      setSubmitting(false);
      return;
    }

    // 3. Insert Tags
    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    if (tags.length > 0 && iocData) {
      const tagPayload = tags.map(tag => ({
        ioc_id: iocData.id,
        tag
      }));
      const { error: tagError } = await supabase.from('ioc_tags').insert(tagPayload);
      if (tagError) console.error("Failed to insert tags:", tagError);
    }

    toast.success("Indicator added to database.");
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <div className="bg-[#111111] border border-border rounded-lg w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Add Indicator of Compromise</h2>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="add-ioc-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Indicator Value</label>
              <input 
                type="text" 
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="e.g. 192.168.1.1 or malicious-domain.com"
                className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground font-mono text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Type</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value as IOCType)}
                  className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none"
                >
                  <option value="IP">IP Address</option>
                  <option value="DOMAIN">Domain</option>
                  <option value="URL">URL</option>
                  <option value="SHA256">SHA256 Hash</option>
                  <option value="MD5">MD5 Hash</option>
                  <option value="SHA1">SHA1 Hash</option>
                  <option value="EMAIL">Email Address</option>
                  <option value="REGISTRY">Registry Key</option>
                  <option value="FILE_PATH">File Path</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Severity
                </label>
                <select 
                  value={severity}
                  onChange={e => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Confidence Score: {confidence}%
                </label>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={confidence}
                onChange={e => setConfidence(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Expiration Date (Optional)
              </label>
              <input 
                type="date" 
                value={expiration}
                onChange={e => setExpiration(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
              <input 
                type="text" 
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="e.g. apt29, phishing, c2_server"
                className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button 
            form="add-ioc-form"
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Add Indicator'}
          </button>
        </div>

      </div>
    </div>
  );
}
