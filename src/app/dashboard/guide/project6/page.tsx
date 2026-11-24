import { BookOpen, ShieldAlert, ArrowLeft, Target, Globe, Activity, Terminal, Database, ChevronRight, ScanLine } from "lucide-react";
import Link from "next/link";
import React from "react";

export const dynamic = "force-static";

export default function Project6GuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Back Button */}
      <Link href="/dashboard/guide" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-fit px-3 py-1.5 rounded-full hover:bg-muted border border-transparent hover:border-border group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Internal Guide
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          Internal SOC Documentation
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          Project 6: Threat Intelligence Analysis
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          A comprehensive internal operational guide on leveraging the ThreatLens platform for Cyber Threat Intelligence (CTI) collection, enrichment, and proactive threat hunting.
        </p>
      </div>

      <hr className="border-border" />

      {/* Content */}
      <div className="space-y-12">
        
        {/* Phase 1: Collection */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 1: Intelligence Collection</h2>
              <p className="text-muted-foreground mt-1">Acquiring raw data from external sources.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Threat Intelligence relies heavily on ingesting actionable data from external sources. As an analyst, your first step is to establish reliable intelligence pipelines. Navigate to the <strong>Threat Feeds</strong> module (Cyber Connector Modules) to monitor incoming streams of known malicious IPs, domains, and file hashes.
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
                  <span>Navigate to <strong>Threat Feeds</strong> in the sidebar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Review the active feeds (e.g., AlienVault OTX, Abuse.ch).</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Identify a recent, high-severity Indicator of Compromise (IOC) from the feeds to serve as the subject of your analysis report.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 2: Enrichment */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 2: Indicator Enrichment & OSINT</h2>
              <p className="text-muted-foreground mt-1">Transforming raw data into actionable intelligence.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              An isolated IP address or hash is just raw data. When a suspicious indicator is identified, it must be enriched to understand the threat&apos;s origin, capabilities, and reputation. 
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted border border-border rounded-xl p-5">
                <ScanLine className="w-5 h-5 text-sky-400 mb-3" />
                <h4 className="text-foreground font-medium text-sm mb-2">OSINT Engine</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drop indicators here. It automatically queries VirusTotal, Shodan, and crt.sh to map out associated infrastructure and identify vulnerabilities.
                </p>
              </div>
              <div className="bg-muted border border-border rounded-xl p-5">
                <Database className="w-5 h-5 text-sky-400 mb-3" />
                <h4 className="text-foreground font-medium text-sm mb-2">IOC Database</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Once enriched, malicious indicators must be formally documented in the active IOC database to be utilized by the SIEM.
                </p>
              </div>
            </div>

            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden mt-4">
              <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Take the IOC you selected in Phase 1 and run it through the <strong>OSINT Engine</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Document the findings (open ports, associated domains, AV detections) for your report.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Navigate to the <strong>IOCs Database</strong> and click &quot;Add IOC&quot; to formally register this threat into your environment.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 3: Hunting */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 3: Operationalizing Intelligence (Hunting)</h2>
              <p className="text-muted-foreground mt-1">Searching the environment for historical compromise.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Intelligence is only valuable when operationalized. The <strong>Automated Hunting Engine</strong> allows analysts to perform Retrospective Threat Hunting by taking the active intelligence (from Phase 2) and correlating it against historical SIEM endpoint logs.
            </p>
            <p className="text-foreground leading-relaxed">
              If a newly discovered malicious IP was communicating with your network previously (before you knew it was malicious), this engine will identify that silent breach.
            </p>

            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Ensure your target IOC is saved in the IOC Database.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Navigate to <strong>Automated Hunting</strong> and trigger a correlation scan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Review the scan metrics. The engine will detail exactly how many logs were scanned against how many active threats. Document this process as evidence of proactive hunting.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 4: Escalation */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 4: Incident Response & Escalation</h2>
              <p className="text-muted-foreground mt-1">Documenting and containing identified threats.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              The final stage of Threat Intelligence Analysis is reporting and response. When the hunting engine finds a match, or when you finish analyzing an OSINT target, escalate those findings into an active <strong>Incident Case</strong>.
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
                  <span>If the Hunt Engine finds a match, use the <strong>&quot;Escalate to Case&quot;</strong> button directly from the results table.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>If no match is found, manually navigate to <strong>Active Cases</strong> and create a new case detailing your OSINT findings on the threat actor.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Use the Case interface to upload evidence (e.g., screenshots of your OSINT scan) and provide final remediation recommendations for your report.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
