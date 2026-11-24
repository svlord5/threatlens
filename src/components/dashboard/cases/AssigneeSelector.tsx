"use client";

import { useState } from "react";
import { User, Loader2 } from "lucide-react";
import { updateCaseField } from "@/app/actions";

export function AssigneeSelector({ caseId, initialAssignee }: { caseId: string, initialAssignee: string | null }) {
  const [assignee, setAssignee] = useState(initialAssignee);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAssignToMe = async () => {
    setIsUpdating(true);
    const newAssignee = "Analyst (Me)"; // Mocking a logged-in user's name
    const res = await updateCaseField(caseId, "analyst_id", newAssignee);
    if (res.success) {
      setAssignee(newAssignee);
    } else {
      alert("Failed to assign case");
    }
    setIsUpdating(false);
  };

  const handleUnassign = async () => {
    setIsUpdating(true);
    const res = await updateCaseField(caseId, "analyst_id", null);
    if (res.success) {
      setAssignee(null);
    } else {
      alert("Failed to unassign case");
    }
    setIsUpdating(false);
  };

  return (
    <div className="flex items-center justify-between group">
      <span className="text-muted-foreground text-sm">Assignee</span>
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          {assignee ? (assignee === "Analyst (Me)" || assignee.includes('-') ? "Analyst (Me)" : assignee) : "Unassigned"}
        </div>
        
        {/* Quick action buttons on hover */}
        {isUpdating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        ) : (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            {assignee ? (
              <button 
                onClick={handleUnassign}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Unassign
              </button>
            ) : (
              <button 
                onClick={handleAssignToMe}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Assign to me
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TopAssignButton({ caseId }: { caseId: string }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAssignToMe = async () => {
    setIsUpdating(true);
    const newAssignee = "Analyst (Me)"; 
    const res = await updateCaseField(caseId, "analyst_id", newAssignee);
    if (!res.success) {
      alert("Failed to assign case. Analyst_id might not exist or RLS blocked it.");
    }
    setIsUpdating(false);
  };

  return (
    <button 
      onClick={handleAssignToMe}
      disabled={isUpdating}
      className="whitespace-nowrap h-8 px-3 text-[10px] font-mono uppercase tracking-widest text-foreground border border-border rounded hover:bg-muted transition-colors flex items-center gap-2"
    >
      {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Assign to me"}
    </button>
  );
}
