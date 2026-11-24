import { createClient } from "@/utils/supabase/server";
import { Status, StatusIndicator, StatusLabel } from "@/components/kibo-ui/status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCards } from "@/components/dashboard/overview/StatCards";
import { ThreatMap } from "@/components/dashboard/overview/ThreatMap";
import { RecentCases, type CaseRow } from "@/components/dashboard/overview/RecentCases";
import { IngestionChart, type IngestionPoint } from "@/components/dashboard/overview/IngestionChart";
import { ExploitedVulns } from "@/components/dashboard/overview/ExploitedVulns";
import { TopologyCard } from "@/components/dashboard/overview/TopologyCard";
import { isDemoMode } from "@/lib/demo";
import { getKevSnapshot } from "@/lib/cisa-kev";
import { ReputationDonut, type ReputationSlice } from "@/components/dashboard/overview/ReputationDonut";

export const dynamic = "force-dynamic";

const HOURS = 24;
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

/** Bucket log rows into the last 24 hours (UTC). */
function bucketLogs(rows: Array<{ timestamp: string; level: string | null }>): IngestionPoint[] {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const start = now.getTime() - (HOURS - 1) * 3_600_000;
  const points: IngestionPoint[] = Array.from({ length: HOURS }, (_, i) => ({
    label: `${String(new Date(start + i * 3_600_000).getUTCHours()).padStart(2, "0")}:00`,
    events: 0,
    alerts: 0,
  }));
  for (const r of rows) {
    const idx = Math.floor((new Date(r.timestamp).getTime() - start) / 3_600_000);
    if (idx < 0 || idx >= HOURS) continue;
    points[idx].events += 1;
    if (["Warning", "Error", "Critical"].includes(r.level ?? "")) points[idx].alerts += 1;
  }
  return points;
}

export default async function Dashboard() {
  const supabase = await createClient();
  const since = hoursAgo(HOURS);

  const kev = await getKevSnapshot(6);
  const showKev = !!kev && kev.entries.length > 0;

  const [totalIocs, highRiskIocs, activeCases, totalCases, feeds, recent, reputation, logs] = await Promise.all([
    supabase.from("ioc").select("*", { count: "exact", head: true }),
    supabase.from("ioc").select("*", { count: "exact", head: true }).gte("risk_score", 80),
    supabase.from("case").select("*", { count: "exact", head: true }).in("status", ["Open", "Investigating"]),
    supabase.from("case").select("*", { count: "exact", head: true }),
    supabase.from("feed").select("status, health"),
    supabase.from("case").select("id, title, severity, status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("ioc").select("reputation").limit(1000),
    supabase.from("endpoint_logs").select("timestamp, level").gte("timestamp", since).order("timestamp", { ascending: false }).limit(5000),
  ]);

  const feedRows = (feeds.data ?? []) as Array<{ status: string | null; health: string | null }>;
  const feedsOnline = feedRows.filter((f) => f.status === "Enabled" && f.health === "Healthy").length;
  const feedsDegraded = feedRows.some((f) => f.status === "Enabled" && f.health !== "Healthy");

  const counts = { malicious: 0, suspicious: 0, unknown: 0 };
  for (const r of (reputation.data ?? []) as Array<{ reputation: string | null }>) {
    const k = (r.reputation ?? "").toLowerCase();
    if (k === "malicious") counts.malicious++;
    else if (k === "suspicious") counts.suspicious++;
    else counts.unknown++;
  }
  const slices: ReputationSlice[] = [
    { key: "malicious", value: counts.malicious },
    { key: "suspicious", value: counts.suspicious },
    { key: "unknown", value: counts.unknown },
  ];

  const series = bucketLogs((logs.data ?? []) as Array<{ timestamp: string; level: string | null }>);
  const totalEvents = series.reduce((n, p) => n + p.events, 0);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Security overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Threat intelligence, incidents and telemetry at a glance.</p>
        </div>
        <Status status={feedsDegraded ? "degraded" : "online"} className="w-fit">
          <StatusIndicator />
          <StatusLabel>{feedsDegraded ? "A feed needs attention" : "All systems normal"}</StatusLabel>
        </Status>
      </div>

      <StatCards
        initialTotalIocs={totalIocs.count ?? 0}
        initialHighRiskIocs={highRiskIocs.count ?? 0}
        initialActiveCases={activeCases.count ?? 0}
        totalCases={totalCases.count ?? 0}
        feedsOnline={feedsOnline}
        feedsTotal={feedRows.length}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ThreatMap />
        </div>
        <div className="xl:col-span-2">
          <RecentCases cases={(recent.data ?? []) as CaseRow[]} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>SIEM events, last 24 hours</CardTitle>
            <CardDescription>{totalEvents.toLocaleString()} events ingested (hourly, UTC)</CardDescription>
          </CardHeader>
          <CardContent>
            <IngestionChart data={series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Indicator reputation</CardTitle>
            <CardDescription>Breakdown of tracked indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <ReputationDonut data={slices} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className={showKev ? "xl:col-span-3" : "xl:col-span-5"}>
          <TopologyCard demo={isDemoMode()} />
        </div>
        {showKev && (
          <div className="xl:col-span-2">
            <ExploitedVulns kev={kev} />
          </div>
        )}
      </div>
    </div>
  );
}
