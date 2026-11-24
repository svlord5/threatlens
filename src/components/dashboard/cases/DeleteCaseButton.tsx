"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteCase } from "@/app/actions";
import { useRouter } from "next/navigation";

export function DeleteCaseButton({ caseId }: { caseId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await deleteCase(caseId);
    if (res.success) {
      router.push("/dashboard/cases");
    } else {
      alert("Failed to delete case.");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          setShowConfirm(true);
        }}
        disabled={isDeleting}
        className="h-8 w-8 flex items-center justify-center rounded hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400 border border-transparent hover:border-red-500/20"
        title="Delete Case"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-card border border-red-500/20 rounded-xl p-6 w-full max-w-md shadow-[0_0_40px_rgba(239,68,68,0.1)] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">Purge Case File</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  Are you absolutely sure you want to permanently delete this incident? This action cannot be undone and all associated telemetry will be wiped.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setShowConfirm(false);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider bg-red-500 hover:bg-red-600 text-foreground rounded shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? "Purging..." : "Confirm Purge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
