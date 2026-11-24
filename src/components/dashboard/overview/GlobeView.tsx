"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- provider payloads and GeoJSON are loosely typed */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { HUB, severityColor } from "./geo";
import type { MapThreat } from "./WorldMap";

// WebGL: client only.
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">Loading globe…</div>,
});

/** Interactive 3D globe (drag to rotate, scroll to zoom). */
export function GlobeView({ threats }: { threats: MapThreat[] }) {
  const box = useRef<HTMLDivElement>(null);
  const globe = useRef<any>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const controls = globe.current?.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = true;
    }
    globe.current?.pointOfView?.({ lat: 25, lng: 20, altitude: 2.2 }, 0);
  }, [width]);

  const points = threats.map((t) => ({ lat: t.place.lat, lng: t.place.lng, color: severityColor(t.score), label: `${t.place.city}: ${t.value}` }));
  const arcs = threats.map((t) => ({
    startLat: t.place.lat,
    startLng: t.place.lng,
    endLat: HUB.lat,
    endLng: HUB.lng,
    color: [severityColor(t.score), "#6366f1"],
  }));

  return (
    <div ref={box} className="h-[420px] w-full overflow-hidden rounded-lg bg-black/40">
      {width > 0 && (
        <Globe
          ref={globe}
          width={width}
          height={420}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#6366f1"
          pointsData={points}
          pointColor="color"
          pointAltitude={0.02}
          pointRadius={0.5}
          pointLabel="label"
          arcsData={arcs}
          arcColor="color"
          arcStroke={0.4}
          arcDashLength={0.4}
          arcDashGap={0.8}
          arcDashAnimateTime={2600}
        />
      )}
    </div>
  );
}
