"use client";

import { useState } from "react";
import { Terminal, X, Activity, Search, Cpu, HardDrive } from "lucide-react";
import { triggerForensicsAction } from "@/app/actions";
import { toast } from "sonner";

interface ForensicsModalProps {
  machineName: string;
  caseId?: string; // Optional: If provided, the action will be logged to the case timeline
  onClose: () => void;
}

export function ForensicsModal({ machineName, caseId, onClose }: ForensicsModalProps) {
  const [selectedAction, setSelectedAction] = useState<"memdump" | "triage" | "quarantine">("triage");
  const [payload, setPayload] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleExecute = async () => {
    if (selectedAction === "quarantine" && !payload) {
      toast.error("Please provide a file hash or path to quarantine.");
      return;
    }
    
    setIsExecuting(true);
    
    const res = await triggerForensicsAction(machineName, selectedAction, payload, caseId);
    
    setIsExecuting(false);

    if (res.success) {
      setIsSuccess(true);
      toast.success(`Forensic action '${selectedAction}' executed successfully on ${machineName}!`);
      setTimeout(() => {
        onClose();
      }, 3000);
    } else {
      toast.error(`Execution Failed: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-blue-500/30 rounded-xl shadow-2xl shadow-blue-500/10 overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-blue-500/5">
          <div className="flex items-center gap-2 text-blue-400">
            <Terminal className="w-5 h-5" />
            <h2 className="font-semibold tracking-tight">Digital Forensics (Wazuh AR)</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Payload Delivered</h3>
              <p className="text-muted-foreground font-mono text-sm">
                The forensic collection script has been successfully pushed to <span className="text-blue-400">{machineName}</span>.
              </p>
            </div>
          ) : (
            <>
              <p className="text-foreground text-sm mb-6 leading-relaxed">
                Select an active response script to execute on <strong className="text-foreground bg-white/10 px-1 py-0.5 rounded font-mono">{machineName}</strong>. 
                Data collected will be processed by the SIEM pipeline.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setSelectedAction("triage")}
                  className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-2 ${
                    selectedAction === "triage" 
                      ? "bg-blue-500/10 border-blue-500/50 text-blue-400" 
                      : "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Search className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Triage Collect</span>
                </button>
                
                <button
                  onClick={() => setSelectedAction("memdump")}
                  className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-2 ${
                    selectedAction === "memdump" 
                      ? "bg-purple-500/10 border-purple-500/50 text-purple-400" 
                      : "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Cpu className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Memory Dump</span>
                </button>

                <button
                  onClick={() => setSelectedAction("quarantine")}
                  className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-2 ${
                    selectedAction === "quarantine" 
                      ? "bg-rose-500/10 border-rose-500/50 text-rose-400" 
                      : "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <HardDrive className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Quarantine</span>
                </button>
              </div>

              {selectedAction === "triage" && (
                <div className="bg-background border border-blue-500/20 rounded-md p-4 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <h4 className="text-sm font-semibold text-blue-400 mb-1">Live Triage Collection</h4>
                  <p className="text-xs text-muted-foreground">
                    Pulls currently running processes, active network connections (netstat), and files modified in the last 24 hours. Minimal endpoint performance impact.
                  </p>
                </div>
              )}

              {selectedAction === "memdump" && (
                <div className="bg-background border border-purple-500/20 rounded-md p-4 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                  <h4 className="text-sm font-semibold text-purple-400 mb-1">Full RAM Acquisition</h4>
                  <p className="text-xs text-muted-foreground">
                    Initiates a complete memory dump on the endpoint using WinPMEM or similar tools. <span className="text-rose-400 font-bold">WARNING:</span> This may impact endpoint performance and generate significant network traffic.
                  </p>
                </div>
              )}

              {selectedAction === "quarantine" && (
                <div className="bg-background border border-rose-500/20 rounded-md p-4 mb-6 relative overflow-hidden space-y-3">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                  <h4 className="text-sm font-semibold text-rose-400 mb-1">Targeted File Quarantine</h4>
                  <p className="text-xs text-muted-foreground">
                    Provide the SHA256 hash or absolute file path to instantly delete or quarantine the artifact on the host.
                  </p>
                  <input
                    type="text"
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground text-xs focus:outline-none focus:border-rose-500/50 font-mono"
                    placeholder="e.g. C:\Temp\malware.exe OR e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
              )}

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || (selectedAction === "quarantine" && !payload)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-foreground rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Terminal className="w-4 h-4" />
                      Run Forensic Script
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
