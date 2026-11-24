import { Code2 } from "lucide-react";

export function RawTelemetryWidget({ rawData }: { rawData: any }) {
  return (
    <div className="bg-card border border-border p-6 rounded-md shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20"></div>
      
      <div className="relative z-10">
        <h2 className="text-sm font-medium flex items-center gap-2 text-foreground uppercase tracking-wider mb-4 border-b border-border pb-3">
          <Code2 className="w-4 h-4 text-emerald-500" />
          Raw SIEM Telemetry
        </h2>
        
        {rawData ? (
          <div className="bg-[#020202] border border-white/5 p-4 rounded overflow-auto max-h-[600px] custom-scrollbar shadow-inner">
            <pre className="text-xs font-mono text-emerald-400/90 leading-relaxed whitespace-pre-wrap break-all">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="bg-background/50 border border-white/5 p-8 rounded text-center text-muted-foreground text-sm font-mono uppercase tracking-widest">
            No raw telemetry data available for this incident.
          </div>
        )}
      </div>
    </div>
  );
}
