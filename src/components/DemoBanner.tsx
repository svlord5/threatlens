import { isDemoMode } from "@/lib/demo";

export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs text-center py-1.5 px-3">
      Demo mode: synthetic data, nothing is saved, and ingest, admin and outbound API calls are disabled.
      Set your environment values to run it for real.
    </div>
  );
}
