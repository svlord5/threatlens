"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, AlertCircle, Clock, CheckCircle2, LayoutList, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { KanbanBoard } from "@/components/dashboard/cases/KanbanBoard";
import { DeleteCaseButton } from "@/components/dashboard/cases/DeleteCaseButton";

export function RealtimeCasesList({ initialCases }: { initialCases: any[] }) {
  const [cases, setCases] = useState(initialCases);
  const [view, setView] = useState<"list" | "board">("list");
  const supabase = createClient();

  // Take the server's list again whenever it changes (guarded state adjustment during render).
  const [prevInitial, setPrevInitial] = useState(initialCases);
  if (prevInitial !== initialCases) {
    setPrevInitial(initialCases);
    setCases(initialCases);
  }

  useEffect(() => {
    const channel = supabase
      .channel('realtime_cases')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'case' },
        (payload) => {
          setCases((current) => [payload.new, ...current]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'case' },
        (payload) => {
          setCases((current) => current.map((c) => c.id === payload.new.id ? payload.new : c));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'case' },
        (payload) => {
          setCases((current) => current.filter((c) => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const getSeverityDot = (sev: string) => {
    switch (sev) {
      case "Critical": return "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]";
      case "High": return "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]";
      case "Medium": return "bg-yellow-500";
      default: return "bg-zinc-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open": return <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />;
      case "Investigating": return <Clock className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />;
      case "Contained": return <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />;
      case "Closed": return <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />;
      default: return null;
    }
  };

  if (cases.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-muted-foreground text-sm">
        No cases found. Create a new investigation to get started.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end px-6 py-3 bg-muted/20 border-b border-border">
        <div className="flex bg-card border border-border rounded-md p-1">
          <button 
            onClick={() => setView("list")}
            className={`p-1.5 rounded text-muted-foreground transition-colors ${view === "list" ? "bg-white/10 text-foreground" : "hover:text-foreground"}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setView("board")}
            className={`p-1.5 rounded text-muted-foreground transition-colors ${view === "board" ? "bg-white/10 text-foreground" : "hover:text-foreground"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="divide-y divide-white/[0.02]">
          {cases.map((c) => (
        <Link href={`/dashboard/cases/${c.id}`} key={c.id}>
          <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-background/40 hover:bg-indigo-500/10 transition-all group cursor-pointer border-l-2 border-transparent hover:border-indigo-500">
            
            {/* Main details */}
            <div className="col-span-11 md:col-span-5 flex items-start space-x-4">
              <div className="relative mt-1 flex shrink-0 items-center justify-center">
                <div className={`absolute w-4 h-4 rounded-full opacity-20 animate-ping ${getSeverityDot(c.severity)}`}></div>
                <div className={`w-2 h-2 rounded-full relative ${getSeverityDot(c.severity)}`}></div>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide text-foreground group-hover:text-indigo-300 transition-colors">{c.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider">ID:{c.id.slice(0, 8)}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    c.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    c.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>SEV-{c.severity}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="col-span-3 hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider uppercase">
              {getStatusIcon(c.status)}
              <span className={c.status === "Closed" ? "text-muted-foreground" : c.status === "Investigating" ? "text-indigo-400" : "text-amber-400"}>{c.status}</span>
            </div>

            {/* Assignee */}
            <div className="col-span-2 hidden md:flex justify-end">
              {c.analyst_id ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground tracking-widest hidden lg:inline-block">OP-ASSIGNED</span>
                  <div className="w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xs text-indigo-400 font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)_inset]">
                    OP
                  </div>
                </div>
              ) : (
                <span className="text-[10px] font-mono text-muted-foreground border border-white/5 bg-white/[0.02] px-2 py-1 rounded">UNASSIGNED</span>
              )}
            </div>

            {/* Age */}
            <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-4 text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
              <span className="hidden md:inline-block group-hover:text-foreground transition-colors">
                T{formatDistanceToNow(new Date(c.created_at), { addSuffix: true }).replace('about ', '')}
              </span>
              <div onClick={(e) => e.preventDefault()} className="z-20">
                <DeleteCaseButton caseId={c.id} />
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-500/50 group-hover:text-indigo-400 transition-colors shrink-0 group-hover:translate-x-1 duration-300" />
            </div>

            </div>
          </Link>
        ))}
      </div>
      ) : (
        <div className="p-6">
          <KanbanBoard cases={cases} />
        </div>
      )}
    </div>
  );
}
