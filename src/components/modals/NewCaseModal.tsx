"use client";

import { useActionState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createCase, ActionState } from "@/app/actions";

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialState: ActionState = {
  success: false,
};

export function NewCaseModal({ isOpen, onClose }: NewCaseModalProps) {
  const [state, formAction, isPending] = useActionState(createCase, initialState);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
        onClick={!isPending ? onClose : undefined}
      ></div>
      
      {/* Modal */}
      <div className="bg-card border border-border rounded-xl w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Create New Investigation</h2>
          <button 
            onClick={onClose}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-5">
          {state.error && (
            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium text-foreground">Case Title</label>
            <input 
              id="title"
              name="title"
              type="text" 
              required
              disabled={isPending}
              placeholder="e.g. Suspicious Login Spike from RU"
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border focus:ring-1 focus:ring-white/20 transition-all disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="severity" className="text-sm font-medium text-foreground">Severity Level</label>
              <select 
                id="severity"
                name="severity"
                required
                disabled={isPending}
                defaultValue="Medium"
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-border focus:ring-1 focus:ring-white/20 transition-all appearance-none disabled:opacity-50"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium text-foreground">Initial Status</label>
              <select 
                id="status"
                name="status"
                required
                disabled={isPending}
                defaultValue="Open"
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-border focus:ring-1 focus:ring-white/20 transition-all appearance-none disabled:opacity-50"
              >
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Contained">Contained</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium text-foreground">Description / Initial Notes</label>
            <textarea 
              id="description"
              name="description"
              rows={4}
              disabled={isPending}
              placeholder="Provide context on the incident..."
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border focus:ring-1 focus:ring-white/20 transition-all disabled:opacity-50 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Creating..." : "Create Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
