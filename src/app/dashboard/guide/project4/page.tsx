import { BookOpen, ArrowLeft, Terminal, ChevronRight, Smartphone, FileSearch, History } from "lucide-react";
import Link from "next/link";
import React from "react";

export const dynamic = "force-static";

export default function Project4GuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Back Button */}
      <Link href="/dashboard/guide" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-fit px-3 py-1.5 rounded-full hover:bg-muted border border-transparent hover:border-border group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Internal Guide
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          Internal SOC Documentation
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
          Project 4: Android Mobile Forensics
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          An operational guide on conducting mobile forensics. Learn how to securely ingest Android backups, analyze SQLite databases, and reconstruct user activity timelines using the DFIR Case Manager.
        </p>
      </div>

      <hr className="border-border" />

      {/* Content */}
      <div className="space-y-12">
        
        {/* Phase 1: Ingestion */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 1: Evidence Custody & Ingestion</h2>
              <p className="text-muted-foreground mt-1">Establishing a secure chain of custody for the mobile backup.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Mobile forensics requires strict adherence to evidence handling procedures. When you receive the target Android backup (.ab, .tar, or raw partition dumps), it must be securely cataloged in the SOC Investigation Center before analysis begins.
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
                  <span>Navigate to <strong>Active Cases</strong> in the ThreatLens dashboard and create a new Digital Forensics (DFIR) Case.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Access the <strong>Evidence Vault</strong> within your newly created case.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Upload the primary Android backup files (or extracted SQLite databases like <code>mmssms.db</code> or <code>contacts2.db</code>). The system will automatically calculate and lock the SHA256 hashes to preserve forensic integrity.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 2: Extraction & Analysis */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <FileSearch className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 2: Artifact Extraction & Hex Analysis</h2>
              <p className="text-muted-foreground mt-1">Deep-diving into application databases and system logs.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Android heavily utilizes SQLite databases to store messaging logs, call history, and browser data. To extract value from the backup, analysts must parse these structured files and search for deleted or obfuscated records.
            </p>

            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden mt-4">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Open the uploaded databases from the Evidence Vault using the embedded <strong>Hex & Binary Analysis</strong> widgets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Extract the raw contents of messaging databases, call logs (e.g., <code>calllog.db</code>), and Chrome browser history.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Document specific artifacts, such as suspicious URLs visited or communication with unauthorized numbers.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 3: Timeline Reconstruction */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <History className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 3: Activity Pattern Reconstruction</h2>
              <p className="text-muted-foreground mt-1">Building a chronological map of the user&apos;s actions.</p>
            </div>
          </div>
          
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Raw data must be translated into a timeline to prove intent or trace the sequence of a compromise. In mobile forensics, correlating timestamps between an SMS message, a web search, and a subsequent application installation is critical.
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
                  <span>Use the <strong>Investigation Timeline</strong> tool located within your active case.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Log each critical timestamp discovered in Phase 2 (convert UNIX Epoch time to UTC if necessary).</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Organize the logs to reconstruct the chronological pattern of user activity, clearly mapping out the events that led to the incident.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
