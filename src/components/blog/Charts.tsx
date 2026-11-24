"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const radarData = [
  { subject: "Stealth", VoltTyphoon: 95, ScatteredSpider: 60, MidnightBlizzard: 85, fullMark: 100 },
  { subject: "Speed", VoltTyphoon: 40, ScatteredSpider: 90, MidnightBlizzard: 60, fullMark: 100 },
  { subject: "Social Eng", VoltTyphoon: 10, ScatteredSpider: 100, MidnightBlizzard: 75, fullMark: 100 },
  { subject: "Tech Sophistication", VoltTyphoon: 85, ScatteredSpider: 50, MidnightBlizzard: 95, fullMark: 100 },
  { subject: "Cloud Exploit", VoltTyphoon: 30, ScatteredSpider: 80, MidnightBlizzard: 100, fullMark: 100 },
];

export function ActorComparisonChart() {
  return (
    <div className="h-[400px] w-full bg-card border border-border rounded-2xl p-6">
      <h3 className="text-foreground font-bold mb-4 text-center">Threat Actor Capability Comparison</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#ffffff" }} />
            <Radar name="Volt Typhoon" dataKey="VoltTyphoon" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
            <Radar name="Scattered Spider" dataKey="ScatteredSpider" stroke="#eab308" fill="#eab308" fillOpacity={0.4} />
            <Radar name="Midnight Blizzard" dataKey="MidnightBlizzard" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", color: "#fff" }}
              itemStyle={{ fontSize: "12px" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const barData = [
  { name: "Initial Access", VoltTyphoon: 1, ScatteredSpider: 4, MidnightBlizzard: 3 },
  { name: "Execution", VoltTyphoon: 4, ScatteredSpider: 2, MidnightBlizzard: 3 },
  { name: "Persistence", VoltTyphoon: 3, ScatteredSpider: 3, MidnightBlizzard: 4 },
  { name: "Evade Defenses", VoltTyphoon: 5, ScatteredSpider: 2, MidnightBlizzard: 4 },
  { name: "Exfiltration", VoltTyphoon: 1, ScatteredSpider: 5, MidnightBlizzard: 2 },
];

export function MitreTacticsChart() {
  return (
    <div className="h-[400px] w-full bg-card border border-border rounded-2xl p-6">
      <h3 className="text-foreground font-bold mb-4 text-center">Observed ATT&CK Tactics Frequency</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barData}
            margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#3f3f46" />
            <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#3f3f46" />
            <Tooltip 
              cursor={{ fill: "#27272a" }}
              contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", color: "#fff" }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar dataKey="VoltTyphoon" name="Volt Typhoon" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ScatteredSpider" name="Scattered Spider" fill="#eab308" radius={[4, 4, 0, 0]} />
            <Bar dataKey="MidnightBlizzard" name="Midnight Blizzard" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
