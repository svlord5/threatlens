"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- provider payloads and GeoJSON are loosely typed */

import { useEffect, useMemo, useState } from "react";
import { Globe2, Map as MapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { placeFor, severityColor } from "./geo";
import { WorldMap, type MapThreat } from "./WorldMap";
import { GlobeView } from "./GlobeView";

const MAX = 40;

function toThreat(row: any): MapThreat | null {
  const value = String(row?.value ?? "");
  if (!value) return null;
  return { id: String(row.id ?? value), value, score: Number(row.risk_score ?? 50), place: placeFor(value) };
}

export function ThreatMap() {
  const [mode, setMode] = useState<"map" | "globe">("map");
  const [threats, setThreats] = useState<MapThreat[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let alive = true;
    supabase
      .from("ioc")
      .select("id, value, risk_score")
      .order("risk_score", { ascending: false })
      .limit(MAX)
      .then(({ data }: any) => {
        if (!alive) return;
        setThreats((data ?? []).map(toThreat).filter(Boolean) as MapThreat[]);
        setLoaded(true);
      });
    const channel = supabase
      .channel("overview-map")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ioc" }, (p: any) => {
        const t = toThreat(p.new);
        if (t) setThreats((prev) => [t, ...prev].slice(0, MAX));
      })
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const top = useMemo(() => {
    const by = new Map<string, { city: string; n: number; max: number }>();
    for (const t of threats) {
      const cur = by.get(t.place.city) ?? { city: t.place.city, n: 0, max: 0 };
      cur.n += 1;
      cur.max = Math.max(cur.max, t.score);
      by.set(t.place.city, cur);
    }
    return [...by.values()].sort((a, b) => b.n - a.n).slice(0, 5);
  }, [threats]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Global threat map
          <Badge variant="outline" className="font-normal text-muted-foreground" title="Indicators are placed on cities deterministically; no GeoIP lookup is performed.">
            Illustrative placement
          </Badge>
        </CardTitle>
        <CardDescription>Highest-risk indicators converging on the protected network</CardDescription>
        <CardAction className="flex gap-1">
          <Button size="sm" variant={mode === "map" ? "secondary" : "ghost"} onClick={() => setMode("map")}>
            <MapIcon className="size-3.5" /> Map
          </Button>
          <Button size="sm" variant={mode === "globe" ? "secondary" : "ghost"} onClick={() => setMode("globe")}>
            <Globe2 className="size-3.5" /> Globe
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loaded ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">Loading indicators…</div>
        ) : mode === "map" ? (
          <WorldMap threats={threats} />
        ) : (
          <GlobeView threats={threats} />
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: severityColor(90) }} />High risk</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: severityColor(60) }} />Medium</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: severityColor(10) }} />Low</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Protected network</span>
          <span className="ml-auto tabular-nums">{threats.length} indicators plotted</span>
        </div>

        {top.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {top.map((p) => (
              <div key={p.city} className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="truncate text-xs text-muted-foreground">{p.city}</p>
                <p className="text-lg font-semibold tabular-nums">{p.n}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
