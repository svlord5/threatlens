"use client";

import { Handle, Position } from "reactflow";
import { ShieldAlert, Database } from "lucide-react";

export function TriggerNode({ data }: { data: any }) {
  const isSIEM = data.label.includes("SIEM");
  
  return (
    <div className="bg-muted border border-indigo-500/50 rounded-lg p-3 min-w-[200px] shadow-[0_0_15px_rgba(99,102,241,0.1)] relative">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
          {isSIEM ? (
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
          ) : (
            <Database className="w-4 h-4 text-indigo-400" />
          )}
        </div>
        <div>
          <div className="text-[10px] font-mono text-indigo-400 font-bold tracking-wider uppercase mb-0.5">Trigger</div>
          <div className="text-xs text-foreground font-medium">{data.label}</div>
        </div>
      </div>
      
      {/* Target handle for triggers doesn't usually exist, but if it does, it's at the top. Triggers only have sources. */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-indigo-500 border-2 border-[#0a0a0a]"
      />
    </div>
  );
}
