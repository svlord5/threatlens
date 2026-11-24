import { Search, Globe } from "lucide-react";
import { Suspense } from "react";
import { OsintClient } from "./OsintClient";

export default function OsintPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            OSINT Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Live Open Source Intelligence Gathering</p>
        </div>
      </div>

      <Suspense fallback={<div className="text-muted-foreground animate-pulse">Loading engine...</div>}>
        <OsintClient />
      </Suspense>
    </div>
  );
}
