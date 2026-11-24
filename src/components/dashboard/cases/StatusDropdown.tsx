"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { updateCaseField } from "@/app/actions";

const STATUSES = ["Open", "Investigating", "Mitigated", "Closed"];

export function StatusDropdown({ caseId, initialStatus }: { caseId: string, initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelect = async (newStatus: string) => {
    setIsOpen(false);
    if (newStatus === status) return;

    setIsUpdating(true);
    // Optimistic update
    const previousStatus = status;
    setStatus(newStatus);

    const res = await updateCaseField(caseId, "status", newStatus);
    if (!res.success) {
      alert("Failed to update status");
      setStatus(previousStatus); // Revert
    }
    setIsUpdating(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="whitespace-nowrap h-8 px-3 text-[10px] font-mono uppercase tracking-widest text-foreground bg-background/50 border border-border rounded hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all flex items-center gap-2 disabled:opacity-70 min-w-[130px] justify-between shadow-inner"
      >
        {isUpdating ? (
          <span className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...</span>
        ) : (
          <>
            <span>{status}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-40 bg-muted border border-border rounded-md shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  status === s 
                    ? "bg-white/10 text-foreground font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
