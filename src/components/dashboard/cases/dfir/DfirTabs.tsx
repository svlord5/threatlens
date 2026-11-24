"use client";

import { useState } from "react";
import { Network, Terminal, Crosshair, Activity, FileText } from "lucide-react";
import { PcapAnalyzerWidget } from "./PcapAnalyzerWidget";
import { HexViewerWidget } from "./HexViewerWidget";
import { MitreAttackWidget } from "./MitreAttackWidget";
import { InvestigationsWidget } from "./InvestigationsWidget";
import { EvidenceWidget } from "./EvidenceWidget";
import { RawTelemetryWidget } from "./RawTelemetryWidget";
import { Code2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { EditableDescription } from "@/components/dashboard/cases/EditableDescription";
import { CaseDocs } from "@/components/dashboard/cases/CaseDocs";
import { AddIocModal } from "@/components/dashboard/cases/AddIocModal";

interface DfirTabsProps {
  caseId: string;
  initialPcap: any[];
  initialHex: any[];
  initialMitre: any[];
  initialInvestigations: any[];
  initialEvidence: any[];
  initialRawData?: any;
  initialDescription: string;
  initialNotes: any[];
  linkedIocs: any[];
  caseCreatedAt: string;
}

export function DfirTabs({ caseId, initialPcap, initialHex, initialMitre, initialInvestigations, initialEvidence, initialRawData, initialDescription, initialNotes, linkedIocs, caseCreatedAt }: DfirTabsProps) {
  const [activeTab, setActiveTab] = useState<"briefing" | "telemetry" | "pcap" | "memory" | "mitre" | "trace" | "documents" | "evidence" | "raw">("briefing");

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("briefing")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === "briefing" 
              ? "bg-blue-500/10 text-blue-400 border-b-2 border-blue-500" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Briefing
        </button>

        <button
          onClick={() => setActiveTab("telemetry")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === "telemetry" 
              ? "bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          IOCs
        </button>
        
        <button
          onClick={() => setActiveTab("pcap")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === "pcap" 
              ? "bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Network Analysis
        </button>
        
        <button
          onClick={() => setActiveTab("memory")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === "memory" 
              ? "bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Memory Forensics
        </button>
        
        <button
          onClick={() => setActiveTab("mitre")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === "mitre" 
              ? "bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          Threat Mapping
        </button>
        
        <button
          onClick={() => setActiveTab("trace")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === "trace" 
              ? "bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Timeline
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === "documents" 
              ? "bg-purple-500/10 text-purple-400 border-b-2 border-purple-500" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Documents
        </button>
        
        <button
          onClick={() => setActiveTab("evidence")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === "evidence" 
              ? "bg-amber-500/10 text-amber-400 border-b-2 border-amber-500" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Evidence Vault
        </button>
        
        <button
          onClick={() => setActiveTab("raw")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap ${
            activeTab === "raw" 
              ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Raw Telemetry
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[600px]">
        {activeTab === "briefing" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <EditableDescription caseId={caseId} initialDescription={initialDescription} />
          </div>
        )}

        {activeTab === "telemetry" && (
          <div className="bg-[#020202] border border-border p-5 rounded-lg space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xs font-mono font-bold flex items-center gap-2 text-foreground uppercase tracking-widest">
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                Extracted Telemetry
              </h2>
              <AddIocModal caseId={caseId} />
            </div>
            
            <div className="border border-white/5 rounded-md overflow-hidden bg-background/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead className="bg-muted text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    <tr>
                      <th className="px-3 py-2 font-normal">Indicator</th>
                      <th className="px-3 py-2 font-normal">Type</th>
                      <th className="px-3 py-2 font-normal">Threat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                  {linkedIocs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">No telemetry active.</td>
                    </tr>
                  )}
                  {linkedIocs.map((ioc: any) => (
                    <tr key={ioc.id} className="hover:bg-indigo-950/20 transition-colors">
                      <td className="px-3 py-2 text-foreground break-all border-l-2 border-transparent hover:border-indigo-500">
                        <Link href={`/dashboard/osint?indicator=${encodeURIComponent(ioc.value)}`} className="hover:text-indigo-400 transition-colors">
                          {ioc.value}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{ioc.type}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded border ${
                          ioc.risk_score >= 80 ? 'border-red-500/20 text-red-400 bg-red-500/10' : 
                          ioc.risk_score >= 50 ? 'border-orange-500/20 text-orange-400 bg-orange-500/10' :
                          'border-yellow-500/20 text-yellow-400 bg-yellow-500/10'
                        }`}>
                          {ioc.risk_score}
                        </span>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pcap" && (
          <PcapAnalyzerWidget caseId={caseId} initialPackets={initialPcap} />
        )}
        
        {activeTab === "memory" && (
          <HexViewerWidget caseId={caseId} initialHexData={initialHex} />
        )}
        
        {activeTab === "mitre" && (
          <MitreAttackWidget caseId={caseId} initialMitreData={initialMitre} />
        )}
        
        {activeTab === "trace" && (
          <InvestigationsWidget caseId={caseId} initialInvestigations={initialInvestigations} caseCreatedAt={caseCreatedAt} />
        )}
        
        {activeTab === "documents" && (
          <div className="max-w-4xl mx-auto">
            <CaseDocs caseId={caseId} initialNotes={initialNotes} />
          </div>
        )}
        
        {activeTab === "evidence" && (
          <EvidenceWidget caseId={caseId} initialEvidence={initialEvidence} />
        )}
        
        {activeTab === "raw" && (
          <RawTelemetryWidget rawData={initialRawData} />
        )}
      </div>
    </div>
  );
}
