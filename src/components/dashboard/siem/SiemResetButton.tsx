"use client";

import { useState } from "react";
import { DownloadCloud, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportSiemLogs, resetSiemLogs } from "@/app/actions/siem";

export function SiemResetButton() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const executeExportOnly = async () => {
    setShowModal(false);
    setLoading(true);
    toast.loading("Exporting SIEM logs to JSON...", { id: "siem-export" });

    try {
      const exportRes = await exportSiemLogs();
      if (!exportRes.success || !exportRes.data) {
        throw new Error(exportRes.error || "Failed to fetch logs for export");
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportRes.data, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `siem_export_${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      toast.success("SIEM successfully exported!", { id: "siem-export" });
    } catch (err: any) {
      toast.error(err.message || "An error occurred during export.", { id: "siem-export" });
    } finally {
      setLoading(false);
    }
  };

  const executeReset = async () => {
    setShowModal(false);
    setLoading(true);
    toast.loading("Exporting SIEM logs to JSON...", { id: "siem-reset" });

    try {
      // 1. Export
      const exportRes = await exportSiemLogs();
      if (!exportRes.success || !exportRes.data) {
        throw new Error(exportRes.error || "Failed to fetch logs for export");
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportRes.data, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `siem_export_${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      toast.loading("Export complete. Purging database...", { id: "siem-reset" });

      // 2. Delete
      const resetRes = await resetSiemLogs();
      if (!resetRes.success) {
        throw new Error(resetRes.error || "Failed to delete logs from database");
      }

      toast.success("SIEM successfully exported and purged!", { id: "siem-reset" });
    } catch (err: any) {
      toast.error(err.message || "An error occurred during reset.", { id: "siem-reset" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded transition-all text-xs font-mono font-bold uppercase disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <DownloadCloud className="w-4 h-4" />
            Manage Logs
          </>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-muted border border-rose-500/30 rounded-xl shadow-[0_0_50px_rgba(225,29,72,0.15)] max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2 tracking-tight">Manage Telemetry Database</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                You can export the current logs to JSON, or export and permanently <strong>delete every record</strong> from the SIEM database.
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={executeExportOnly}
                  className="w-full py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold rounded transition-colors flex items-center justify-center gap-2"
                >
                  <DownloadCloud className="w-4 h-4" />
                  Export Only (Keep Data)
                </button>
                <div className="flex items-center gap-3 w-full">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 px-4 bg-muted hover:bg-accent text-foreground rounded font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeReset}
                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-foreground font-bold rounded shadow-[0_0_15px_rgba(225,29,72,0.5)] transition-all"
                  >
                    Export & Purge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
