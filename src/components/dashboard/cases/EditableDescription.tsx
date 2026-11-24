"use client";

import { useState } from "react";
import { FileText, Check, X, Loader2, Edit2 } from "lucide-react";
import { updateCaseField } from "@/app/actions";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export function EditableDescription({ caseId, initialDescription }: { caseId: string, initialDescription: string | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(initialDescription || "");
  const [tempDescription, setTempDescription] = useState(description);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateCaseField(caseId, "description", tempDescription);
    if (res.success) {
      setDescription(tempDescription);
      setIsEditing(false);
    } else {
      alert("Failed to update description");
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setTempDescription(description);
    setIsEditing(false);
  };

  return (
    <div className="bg-card border border-border p-6 rounded-md space-y-4 group">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium flex items-center gap-2 text-foreground uppercase tracking-wider">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Description
        </h2>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-3 animate-in fade-in duration-200">
          <textarea
            autoFocus
            value={tempDescription}
            onChange={(e) => setTempDescription(e.target.value)}
            className="w-full bg-muted border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 min-h-[120px] transition-colors"
            placeholder="Enter case details and findings..."
          />
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-white text-black font-medium rounded hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="text-foreground text-sm leading-relaxed cursor-pointer hover:bg-white/[0.02] -mx-3 p-3 rounded transition-colors border border-transparent hover:border-white/5 min-h-[400px] prose prose-invert max-w-none prose-pre:bg-[#020202] prose-pre:border prose-pre:border-border prose-a:text-indigo-400"
        >
          {description ? (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(description) as string) }} />
          ) : (
            <span className="text-muted-foreground italic">No description provided. Click to add one.</span>
          )}
        </div>
      )}
    </div>
  );
}
