"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { NewCaseModal } from "@/components/modals/NewCaseModal";

export function NewCaseButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-black bg-white rounded-md hover:bg-zinc-200 transition-colors font-medium"
      >
        <Plus className="w-4 h-4" />
        New Case
      </button>

      <NewCaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
