"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { ShieldAlert, Info, AlertTriangle, Terminal, Target, AlertOctagon, FileWarning, Filter, Maximize2, Search, Copy } from "lucide-react";
import { IsolateHostModal } from "./IsolateHostModal";
import { AddIocModal } from "../iocs/AddIocModal";
import { LogDetailsModal } from "./LogDetailsModal";

type EndpointLog = {
  id: string;
  timestamp: string;
  machine_name: string;
  event_id: number;
  provider: string;
  level: string;
  message: string;
};

export function LogStreamTable() {
  const [logs, setLogs] = useState<EndpointLog[]>([]);
  const supabase = createClient();

  const [isolateHost, setIsolateHost] = useState<string | null>(null);
  const [iocPreFill, setIocPreFill] = useState<{value: string, type: string, description: string} | null>(null);
  const [selectedLog, setSelectedLog] = useState<EndpointLog | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  // Fetch initial logs and re-fetch when level filter changes
  useEffect(() => {
    const fetchLogs = async () => {
      let query = supabase
        .from('endpoint_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (filterLevel !== "all") {
        if (filterLevel === "error") {
          query = query.or('level.ilike.%error%,level.ilike.%critical%');
        } else {
          query = query.ilike('level', `%${filterLevel}%`);
        }
      }

      const { data } = await query;
      if (data) setLogs(data);
    };

    fetchLogs();

    // Subscribe to realtime inserts
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'endpoint_logs' },
        (payload) => {
          setLogs((currentLogs) => {
            const newLog = payload.new as EndpointLog;
            // Only prepend if it matches the current filter
            if (filterLevel !== "all") {
               const l = newLog.level.toLowerCase();
               if (filterLevel === "error" && !(l.includes("error") || l.includes("critical"))) return currentLogs;
               if (filterLevel !== "error" && !l.includes(filterLevel)) return currentLogs;
            }
            return [newLog, ...currentLogs].slice(0, 100);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterLevel]);

  const getLevelColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('err') || l.includes('crit')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (l.includes('warn')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (l.includes('audit')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  const getLevelIcon = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('err') || l.includes('crit')) return <ShieldAlert className="w-3.5 h-3.5" />;
    if (l.includes('warn')) return <AlertTriangle className="w-3.5 h-3.5" />;
    return <Info className="w-3.5 h-3.5" />;
  };

  const handleEscalate = async (log: EndpointLog) => {
    const title = `SIEM Alert: Event ${log.event_id} on ${log.machine_name}`;
    const desc = `Escalated from SIEM Endpoint Telemetry.

**Timestamp:** ${new Date(log.timestamp).toLocaleString()}
**Provider:** ${log.provider}
**Severity:** ${log.level}

**Raw Message:**
\`\`\`text
${log.message}
\`\`\``;
    
    await supabase.from('case').insert({
      title,
      description: desc,
      status: 'Open',
      severity: log.level.toLowerCase().includes('err') ? 'High' : 'Medium'
    });
    
    toast.success("Incident successfully escalated to a new Active Case.");
  };

  const filteredLogs = logs.filter(log => {
    const matchesText = filterText === "" || 
      log.message?.toLowerCase().includes(filterText.toLowerCase()) ||
      log.event_id.toString().includes(filterText) ||
      log.provider?.toLowerCase().includes(filterText.toLowerCase());
      
    const matchesLevel = filterLevel === "all" || log.level.toLowerCase().includes(filterLevel.toLowerCase());
    
    return matchesText && matchesLevel;
  });

  return (
    <div className="relative z-10 w-full animate-in fade-in duration-500 pb-20">
      
      {selectedLog && (
        <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

      {isolateHost && (
        <IsolateHostModal machineName={isolateHost} onClose={() => setIsolateHost(null)} />
      )}

      {iocPreFill && (
        <AddIocModal 
          onClose={() => setIocPreFill(null)} 
        />
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4 bg-background/40 backdrop-blur-md border border-white/5 p-3 rounded-lg">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search logs, Event IDs..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-muted border border-border rounded-md py-1.5 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <select 
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-muted border border-border rounded-md py-1.5 px-3 text-sm text-foreground focus:outline-none focus:border-indigo-500/50"
          >
            <option value="all">All Levels</option>
            <option value="info">Information</option>
            <option value="warn">Warning</option>
            <option value="error">Error/Critical</option>
            <option value="audit">Audit</option>
          </select>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Showing {filteredLogs.length} events
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded-lg bg-background/40 backdrop-blur-md">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] uppercase bg-background/60 text-muted-foreground border-b border-border font-mono tracking-widest sticky top-0">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
              <th className="px-4 py-3 whitespace-nowrap">Machine</th>
              <th className="px-4 py-3 whitespace-nowrap">Level</th>
              <th className="px-4 py-3 whitespace-nowrap">Event ID</th>
              <th className="px-4 py-3 whitespace-nowrap">Provider</th>
              <th className="px-4 py-3 w-full">Message</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground font-mono text-xs">
                  <Terminal className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                  {logs.length === 0 ? "Awaiting endpoint telemetry..." : "No logs match your current filters."}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group font-mono text-xs">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-foreground font-bold whitespace-nowrap">
                    {log.machine_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-indigo-400 whitespace-nowrap">
                    {log.event_id}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]" title={log.provider}>
                    {log.provider}
                  </td>
                  <td className="px-4 py-3 text-foreground line-clamp-2 max-w-xl" title={log.message}>
                    {log.message || "-"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        title="View Full Details"
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-indigo-400 transition-colors"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setFilterText(log.machine_name)}
                        title="Find Related Events"
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-emerald-400 transition-colors"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                          toast.success("Raw event JSON copied to clipboard!");
                        }}
                        title="Copy Raw Event"
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-white/10 mx-1"></div>
                      <button 
                        onClick={() => handleEscalate(log)}
                        title="Escalate to Case"
                        className="p-1.5 rounded-md hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors"
                      >
                        <FileWarning className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setIocPreFill({value: log.provider, type: "Unknown", description: `Extracted from Event ${log.event_id}`})}
                        title="Flag as IOC"
                        className="p-1.5 rounded-md hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 transition-colors"
                      >
                        <Target className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-white/10 mx-1"></div>
                      <button 
                        onClick={() => setIsolateHost(log.machine_name)}
                        title="Isolate Host"
                        className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                      >
                        <AlertOctagon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
