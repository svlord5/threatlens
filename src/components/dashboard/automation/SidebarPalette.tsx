"use client";

import { ShieldAlert, Cpu, Database, Zap, GripVertical, AlertOctagon, Terminal } from "lucide-react";

export function SidebarPalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-card border-l border-border p-4 flex flex-col h-full overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-foreground font-bold text-sm tracking-tight flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-amber-500" />
          Playbook Nodes
        </h3>
        <p className="text-xs text-muted-foreground">Drag items to the canvas.</p>
      </div>

      <div className="space-y-6">
        {/* Triggers */}
        <div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Triggers</div>
          <div className="space-y-2">
            <div 
              className="group flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-indigo-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'trigger', 'SIEM Event Received')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-foreground">SIEM Event</span>
            </div>
            <div 
              className="group flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-indigo-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'trigger', 'New IOC Flagged')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <Database className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-foreground">New IOC Flagged</span>
            </div>
            <div 
              className="group flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-indigo-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'trigger', 'Phishing Email Detected')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-foreground">Phishing Email</span>
            </div>
            <div 
              className="group flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-indigo-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'trigger', 'Impossible Travel Alert')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-foreground">Impossible Travel</span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Conditions</div>
          <div className="space-y-2">
            <div 
              className="group flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-amber-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'condition', 'Check Severity')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <div className="w-4 h-4 border-2 border-amber-400 rotate-45 scale-75 flex items-center justify-center rounded-sm"></div>
              <span className="text-xs font-medium text-foreground">Severity Check</span>
            </div>
            <div 
              className="group flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-amber-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'condition', 'Check Time of Day')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <div className="w-4 h-4 border-2 border-amber-400 rotate-45 scale-75 flex items-center justify-center rounded-sm"></div>
              <span className="text-xs font-medium text-foreground">Time of Day</span>
            </div>
            <div 
              className="group flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-amber-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'condition', 'Has Active Threats')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <div className="w-4 h-4 border-2 border-amber-400 rotate-45 scale-75 flex items-center justify-center rounded-sm"></div>
              <span className="text-xs font-medium text-foreground">Has Active Threats</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Actions</div>
          <div className="space-y-2">
            <div 
              className="group flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-rose-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'action', 'Isolate Endpoint')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-medium text-foreground">Isolate Host</span>
            </div>
            <div 
              className="group flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-rose-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'action', 'Disable User Account')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-medium text-foreground">Disable User</span>
            </div>
            <div 
              className="group flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-emerald-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'action', 'Create Case')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-foreground">Create Case</span>
            </div>
            <div 
              className="group flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-indigo-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'action', 'Discord Webhook')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-foreground">Discord Webhook</span>
            </div>
            <div 
              className="group flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-blue-500/20 transition-colors"
              onDragStart={(e) => onDragStart(e, 'action', 'Execute PowerShell')}
              draggable
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-foreground">Run Script</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
