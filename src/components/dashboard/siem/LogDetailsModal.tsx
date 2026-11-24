import { X, Terminal, Server, Shield, Clock, Hash } from "lucide-react";

type EndpointLog = {
  id: string;
  timestamp: string;
  machine_name: string;
  event_id: number;
  provider: string;
  level: string;
  message: string;
};

interface LogDetailsModalProps {
  log: EndpointLog;
  onClose: () => void;
}

export function LogDetailsModal({ log, onClose }: LogDetailsModalProps) {
  const getLevelColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('err') || l.includes('crit')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (l.includes('warn')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (l.includes('audit')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-muted border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-foreground">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold tracking-tight">Event Details</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#111] border border-white/5 p-3 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                Timestamp
              </div>
              <div className="text-sm text-foreground font-mono">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
            
            <div className="bg-[#111] border border-white/5 p-3 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">
                <Server className="w-3.5 h-3.5" />
                Machine
              </div>
              <div className="text-sm font-bold text-foreground font-mono">
                {log.machine_name}
              </div>
            </div>
            
            <div className="bg-[#111] border border-white/5 p-3 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">
                <Hash className="w-3.5 h-3.5" />
                Event ID
              </div>
              <div className="text-sm font-bold text-indigo-400 font-mono">
                {log.event_id}
              </div>
            </div>
            
            <div className="bg-[#111] border border-white/5 p-3 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                Level
              </div>
              <div className="mt-0.5">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
              Provider
            </h3>
            <div className="bg-[#111] border border-white/5 rounded-lg p-3 text-foreground font-mono text-sm break-all">
              {log.provider}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
              Raw Message
            </h3>
            <div className="bg-background border border-white/5 rounded-lg p-4 font-mono text-sm text-foreground leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {log.message || "No message data available."}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
              Database ID
            </h3>
            <div className="bg-[#111] border border-white/5 rounded-lg p-3 text-muted-foreground font-mono text-xs">
              {log.id}
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md text-sm font-medium transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
