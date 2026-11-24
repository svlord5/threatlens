import { createClient } from "@/utils/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import type { Metadata } from "next";
import PrintButton from "./PrintButton";
import ReportTabs from "./ReportTabs";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient();
  const { data: scan, error } = await supabase
    .from('threatlens_scans')
    .select('threatlens_domains (domain), risk_score')
    .eq('id', params.id)
    .single();

  if (error) {
    console.error("Supabase Metadata Error:", error);
  }

  if (!scan) {
    return { title: "Report Not Found - ThreatLens" };
  }

  const domainName = Array.isArray(scan.threatlens_domains) 
    ? (scan.threatlens_domains[0] as any)?.domain 
    : (scan.threatlens_domains as any)?.domain || "Unknown Domain";

  return {
    title: `Scan Report: ${domainName} - ThreatLens`,
    description: `Security posture assessment for ${domainName}. Risk Score: ${scan.risk_score}/100.`,
  };
}

export default async function ThreatLensReportPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  const { data: scan, error } = await supabase
    .from('threatlens_scans')
    .select(`
      *,
      threatlens_domains (domain),
      threatlens_findings (*)
    `)
    .eq('id', params.id)
    .single();

  if (error) {
    console.error("Supabase Report Error:", error);
    throw new Error(`Failed to load report: ${error.message}`);
  }

  if (!scan) {
    return notFound();
  }

  const domainName = Array.isArray(scan.threatlens_domains) 
    ? (scan.threatlens_domains[0] as any)?.domain 
    : (scan.threatlens_domains as any)?.domain || "Unknown Domain";

  const riskColor = scan.risk_score >= 80 ? 'text-green-400' : scan.risk_score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const riskBg = scan.risk_score >= 80 ? 'bg-green-500/10 border-green-500/20' : scan.risk_score >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';
  const riskLabel = scan.risk_score >= 80 ? 'Low Risk' : scan.risk_score >= 50 ? 'Medium Risk' : 'Critical Risk';

  return (
    <div id="threatlens-report" className="space-y-6 pb-12 bg-background min-h-screen">
      {/* Back Link above the banner */}
      <Link href="/dashboard/threatlens" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mb-4 w-fit">
        <ArrowLeft className="w-4 h-4" />
        Back to Overview
      </Link>

      {/* Hero Banner with Screenshot */}
      <div className="relative w-full h-[280px] rounded-2xl overflow-hidden border border-border group shadow-2xl shadow-indigo-500/5 mb-8">
        <div className="absolute inset-0 bg-[#020202]">
          {/* Live Website Screenshot via thum.io */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={`https://image.thum.io/get/width/1200/crop/800/https://${domainName}`}
            alt={`Live screenshot of ${domainName}`}
            className="w-full h-full object-cover opacity-40 group-hover:opacity-70 transition-all duration-700 blur-[2px] group-hover:blur-0 scale-105 group-hover:scale-100"
          />
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-[#000000]/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#000000] via-[#000000]/80 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground drop-shadow-md">
                {domainName}
              </h1>
              <span className={`text-xs px-2.5 py-1 rounded-md border backdrop-blur-md ${riskBg} ${riskColor}`}>
                {riskLabel}
              </span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Scan completed on {format(new Date(scan.created_at), "PPP 'at' p")}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Risk Score</div>
              <div className={`text-4xl font-mono font-bold drop-shadow-lg ${riskColor}`}>
                {scan.risk_score}<span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="pl-6 border-l border-border">
              <PrintButton scan={scan} domainName={domainName} />
            </div>
          </div>
        </div>

        {/* Overlay Badges */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 border border-border backdrop-blur-md text-[10px] text-foreground font-medium uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Live Preview
          </div>
        </div>
      </div>

      <ReportTabs scan={scan} />
    </div>
  );
}
