"use server";

import { createClient } from "@/utils/supabase/server";
import { gatherDnsIntelligence } from "./dns";
import { gatherHttpIntelligence } from "./http";
import { analyzeSecurityPosture } from "./scoring";
import { generateAIReports } from "./ai";
import { gatherWaybackArchives } from "./osint";
import { guardAction } from "@/lib/action-guard";

export async function runFullDomainScan(domain: string) {
  if (typeof domain !== "string" || domain.length === 0 || domain.length > 253) {
    throw new Error("Invalid domain.");
  }
  const denied = await guardAction(["shodan", "virustotal", "gemini"]);
  if (denied) throw new Error(denied);
  const supabase = await createClient();

  // 1. Get or Create Domain entry
  const domainLookup = await supabase
    .from('threatlens_domains')
    .select('id')
    .eq('domain', domain)
    .single();
  let domainRec = domainLookup.data;
  const domainErr = domainLookup.error;

  if (!domainRec) {
    // We need user ID to attach the domain
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: newDomain, error: insertErr } = await supabase
      .from('threatlens_domains')
      .insert({ domain, user_id: user.id })
      .select('id')
      .single();
    
    if (insertErr || !newDomain) {
      console.error("Supabase Insert Error (Domain):", insertErr);
      throw new Error(`Failed to register domain: ${insertErr?.message || "Unknown error"}`);
    }
    domainRec = newDomain;
  }

  // 2. Create Initial Scan Entry
  const { data: scanRec, error: scanErr } = await supabase
    .from('threatlens_scans')
    .insert({
      domain_id: domainRec.id,
      status: 'Processing',
    })
    .select('id')
    .single();

  if (scanErr || !scanRec) {
    console.error("Supabase Insert Error (Scan):", scanErr);
    throw new Error(`Failed to initiate scan: ${scanErr?.message || "Unknown error"}`);
  }

  // 3. Run Async Scanners
  const [dnsData, httpData, waybackArchives] = await Promise.all([
    gatherDnsIntelligence(domain),
    gatherHttpIntelligence(domain),
    gatherWaybackArchives(domain)
  ]);

  // Inject OSINT data into existing JSONB columns to avoid schema migrations
  (dnsData as any).wayback_archives = waybackArchives;

  // 4. Calculate Risk & Findings
  const { findings, score } = analyzeSecurityPosture(dnsData, httpData);

  // 5. Generate AI Report (with graceful fallback for API limits/outages)
  let aiReport = { executiveSummary: "", technicalSummary: "" };
  try {
    aiReport = await generateAIReports(domain, { dns: dnsData, http: httpData }, findings);
  } catch (aiErr: any) {
    console.error("AI Generation failed but continuing scan:", aiErr.message || aiErr);
    // Graceful fallback to indicate to the user the AI service is unavailable
    aiReport = { 
      executiveSummary: "AI generation failed due to high demand or API outages. Please try running the scan again later.",
      technicalSummary: "AI technical analysis was aborted due to upstream API limits." 
    };
  }

  // 6. Save Findings
  if (findings.length > 0) {
    const findingsInserts = findings.map(f => ({
      ...f,
      scan_id: scanRec.id
    }));
    await supabase.from('threatlens_findings').insert(findingsInserts);
  }

  // 7. Finalize Scan Entry
  const { error: updateErr } = await supabase
    .from('threatlens_scans')
    .update({
      status: 'Completed',
      risk_score: score,
      dns_data: dnsData,
      ssl_data: httpData,
      headers_data: httpData.headers,
      tech_data: httpData.technologies,
      ai_executive_summary: aiReport.executiveSummary,
      ai_technical_summary: aiReport.technicalSummary
    })
    .eq('id', scanRec.id);

  if (updateErr) {
    console.error("Supabase Update Error (Finalizing Scan):", updateErr);
    throw new Error(`Failed to save scan results: ${updateErr.message}`);
  }

  // 8. Update Domain last_scanned
  await supabase
    .from('threatlens_domains')
    .update({ last_scanned: new Date().toISOString() })
    .eq('id', domainRec.id);

  return scanRec.id;
}
