import { createClient } from "@/utils/supabase/server";
import { Server, Activity, Plus, Power, PowerOff, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function SavedPlaybooksPage() {
  const supabase = await createClient();
  const { data: playbooks, error } = await supabase
    .from("soar_playbooks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch playbooks:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-indigo-500" />
            Saved Playbooks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your SOAR automation playbooks and execution logic.</p>
        </div>
        <Link 
          href="/dashboard/automation/playbooks" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Playbook
        </Link>
      </div>

      {!playbooks || playbooks.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 border border-indigo-500/20">
            <Activity className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Playbooks Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">You haven&apos;t saved any automation playbooks yet. Build one to start automating your SOC.</p>
          <Link 
            href="/dashboard/automation/playbooks" 
            className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Open Playbook Builder
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playbooks.map((pb) => (
            <div key={pb.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-indigo-500/30 transition-colors relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-md bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                {pb.is_active ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase">
                    <Power className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground font-bold bg-muted px-2.5 py-1 rounded-full border border-border uppercase">
                    <PowerOff className="w-3 h-3" /> Draft
                  </span>
                )}
              </div>
              
              <h3 className="text-base font-semibold text-foreground mb-1.5 line-clamp-1">{pb.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">{pb.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(pb.updated_at), { addSuffix: true })}
                </div>
                <Link href={`/dashboard/automation/playbooks?id=${pb.id}`} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Edit Playbook
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
