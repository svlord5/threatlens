import { ArrowLeft, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { StatusDropdown } from "@/components/dashboard/cases/StatusDropdown";
import { TopAssignButton } from "@/components/dashboard/cases/AssigneeSelector";
import { DeleteCaseButton } from "@/components/dashboard/cases/DeleteCaseButton";
import { MockDataButton } from "@/components/dashboard/cases/MockDataButton";
import { DfirTabs } from "@/components/dashboard/cases/dfir/DfirTabs";
import { IsolateHostButton } from "@/components/dashboard/cases/IsolateHostButton";
import { RunForensicsButton } from "@/components/dashboard/cases/RunForensicsButton";

export default async function CaseDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dbCase, error } = await supabase
    .from("case")
    .select(`
      *,
      case_ioc (
        ioc (*)
      )
    `)
    .eq("id", id)
    .single();

  if (!dbCase || error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl text-foreground mb-2">Case Not Found</h2>
        <p className="text-muted-foreground mb-6">This case might have been deleted or doesn&apos;t exist.</p>
        <Link href="/dashboard/cases" className="text-indigo-400 hover:text-indigo-300">Return to Cases</Link>
      </div>
    );
  }

  let notes = [];
  try {
    const { data: notesData } = await supabase.from("case_note").select("*").eq("case_id", id).order("created_at", { ascending: false });
    if (notesData) notes = notesData;
  } catch (e) {}

  let rawTelemetryData = null;
  try {
    if (dbCase.title.includes("[Wazuh]")) {
      const caseTime = new Date(dbCase.created_at).getTime();
      const tenSecBefore = new Date(caseTime - 10000).toISOString();
      const tenSecAfter = new Date(caseTime + 10000).toISOString();
      
      const { data: endpointLog } = await supabase
        .from("endpoint_logs")
        .select("raw_data")
        .eq("provider", "Wazuh")
        .gte("created_at", tenSecBefore)
        .lte("created_at", tenSecAfter)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
        
      if (endpointLog && endpointLog.raw_data) {
        rawTelemetryData = endpointLog.raw_data;
      }
    }
  } catch (e) {}

  let initialPcap: any[] = [];
  let initialHex: any[] = [];
  let initialMitre: any[] = [];
  let initialInvestigations: any[] = [];
  let initialEvidence: any[] = [];
  try {
    const [{ data: pcap }, { data: hex }, { data: mitre }, { data: inv }, { data: ev }] = await Promise.all([
      supabase.from("case_pcap").select("*").eq("case_id", id).order("created_at", { ascending: false }),
      supabase.from("case_hex").select("*").eq("case_id", id).order("created_at", { ascending: true }),
      supabase.from("case_mitre").select("*").eq("case_id", id).order("created_at", { ascending: true }),
      supabase.from("investigations").select("*, analyst:auth.users(id, raw_user_meta_data)").eq("case_id", id).order("event_time", { ascending: false }),
      supabase.from("evidence").select("*, uploaded_by:auth.users(id, raw_user_meta_data)").eq("case_id", id).order("created_at", { ascending: false })
    ]);
    if (pcap) initialPcap = pcap;
    if (hex) initialHex = hex;
    if (mitre) initialMitre = mitre;
    if (inv) initialInvestigations = inv;
    if (ev) initialEvidence = ev;
  } catch (e) {}

  const linkedIocs = dbCase.case_ioc ? dbCase.case_ioc.map((rel: any) => rel.ioc).filter(Boolean) : [];
  const machineName = dbCase.metadata?.machine_name || "Unknown Host";

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case "Critical": return "text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
      case "High": return "text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]";
      case "Medium": return "text-yellow-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Nav & Breadcrumbs */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/cases" className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-white/5 bg-background/50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center space-x-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          <Link href="/dashboard/cases" className="hover:text-indigo-400 transition-colors">Tactical Grid</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">INCIDENT-{dbCase.id.substring(0, 8)}</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-card border border-border rounded-xl p-6 relative group shadow-2xl">
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`w-3 h-3 rounded-full animate-pulse bg-current ${getSeverityColor(dbCase.severity)}`}></span>
              <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">{dbCase.title}</h1>
            </div>
            <div className="flex items-center space-x-4 mt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center space-x-2 border border-border bg-background/50 px-2 py-1 rounded text-foreground">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>STATE: {dbCase.status}</span>
              </div>
              <span>•</span>
              <span>INITIATED: {formatDistanceToNow(new Date(dbCase.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 bg-muted/20 p-2 rounded-lg border border-border backdrop-blur">
            <RunForensicsButton machineName={machineName} caseId={dbCase.id} />
            <IsolateHostButton machineName={machineName} />
            <div className="h-4 w-px bg-border mx-1"></div>
            
            {!dbCase.analyst_id && (
              <TopAssignButton caseId={dbCase.id} />
            )}
            <StatusDropdown caseId={dbCase.id} initialStatus={dbCase.status} />
            <div className="h-4 w-px bg-border mx-1"></div>
            <MockDataButton caseId={dbCase.id} />
            <DeleteCaseButton caseId={dbCase.id} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        <DfirTabs 
          caseId={dbCase.id} 
          initialPcap={initialPcap} 
          initialHex={initialHex} 
          initialMitre={initialMitre} 
          initialInvestigations={initialInvestigations}
          initialEvidence={initialEvidence}
          initialRawData={rawTelemetryData}
          initialDescription={dbCase.description}
          initialNotes={notes}
          linkedIocs={linkedIocs}
          caseCreatedAt={dbCase.created_at} 
        />
      </div>
    </div>
  );
}
