"use client";

import { AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";

const SEVERITY_CONFIG = {
  Critical: { color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10', icon: ShieldAlert },
  High: { color: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle },
  Medium: { color: 'bg-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: AlertCircle },
  Low: { color: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/10', icon: Info },
};

export default function SeverityChart({ findings }: { findings: any[] }) {
  if (!findings || findings.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm opacity-50 py-10">
        <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
        No findings
      </div>
    );
  }

  const counts = findings.reduce((acc, finding) => {
    const sev = finding.severity || 'Low';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, { Critical: 0, High: 0, Medium: 0, Low: 0 } as Record<string, number>);

  const total = findings.length;

  return (
    <div className="flex flex-col justify-center h-full space-y-5 px-2 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {Object.entries(SEVERITY_CONFIG).map(([sev, config]) => {
        const count = counts[sev] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const Icon = config.icon;

        return (
          <div key={sev} className="w-full group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-md ${config.bg} border border-white/5 shadow-sm`}>
                  <Icon className={`w-3.5 h-3.5 ${config.text}`} />
                </div>
                <span className="text-sm font-medium text-foreground tracking-wide">{sev}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-semibold text-foreground">{count}</span>
                <span className="text-xs font-medium text-muted-foreground w-8 text-right">{percentage}%</span>
              </div>
            </div>
            {/* Progress Bar Container */}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-white/5 shadow-inner">
              {/* Fill */}
              <div 
                className={`h-full ${config.color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                style={{ 
                  width: `${percentage}%`,
                  boxShadow: percentage > 0 ? `0 0 10px var(--tw-shadow-color)` : 'none',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
