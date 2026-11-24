"use client";

import { useState } from "react";
import { AlertOctagon } from "lucide-react";
import { IsolateHostModal } from "@/components/dashboard/siem/IsolateHostModal";

export function IsolateHostButton({ machineName }: { machineName: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded border border-rose-500/20 transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
      >
        <AlertOctagon className="w-3.5 h-3.5" />
        Isolate Host
      </button>

      {showModal && (
        <IsolateHostModal
          machineName={machineName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
