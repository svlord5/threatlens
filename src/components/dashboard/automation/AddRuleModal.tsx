"use client";

import { useState } from "react";
import { X, Cpu, Target, Zap, Loader2 } from "lucide-react";
import { createDetectionRule } from "@/app/actions/automation";

export function AddRuleModal({ onClose, onRuleAdded }: { onClose: () => void, onRuleAdded: (rule: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await createDetectionRule(formData);
    
    if (result.success && result.data) {
      onRuleAdded(result.data);
      onClose();
    } else {
      setError(result.error || "Failed to create rule");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-muted border border-rose-500/30 rounded-xl max-w-lg w-full overflow-hidden shadow-[0_0_50px_rgba(225,29,72,0.1)]">
        <div className="flex justify-between items-center p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2 text-rose-500 font-bold">
            <Cpu className="w-5 h-5" />
            CREATE DETECTION RULE
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded">{error}</div>}

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">Rule Name</label>
            <input name="name" type="text" required placeholder="e.g. Detect Suspicious Login" className="w-full bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-rose-500" />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">Description (Optional)</label>
            <textarea name="description" rows={2} placeholder="What does this rule detect?" className="w-full bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-rose-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#111] p-3 rounded border border-white/5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400 mb-2">
                <Target className="w-4 h-4" /> CONDITION
              </div>
              
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase">Target Field</label>
              <select name="target_field" className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground mb-3">
                <option value="message">Message Body</option>
                <option value="event_id">Event ID</option>
                <option value="machine_name">Machine Name</option>
                <option value="provider">Provider</option>
              </select>

              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase">Match Pattern (Regex/Substring)</label>
              <input name="match_pattern" type="text" required placeholder="e.g. 4624" className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-rose-500 font-mono" />
            </div>

            <div className="bg-[#111] p-3 rounded border border-white/5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-400 mb-2">
                <Zap className="w-4 h-4" /> PLAYBOOK ACTION
              </div>

              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase">Action Trigger</label>
              <select name="action_type" className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground mb-3">
                <option value="create_case">Create Active Case</option>
                <option value="isolate_host">Isolate Host (EDR)</option>
                <option value="flag_ioc">Flag as Malicious IOC</option>
                <option value="drop_log">Drop Log (Filter)</option>
              </select>

              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase">Severity</label>
              <select name="severity" className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground">
                <option value="High">High</option>
                <option value="Critical">Critical</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-foreground font-bold rounded flex items-center justify-center min-w-[120px] disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Deploy Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
