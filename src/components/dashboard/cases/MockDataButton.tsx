"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { generateMockTelemetry } from "@/app/actions";
import { useRouter } from "next/navigation";

export function MockDataButton({ caseId }: { caseId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsGenerating(true);
    const res = await generateMockTelemetry(caseId);
    if (res.success) {
      window.location.reload();
    } else {
      alert("Failed to generate mock data: " + res.error);
    }
    setIsGenerating(false);
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="whitespace-nowrap h-8 flex items-center gap-1.5 px-3 bg-indigo-500 hover:bg-indigo-600 text-foreground text-[10px] font-mono uppercase tracking-widest rounded transition-colors disabled:opacity-50 border border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
      title="Generate realistic mock PCAP and Memory Hex data using AI"
    >
      {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-200" />}
      {isGenerating ? "ANALYZING..." : "AI AUTOPILOT"}
    </button>
  );
}
