import { Mail } from "lucide-react";
import { EmailAnalyzerClient } from "./EmailAnalyzerClient";

export const dynamic = "force-dynamic";

export default function EmailForensicsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-cyan-400" />
            Email Forensics Analyzer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Parse raw email headers, trace routing paths, identify spoofing indicators, and extract attachment metadata safely.
          </p>
        </div>
      </div>

      <EmailAnalyzerClient />
    </div>
  );
}
