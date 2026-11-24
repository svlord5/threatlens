"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- provider payloads and GeoJSON are loosely typed */

import { useMemo } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import { HUB, severityColor, type Place } from "./geo";

export interface MapThreat {
  id: string;
  value: string;
  score: number;
  place: Place;
}

const W = 960;
const H = 480;

// Static geometry: computed once per page load.
const projection = geoNaturalEarth1().fitExtent(
  [
    [8, 8],
    [W - 8, H - 8],
  ],
  { type: "Sphere" }
);
const path = geoPath(projection);
const countries = feature(world as any, (world as any).objects.countries) as any;
const COUNTRY_PATHS: string[] = countries.features.map((f: any) => path(f) || "").filter(Boolean);
const GRATICULE = path(geoGraticule10()) || "";
const SPHERE = path({ type: "Sphere" } as any) || "";

/** A real world map (Natural Earth projection) with pulsing markers and animated arcs to the protected network. */
export function WorldMap({ threats }: { threats: MapThreat[] }) {
  const hub = projection([HUB.lng, HUB.lat]) as [number, number];

  const arcs = useMemo(
    () =>
      threats.map((t) => {
        const [x, y] = projection([t.place.lng, t.place.lat]) as [number, number];
        const dist = Math.hypot(hub[0] - x, hub[1] - y);
        const cx = (x + hub[0]) / 2;
        const cy = Math.min(y, hub[1]) - Math.max(24, dist * 0.28);
        return { ...t, x, y, d: `M${x.toFixed(1)},${y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${hub[0].toFixed(1)},${hub[1].toFixed(1)}` };
      }),
    [threats, hub]
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="World map of illustrative threat origins">
      <path d={SPHERE} className="fill-muted/30 stroke-border" strokeWidth={0.8} />
      <path d={GRATICULE} className="fill-none stroke-border/60" strokeWidth={0.4} />
      {COUNTRY_PATHS.map((d, i) => (
        <path key={i} d={d} className="fill-muted stroke-background" strokeWidth={0.4} />
      ))}

      {arcs.map((a) => (
        <path key={`arc-${a.id}`} d={a.d} fill="none" stroke={severityColor(a.score)} strokeWidth={1.2} strokeLinecap="round" className="tl-arc" opacity={0.75} />
      ))}

      {arcs.map((a) => (
        <g key={`pt-${a.id}`}>
          <circle cx={a.x} cy={a.y} r={3} fill={severityColor(a.score)} className="tl-ping" style={{ transformOrigin: `${a.x}px ${a.y}px` }} />
          <circle cx={a.x} cy={a.y} r={2.6} fill={severityColor(a.score)} stroke="hsl(var(--background, 0 0% 0%))" strokeWidth={0.6}>
            <title>{`${a.place.city}: ${a.value} (risk ${a.score})`}</title>
          </circle>
        </g>
      ))}

      <g>
        <circle cx={hub[0]} cy={hub[1]} r={9} className="fill-primary/20" />
        <circle cx={hub[0]} cy={hub[1]} r={4.5} className="fill-primary stroke-background" strokeWidth={1.2}>
          <title>{HUB.city}</title>
        </circle>
      </g>
    </svg>
  );
}
