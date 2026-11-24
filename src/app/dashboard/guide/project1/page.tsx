import { BookOpen, ArrowLeft, Terminal, Database, ChevronRight, Activity, Zap } from "lucide-react";
import Link from "next/link";
import React from "react";

export const dynamic = "force-static";

export default function Project1GuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Back Button */}
      <Link href="/dashboard/guide" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-fit px-3 py-1.5 rounded-full hover:bg-muted border border-transparent hover:border-border group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Internal Guide
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          Internal SOC Documentation
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          Project 1: SIEM Setup and Log Ingestion
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          An operational guide on configuring ThreatLens as your primary Security Information and Event Management (SIEM) solution, ingesting endpoint telemetry, and writing automated detection rules.
        </p>
      </div>

      <hr className="border-border" />

      {/* Content */}
      <div className="space-y-12">
        
        {/* Phase 1: Setup */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Database className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 1: SIEM Configuration & Agent Setup</h2>
              <p className="text-muted-foreground mt-1">Configuring endpoints to forward telemetry to the platform.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              ThreatLens features a native telemetry ingestion API located at <code>/api/siem/ingest</code>. To configure your lab environment (Windows/Linux endpoints) to send logs, you must configure a forwarding agent (e.g., Winlogbeat, Fluentd, or a custom PowerShell script) to POST event data to this endpoint.
            </p>
            
            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Configure your endpoint script to send JSON payloads to <code>YOUR_APP_URL/api/siem/ingest</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Ensure your agent includes the authorization header: <code>Authorization: Bearer &lt;SIEM_AGENT_API_KEY&gt;</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Send a test event payload (e.g., Event ID 4625 for a failed login) to verify connectivity.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 2: Indexing */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 2: Log Parsing & Verification</h2>
              <p className="text-muted-foreground mt-1">Confirming data is successfully indexed and searchable.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Once the logs hit the API, the SIEM normalizes the schema, extracting key fields like <strong>MachineName</strong>, <strong>Event ID</strong>, and <strong>Message</strong>, before indexing them securely into the Supabase data warehouse.
            </p>

            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden mt-4">
              <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Navigate to <strong>Endpoint Logs</strong> (or the SIEM log viewer) in the ThreatLens dashboard.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Verify that your test logs appear in the live stream.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Click on a log entry to view the raw JSON parser output. Take a screenshot for your project report to prove successful indexing.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 3: Detection Rules */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 3: Crafting Detection Rules (SOAR)</h2>
              <p className="text-muted-foreground mt-1">Automating responses for suspicious activity.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              A SIEM isn&apos;t complete without alerts. ThreatLens evaluates incoming logs dynamically against active Detection Rules. If a log matches a pattern (like a brute force attack), it can trigger Security Orchestration, Automation, and Response (SOAR) playbooks.
            </p>

            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Navigate to <strong>Automation Rules</strong> in the ThreatLens dashboard.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Create a new rule named <strong>&quot;Failed Login Detection&quot;</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Set the match pattern to search the <code>message</code> field for the string &quot;Failed password&quot; or &quot;Event ID 4625&quot;.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Set the action to <strong>Create Case</strong>. The SIEM will now autonomously generate an Incident Case ticket every time a failed login is detected in your lab environment!</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
