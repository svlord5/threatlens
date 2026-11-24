import { useState } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import { AlertOctagon, Cpu, Terminal, Settings2, Webhook, X } from "lucide-react";

export function ActionNode({ id, data }: { id: string, data: any }) {
  const { setNodes } = useReactFlow();
  const [expanded, setExpanded] = useState(false);
  
  const updateNodeData = (newData: any) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, ...newData };
        }
        return node;
      })
    );
  };

  let Icon = Cpu;
  let colorClass = "text-emerald-400";
  let bgClass = "bg-emerald-500/20";
  let borderClass = "border-emerald-500/30";
  let containerBorder = "border-emerald-500/50";
  let shadowClass = "shadow-[0_0_15px_rgba(16,185,129,0.1)]";
  let handleBg = "bg-emerald-500";

  const isIsolate = data.label.includes("Isolate") || data.label.includes("Disable") || data.label.includes("Block");
  const isPowerShell = data.label.includes("Script") || data.label.includes("PowerShell");
  const isDiscord = data.label.includes("Discord") || data.label.includes("Webhook");

  if (isIsolate) {
    Icon = AlertOctagon;
    colorClass = "text-rose-500";
    bgClass = "bg-rose-500/20";
    borderClass = "border-rose-500/30";
    containerBorder = "border-rose-500/50";
    shadowClass = "shadow-[0_0_15px_rgba(244,63,94,0.1)]";
    handleBg = "bg-rose-500";
  } else if (isPowerShell) {
    Icon = Terminal;
    colorClass = "text-blue-400";
    bgClass = "bg-blue-500/20";
    borderClass = "border-blue-500/30";
    containerBorder = "border-blue-500/50";
    shadowClass = "shadow-[0_0_15px_rgba(59,130,246,0.1)]";
    handleBg = "bg-blue-500";
  } else if (isDiscord) {
    Icon = Webhook;
    colorClass = "text-indigo-400";
    bgClass = "bg-indigo-500/20";
    borderClass = "border-indigo-500/30";
    containerBorder = "border-indigo-500/50";
    shadowClass = "shadow-[0_0_15px_rgba(99,102,241,0.1)]";
    handleBg = "bg-indigo-500";
  }
  
  return (
    <div className={`bg-muted border ${containerBorder} rounded-lg p-3 min-w-[200px] ${shadowClass} relative`}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className={`w-3 h-3 ${handleBg} border-2 border-[#0a0a0a]`}
      />

      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-md ${bgClass} flex items-center justify-center border ${borderClass}`}>
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
        <div className="flex-1">
          <div className={`text-[10px] font-mono ${colorClass} font-bold tracking-wider uppercase mb-0.5`}>Action</div>
          <div className="text-xs text-foreground font-medium">{data.label}</div>
        </div>
        
        {(isPowerShell || isDiscord || isIsolate) && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {expanded ? <X className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          
          {isPowerShell && (
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase">PowerShell Script</label>
              <textarea 
                className="w-full h-24 bg-background border border-border rounded p-2 text-xs font-mono text-foreground focus:outline-none focus:border-blue-500/50 resize-none nodrag"
                placeholder="Write-Host 'Executed!'"
                value={data.script_content || ""}
                onChange={(e) => updateNodeData({ script_content: e.target.value })}
              />
              <p className="text-[9px] text-muted-foreground mt-1">Executes automatically on target endpoints via ThreatLens Agent.</p>
            </div>
          )}

          {isDiscord && (
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase">Webhook URL</label>
              <input 
                type="text"
                className="w-full bg-background border border-border rounded p-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500/50 nodrag"
                placeholder="https://discord.com/api/webhooks/..."
                value={data.webhook_url || ""}
                onChange={(e) => updateNodeData({ webhook_url: e.target.value })}
              />
            </div>
          )}

          {isIsolate && (
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase">Isolation Scope</label>
              <select
                className="w-full bg-background border border-border rounded p-1.5 text-xs text-foreground focus:outline-none focus:border-rose-500/50 nodrag"
                value={data.isolation_scope || "affected"}
                onChange={(e) => updateNodeData({ isolation_scope: e.target.value })}
              >
                <option value="affected">Isolate only Affected Endpoints</option>
                <option value="subnet">Isolate Entire Local Subnet</option>
              </select>
            </div>
          )}

        </div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className={`w-3 h-3 ${handleBg} border-2 border-[#0a0a0a]`}
      />
    </div>
  );
}
