"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Activity, ShieldAlert, Server } from "lucide-react";

export function SiemAnalyticsCharts() {
  const [logs, setLogs] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchLogs = async () => {
      // Fetch up to 1000 recent logs for analytics
      const { data } = await supabase
        .from('endpoint_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);
      
      if (data) setLogs(data);
    };

    fetchLogs();

    const channel = supabase.channel('analytics-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'endpoint_logs' },
        (payload) => {
          setLogs((current) => [payload.new, ...current].slice(0, 1000));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Process data for charts
  if (logs.length === 0) return null;

  // 1. Severity Distribution
  const severityMap: Record<string, number> = { Critical: 0, Warning: 0, Info: 0, Audit: 0 };
  logs.forEach(log => {
    const l = log.level.toLowerCase();
    if (l.includes('err') || l.includes('crit')) severityMap.Critical++;
    else if (l.includes('warn')) severityMap.Warning++;
    else if (l.includes('audit')) severityMap.Audit++;
    else severityMap.Info++;
  });
  const pieData = Object.keys(severityMap).filter(k => severityMap[k] > 0).map(k => ({ name: k, value: severityMap[k] }));
  const COLORS: Record<string, string> = { Critical: '#f43f5e', Warning: '#fbbf24', Info: '#3b82f6', Audit: '#a855f7' };

  // 2. Top Endpoints
  const endpointMap: Record<string, number> = {};
  logs.forEach(log => {
    endpointMap[log.machine_name] = (endpointMap[log.machine_name] || 0) + 1;
  });
  const barData = Object.entries(endpointMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // 3. Activity Timeline (group by last 10 minutes)
  const timelineMap: Record<string, number> = {};
  logs.forEach(log => {
    const date = new Date(log.timestamp);
    const timeKey = `${date.getHours().toString().padStart(2, '0')}:${(Math.floor(date.getMinutes() / 5) * 5).toString().padStart(2, '0')}`;
    timelineMap[timeKey] = (timelineMap[timeKey] || 0) + 1;
  });
  const areaData = Object.entries(timelineMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, count]) => ({ time, events: count }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      
      {/* Activity Timeline */}
      <div className="bg-background/40 border border-white/5 rounded-xl p-5 backdrop-blur-md relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase">Event Velocity</h3>
        </div>
        <div className="h-40 w-full mt-4">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={areaData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="events" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Endpoints */}
      <div className="bg-background/40 border border-white/5 rounded-xl p-5 backdrop-blur-md relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <Server className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase">Top Talkers</h3>
        </div>
        <div className="h-40 w-full mt-4">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#34d399" radius={[0, 4, 4, 0]} barSize={16}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#34d399', '#10b981', '#059669', '#047857'][index % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="bg-background/40 border border-white/5 rounded-xl p-5 backdrop-blur-md relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none"></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase">Severity Matrix</h3>
          </div>
        </div>
        <div className="h-40 w-full flex items-center justify-center mt-4">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
