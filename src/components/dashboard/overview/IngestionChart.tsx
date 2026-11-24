"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface IngestionPoint {
  label: string;
  events: number;
  alerts: number;
}

const config = {
  events: { label: "Events", color: "var(--chart-1)" },
  alerts: { label: "Warnings & errors", color: "var(--chart-5)" },
} satisfies ChartConfig;

/** Real SIEM volume (endpoint_logs), bucketed by hour. */
export function IngestionChart({ data }: { data: IngestionPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="fillEvents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-events)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-events)" stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id="fillAlerts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-alerts)" stopOpacity={0.55} />
            <stop offset="95%" stopColor="var(--color-alerts)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Area dataKey="events" type="monotone" fill="url(#fillEvents)" stroke="var(--color-events)" strokeWidth={2} />
        <Area dataKey="alerts" type="monotone" fill="url(#fillAlerts)" stroke="var(--color-alerts)" strokeWidth={2} />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
