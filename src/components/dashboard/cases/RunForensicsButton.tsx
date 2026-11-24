"use client";

import { useState } from "react";
import { Terminal } from "lucide-react";
import { ForensicsModal } from "@/components/dashboard/siem/ForensicsModal";

export function RunForensicsButton({ machineName, caseId }: { machineName: string, caseId?: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded border border-blue-500/20 transition-colors flex items-center gap-1.5"
      >
        <Terminal className="w-3.5 h-3.5" />
        Digital Forensics
      </button>

      {showModal && (
        <ForensicsModal
          machineName={machineName}
          caseId={caseId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
