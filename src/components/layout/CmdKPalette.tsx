"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { ShieldAlert, Target, Activity, FileText, Search, Database } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function CmdKPalette({ iamPolicy, isSvLord }: { iamPolicy?: any; isSvLord?: boolean }) {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [iocs, setIocs] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSearchData = async () => {
      const [casesRes, iocsRes] = await Promise.all([
        supabase.from("case").select("id, title, status").limit(5),
        supabase.from("ioc").select("id, value, type").limit(5)
      ]);
      if (casesRes.data) setCases(casesRes.data);
      if (iocsRes.data) setIocs(iocsRes.data);
    };
    fetchSearchData();
  }, [supabase]);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-cmdk", handleCustomOpen);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-cmdk", handleCustomOpen);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  const hasAccess = (path: string) => {
    if (!iamPolicy || iamPolicy.super_admin || isSvLord) return true;
    if (!Array.isArray(iamPolicy.allowed_pages)) return false;
    return iamPolicy.allowed_pages.some((page: string) => {
      if (page === "/dashboard") return path === "/dashboard";
      return path === page || path.startsWith(page + '/');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />

      <Command 
        className="relative z-10 w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        shouldFilter={false} // Since we want to let cmdk handle it locally for now
      >
        <div className="flex items-center px-4 border-b border-border bg-white/[0.02]">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Command.Input 
            autoFocus 
            placeholder="Search cases, indicators, or run a command..." 
            className="w-full bg-transparent border-none text-foreground px-4 py-4 focus:outline-none placeholder:text-muted-foreground text-sm"
          />
          <div className="text-[10px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded font-mono">ESC</div>
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>

          <Command.Group heading="Navigation" className="text-xs font-medium text-muted-foreground px-2 py-1.5 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-2">
            {hasAccess("/dashboard") && (
              <Command.Item 
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-indigo-500/20 hover:text-foreground cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-foreground"
              >
                <Activity className="w-4 h-4 text-indigo-400" />
                Executive Summary
              </Command.Item>
            )}
            {hasAccess("/dashboard/cases") && (
              <Command.Item 
                onSelect={() => runCommand(() => router.push("/dashboard/cases"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-foreground"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                Active Investigations
              </Command.Item>
            )}
            {hasAccess("/dashboard/iocs") && (
              <Command.Item 
                onSelect={() => runCommand(() => router.push("/dashboard/iocs"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-foreground"
              >
                <Target className="w-4 h-4 text-muted-foreground" />
                IOC Database
              </Command.Item>
            )}
          </Command.Group>

          <Command.Group heading="Tools" className="text-xs font-medium text-muted-foreground px-2 pt-2 pb-1.5 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-2">
            {hasAccess("/dashboard/osint") && (
              <Command.Item 
                onSelect={() => runCommand(() => router.push("/dashboard/osint"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-red-500/20 hover:text-red-100 cursor-pointer transition-colors aria-selected:bg-red-500/20 aria-selected:text-red-100"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" />
                ThreatLens OSINT Scanner
              </Command.Item>
            )}
            {hasAccess("/dashboard/feeds") && (
              <Command.Item 
                onSelect={() => runCommand(() => router.push("/dashboard/feeds"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-foreground"
              >
                <Database className="w-4 h-4 text-muted-foreground" />
                Threat Feeds Manager
              </Command.Item>
            )}
          </Command.Group>

          {cases.length > 0 && (
            <Command.Group heading="Recent Cases" className="text-xs font-medium text-muted-foreground px-2 pt-2 pb-1.5 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-2">
              {cases.map((c) => (
                <Command.Item 
                  key={c.id}
                  onSelect={() => runCommand(() => router.push(`/dashboard/cases/${c.id}`))}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-foreground"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{c.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">{c.status}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {iocs.length > 0 && (
            <Command.Group heading="Recent IOCs" className="text-xs font-medium text-muted-foreground px-2 pt-2 pb-1.5 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-2">
              {iocs.map((ioc) => (
                <Command.Item 
                  key={ioc.id}
                  onSelect={() => runCommand(() => router.push(`/dashboard/osint?indicator=${encodeURIComponent(ioc.value)}`))}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-foreground"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-foreground">{ioc.value}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">{ioc.type}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
