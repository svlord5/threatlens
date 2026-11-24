import { Waypoints, ShieldCheck } from "lucide-react";
import { PlaybookEditor } from "@/components/dashboard/automation/PlaybookEditor";
import { createClient } from "@/utils/supabase/server";

export default async function PlaybookBuilderPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const id = resolvedParams.id as string | undefined;
  
  let savedPlaybook = null;

  if (id) {
    const supabase = await createClient();
    const { data } = await supabase.from('soar_playbooks').select('*').eq('id', id).single();
    if (data) {
      savedPlaybook = data;
    }
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Waypoints className="w-6 h-6 text-indigo-500" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
              {savedPlaybook ? `Edit Playbook: ${savedPlaybook.name}` : "Playbook Builder"}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono tracking-wide">
            Design and orchestrate automated SOAR workflows.
          </p>
        </div>
        
        <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-md">
          <div className="text-xs font-mono text-indigo-400 mb-1">SOAR ENGINE</div>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Engine Online
          </div>
        </div>
      </div>

      <PlaybookEditor initialPlaybook={savedPlaybook} />

    </div>
  );
}
