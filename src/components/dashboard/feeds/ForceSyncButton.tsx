"use client";

import { RefreshCw, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { forceSyncAllFeeds } from "@/app/actions";

export function ForceSyncButton() {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      await forceSyncAllFeeds();
    });
  };

  return (
    <button 
      onClick={handleSync}
      disabled={isPending}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-foreground border border-border rounded-md hover:bg-muted transition-all hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5" />
      )}
      {isPending ? "SYNCING..." : "FORCE SYNC"}
    </button>
  );
}
