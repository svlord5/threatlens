"use client";

import { useState } from "react";
import { AlertOctagon, Terminal, Shield, X, Activity } from "lucide-react";

interface IsolateHostModalProps {
  machineName: string;
  onClose: () => void;
}

import { isolateHostAction } from "@/app/actions";
import { toast } from "sonner";

export function IsolateHostModal({ machineName, onClose }: IsolateHostModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isIsolating, setIsIsolating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleIsolate = async () => {
    if (confirmText !== machineName) return;
    
    setIsIsolating(true);
    
    const res = await isolateHostAction(machineName);
    
    setIsIsolating(false);

    if (res.success) {
      setIsSuccess(true);
      toast.success("Host Isolated Successfully via Wazuh Active Response!");
      setTimeout(() => {
        onClose();
      }, 3000);
    } else {
      toast.error(`Isolation Failed: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-rose-500/30 rounded-xl shadow-2xl shadow-rose-500/10 overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-rose-500/5">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertOctagon className="w-5 h-5" />
            <h2 className="font-semibold tracking-tight">Emergency Host Isolation</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Shield className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Host Isolated Successfully</h3>
              <p className="text-muted-foreground font-mono text-sm">
                {machineName} has been completely disconnected from the network.
              </p>
            </div>
          ) : (
            <>
              <p className="text-foreground text-sm mb-4 leading-relaxed">
                You are about to issue a critical command to the EDR agent on <strong className="text-foreground bg-white/10 px-1 py-0.5 rounded font-mono">{machineName}</strong>. 
                This will sever all network connections (except to the SOC management console) to prevent lateral movement or data exfiltration.
              </p>

              <div className="bg-background border border-rose-500/20 rounded-md p-4 mb-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <div className="flex items-start gap-3">
                  <Terminal className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-rose-500 mb-1">WARNING: Disruptive Action</h4>
                    <p className="text-xs text-muted-foreground">
                      This action will disconnect active user sessions and stop business operations on this endpoint.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-background border border-emerald-500/20 rounded-md p-4 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-500 mb-1">Recovery & Un-isolation</h4>
                    <p className="text-xs text-muted-foreground">
                      To restore network connectivity to this host, an administrator must physically access the machine (or use Out-of-Band Management) and execute <code className="bg-white/10 px-1 py-0.5 rounded text-emerald-400">ThreatLens-Agent.ps1 -Recover</code>. Remote un-isolation is not supported by design to prevent malware from reversing the action.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground block">
                  Type the machine name <span className="font-mono text-rose-400 select-all">{machineName}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:outline-none focus:border-rose-500/50 font-mono"
                  placeholder="Enter machine name..."
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIsolate}
                  disabled={confirmText !== machineName || isIsolating}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:hover:bg-rose-600 text-foreground rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isIsolating ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      Executing Payload...
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="w-4 h-4" />
                      Isolate Host
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
