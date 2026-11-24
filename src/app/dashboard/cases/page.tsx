import { Filter } from "lucide-react";
import { NewCaseButton } from "@/components/dashboard/NewCaseButton";
import { ExportCasesButton } from "@/components/dashboard/cases/ExportCasesButton";
import { createClient } from "@/utils/supabase/server";
import { RealtimeCasesList } from "@/components/dashboard/cases/RealtimeCasesList";

export default async function CasesPage() {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("case")
    .select("*")
    .order("created_at", { ascending: false });

  const casesList = cases || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Cyber Incident Matrix</h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono tracking-wide">Manage security incidents and coordinate rapid response efforts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-indigo-400 border border-indigo-500/30 rounded-md hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)_inset]">
            <Filter className="w-3.5 h-3.5" />
            FILTER MATRIX
          </button>
          <ExportCasesButton cases={casesList} />
          <NewCaseButton />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-2xl relative group">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20"></div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-muted/40 backdrop-blur-md text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] relative z-10">
          <div className="col-span-6 md:col-span-5 flex items-center gap-2">
            Incident Telemetry
          </div>
          <div className="col-span-3 hidden md:flex items-center">Current Status</div>
          <div className="col-span-2 hidden md:flex items-center justify-end">Assigned Operative</div>
          <div className="col-span-6 md:col-span-2 flex items-center justify-end">T-Minus Age</div>
        </div>

        {/* List Body */}
        <div className="divide-y divide-border relative z-10">
          <RealtimeCasesList initialCases={casesList} />
        </div>
      </div>
    </div>
  );
}
