"use client";

import { useActionState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createFeed, ActionState } from "@/app/actions";

interface AddFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialState: ActionState = {
  success: false,
}

export function AddFeedModal({ isOpen, onClose }: AddFeedModalProps) {
  const [state, formAction, isPending] = useActionState(createFeed, initialState);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" onClick={!isPending ? onClose : undefined}></div>
      <div className="bg-card border border-border rounded-xl w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Add Threat Intelligence Feed</h2>
          <button onClick={onClose} disabled={isPending} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form action={formAction} className="p-5 space-y-5">
          {state.error && <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">{state.error}</div>}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">Feed Name</label>
            <input id="name" name="name" type="text" required disabled={isPending} placeholder="e.g. AlienVault OTX" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border transition-all disabled:opacity-50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="health" className="text-sm font-medium text-foreground">Health Status</label>
              <select id="health" name="health" required disabled={isPending} defaultValue="Healthy" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-border transition-all appearance-none disabled:opacity-50">
                <option value="Healthy">Healthy</option>
                <option value="Degraded">Degraded</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium text-foreground">Sync Status</label>
              <select id="status" name="status" required disabled={isPending} defaultValue="Enabled" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-border transition-all appearance-none disabled:opacity-50">
                <option value="Enabled">Enabled</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
          </div>
          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Adding..." : "Add Feed"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
