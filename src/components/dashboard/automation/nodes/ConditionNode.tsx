"use client";

import { Handle, Position } from "reactflow";
import { HelpCircle } from "lucide-react";

export function ConditionNode({ data }: { data: any }) {
  return (
    <div className="bg-muted border border-amber-500/50 rounded-lg p-3 min-w-[200px] shadow-[0_0_15px_rgba(245,158,11,0.1)] relative">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-amber-500 border-2 border-[#0a0a0a]"
      />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
          <div className="w-3 h-3 border-2 border-amber-400 rotate-45 rounded-sm"></div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-amber-500 font-bold tracking-wider uppercase mb-0.5">Condition</div>
          <div className="text-xs text-foreground font-medium">{data.label}</div>
        </div>
      </div>
      
      {/* Condition nodes typically have True and False branches */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] -ml-6"
      />
      <div className="absolute -bottom-5 left-[calc(50%-1.5rem)] text-[9px] font-mono text-emerald-500 font-bold">TRUE</div>

      <Handle 
        type="source" 
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 bg-rose-500 border-2 border-[#0a0a0a] ml-6"
      />
      <div className="absolute -bottom-5 right-[calc(50%-1.5rem)] text-[9px] font-mono text-rose-500 font-bold">FALSE</div>
    </div>
  );
}
