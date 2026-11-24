"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export function AddApiFindingModal({ onClose }: { onClose: () => void }) {
  const [endpoint, setEndpoint] = useState("");
  const [vulnerabilityType, setVulnerabilityType] = useState("BOLA");
  const [riskScore, setRiskScore] = useState("90");
  const [poc, setPoc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endpoint) return toast.error("Endpoint is required.");
    
    setSubmitting(true);
    
    const payload = {
      endpoint,
      vulnerability_type: vulnerabilityType,
      risk_score: parseInt(riskScore) || 50,
      proof_of_concept: poc,
      status: "Open"
    };

    const { error } = await supabase.from('api_findings').insert([payload]);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("API vulnerability logged successfully.");
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-muted border border-rose-500/20 rounded-xl w-full max-w-lg shadow-[0_0_50px_rgba(244,63,94,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-500/20 bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-wide">Log API Finding</h2>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="add-api-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4 space-y-2">
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Endpoint / Method</label>
                <input 
                  type="text" 
                  value={endpoint}
                  onChange={e => setEndpoint(e.target.value)}
                  placeholder="GET /api/v1/users/{id}"
                  className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground font-mono text-sm focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Vulnerability Type</label>
                <select 
                  value={vulnerabilityType}
                  onChange={e => setVulnerabilityType(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none"
                >
                  <option value="BOLA">BOLA (Broken Object Level Auth)</option>
                  <option value="BFLA">BFLA (Broken Function Level Auth)</option>
                  <option value="IDOR">IDOR (Insecure Direct Object Ref)</option>
                  <option value="Mass Assignment">Mass Assignment</option>
                  <option value="Injection">Injection</option>
                  <option value="Data Exposure">Excessive Data Exposure</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Risk Score (0-100)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={riskScore}
                  onChange={e => setRiskScore(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Proof of Concept</label>
              <textarea 
                value={poc}
                onChange={e => setPoc(e.target.value)}
                placeholder="Detail the payload, replication steps, and security impact..."
                className="w-full bg-background/50 border border-border rounded-md px-4 py-2.5 text-foreground text-sm focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none min-h-[120px] resize-y"
              />
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-rose-500/20 bg-background/40 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button 
            form="add-api-form"
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-foreground rounded-md text-sm font-medium transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:shadow-[0_0_20px_rgba(244,63,94,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Logging...' : 'Log Vulnerability'}
          </button>
        </div>

      </div>
    </div>
  );
}
