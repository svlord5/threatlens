import { BookOpen, ArrowLeft, Target, Terminal, Database, ChevronRight, Search, FileWarning } from "lucide-react";
import Link from "next/link";
import React from "react";

export const dynamic = "force-static";

export default function Project10GuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Back Button */}
      <Link href="/dashboard/guide" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-fit px-3 py-1.5 rounded-full hover:bg-muted border border-transparent hover:border-border group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Internal Guide
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          Internal SOC Documentation
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          Project 10: IOC Hunting in Logs
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          An operational guide on executing Retrospective Threat Hunts. Learn how to ingest a list of IOCs, scan historical SIEM telemetry, identify impacted hosts, and document your findings.
        </p>
      </div>

      <hr className="border-border" />

      {/* Content */}
      <div className="space-y-12">
        
        {/* Phase 1: Ingestion */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Database className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 1: IOC Ingestion</h2>
              <p className="text-muted-foreground mt-1">Populating the active database with your target indicators.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Before you can hunt, the correlation engine needs to know what it is looking for. Given a list of Indicators of Compromise (hashes, IPs, domains), your first task is to ensure they are formally tracked in the SIEM&apos;s active IOC database.
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
                  <span>Navigate to <strong>Active IOCs</strong> under the Threat Intelligence menu.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Click <strong>Add IOC</strong> and input the indicators provided in your assignment. Ensure you accurately categorize them by Type (IPv4, Hash, Domain) and assign a Severity.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 2: Execution */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 2: Retrospective Hunt Execution</h2>
              <p className="text-muted-foreground mt-1">Cross-referencing IOCs against historical telemetry.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Cyberattacks often happen silently. Once new IOCs are published by security researchers, SOC analysts must scan historical endpoint logs (from Windows Event Logs, Sysmon, network appliances) to check if the network was breached <em>before</em> the indicator was known.
            </p>

            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden mt-4">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Navigate to the <strong>Automated Hunting</strong> module.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Click <strong>Start Automated Hunt</strong>. The engine will retrieve all active IOCs and cross-reference them against up to 5,000 recent endpoint event logs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Wait for the Correlation Engine to finish processing the telemetry stream.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 3: Analysis */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Search className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 3: Host Identification & Analysis</h2>
              <p className="text-muted-foreground mt-1">Reviewing correlated output for impact assessment.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              If the engine detects an overlap between your active IOCs and the log data, it will immediately flag the impacted hosts. Your job is to analyze these hits to determine the scope of the compromise.
            </p>

            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Review the <strong>Correlated Impacted Hosts</strong> matrix that appears after the scan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Take note of the exact <strong>Machine Name</strong> (Impacted Host) and the specific <strong>IOC Matched</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Examine the <strong>Log Snippet</strong> to understand what the host was doing (e.g., executing a malicious binary or making an outbound network connection to the bad IP). Document this finding.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 4: Escalation */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <FileWarning className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 4: Documentation & Escalation</h2>
              <p className="text-muted-foreground mt-1">Formalizing findings for incident response.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Once an impacted host is confirmed, the SOC must initiate Incident Response protocols. The finding must be escalated into an official case ticket so that the remediation team can contain the threat (e.g., isolate the host from the network).
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
                  <span>Click the <strong>&quot;Escalate to Case&quot;</strong> button directly from the hunting results table for each impacted host.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Navigate to <strong>Active Cases</strong> (SOC Investigation Center).</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Open the newly generated case. You will see that the automated engine has already documented the target machine, IOC, timestamp, and raw log snippet. Use this structured data to write out your final Project 10 report.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
