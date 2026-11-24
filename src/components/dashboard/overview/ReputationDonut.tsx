"use client";

import { Label, Pie, PieChart } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export interface ReputationSlice {
  key: "malicious" | "suspicious" | "unknown";
  value: number;
}

const config = {
  value: { label: "Indicators" },
  malicious: { label: "Malicious", color: "#ef4444" },
  suspicious: { label: "Suspicious", color: "#f59e0b" },
  unknown: { label: "Unknown", color: "#64748b" },
} satisfies ChartConfig;

export function ReputationDonut({ data }: { data: ReputationSlice[] }) {
  const total = data.reduce((n, d) => n + d.value, 0);
  const rows = data.map((d) => ({ ...d, fill: `var(--color-${d.key})` }));
  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[240px]">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="key" />} />
        <Pie data={rows} dataKey="value" nameKey="key" innerRadius={64} outerRadius={92} strokeWidth={3} paddingAngle={2}>
          <Label
            content={({ viewBox }) =>
              viewBox && "cx" in viewBox ? (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-semibold">
                    {total.toLocaleString()}
                  </tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 22} className="fill-muted-foreground text-xs">
                    indicators
                  </tspan>
                </text>
              ) : null
            }
          />
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} />
      </PieChart>
    </ChartContainer>
  );
}
