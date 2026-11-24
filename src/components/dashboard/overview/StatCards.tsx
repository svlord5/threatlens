"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- provider payloads and GeoJSON are loosely typed */

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Radio, Target, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  initialTotalIocs: number;
  initialHighRiskIocs: number;
  initialActiveCases: number;
  totalCases: number;
  feedsOnline: number;
  feedsTotal: number;
}

interface StatProps {
  title: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone: "primary" | "danger" | "warning" | "success";
  live?: boolean;
  /** 0-100: draws a thin progress bar under the value */
  ratio?: number;
}

const TONES = {
  primary: "bg-primary/10 text-primary",
  danger: "bg-red-500/10 text-red-500",
  warning: "bg-amber-500/10 text-amber-500",
  success: "bg-emerald-500/10 text-emerald-500",
} as const;

function Stat({ title, value, caption, icon: Icon, tone, live, ratio }: StatProps) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {live && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" aria-hidden />}
            <span className="truncate">{caption}</span>
          </p>
        </div>
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", TONES[tone])}>
          <Icon className="size-5" />
        </div>
      </CardContent>
      {ratio !== undefined && (
        <Progress value={Math.min(100, Math.max(0, ratio))} className="block px-5 pb-4 [&_[data-slot=progress-track]]:h-1" />
      )}
    </Card>
  );
}

/** KPI cards. Counts update live through the same realtime channels the old grid used. */
export function StatCards({ initialTotalIocs, initialHighRiskIocs, initialActiveCases, totalCases, feedsOnline, feedsTotal }: StatCardsProps) {
  const [totalIocs, setTotalIocs] = useState(initialTotalIocs);
  const [highRisk, setHighRisk] = useState(initialHighRiskIocs);
  const [activeCases, setActiveCases] = useState(initialActiveCases);

  useEffect(() => {
    const supabase = createClient();
    const active = (s: string) => ["Open", "Investigating"].includes(s);

    const iocs = supabase
      .channel("overview-iocs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ioc" }, (p: any) => {
        setTotalIocs((n) => n + 1);
        if (p.new.risk_score >= 80) setHighRisk((n) => n + 1);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "ioc" }, (p: any) => {
        setTotalIocs((n) => Math.max(0, n - 1));
        if (p.old.risk_score >= 80) setHighRisk((n) => Math.max(0, n - 1));
      })
      .subscribe();

    const cases = supabase
      .channel("overview-cases")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case" }, (p: any) => {
        if (active(p.new.status)) setActiveCases((n) => n + 1);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "case" }, (p: any) => {
        const was = active(p.old.status);
        const is = active(p.new.status);
        if (!was && is) setActiveCases((n) => n + 1);
        if (was && !is) setActiveCases((n) => Math.max(0, n - 1));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "case" }, (p: any) => {
        if (active(p.old.status)) setActiveCases((n) => Math.max(0, n - 1));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(iocs);
      supabase.removeChannel(cases);
    };
  }, []);

  const riskRatio = totalIocs ? (highRisk / totalIocs) * 100 : 0;
  const feedsRatio = feedsTotal ? (feedsOnline / feedsTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat title="Indicators tracked" value={totalIocs.toLocaleString()} caption="Live count" icon={Target} tone="primary" live />
      <Stat
        title="High-risk indicators"
        value={highRisk.toLocaleString()}
        caption={`${riskRatio.toFixed(0)}% of all indicators`}
        icon={AlertTriangle}
        tone="danger"
        live
        ratio={riskRatio}
      />
      <Stat
        title="Active cases"
        value={activeCases.toLocaleString()}
        caption={`${totalCases.toLocaleString()} cases in total`}
        icon={Activity}
        tone="warning"
        live
      />
      <Stat
        title="Threat feeds online"
        value={`${feedsOnline}/${feedsTotal}`}
        caption={feedsTotal ? `${feedsRatio.toFixed(0)}% healthy` : "No feeds configured"}
        icon={Radio}
        tone="success"
        ratio={feedsRatio}
      />
    </div>
  );
}
