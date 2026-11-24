"use client";

import { Download } from "lucide-react";
import Papa from "papaparse";

export function ExportCasesButton({ cases }: { cases: any[] }) {
  const handleExportCSV = () => {
    const dataToExport = cases.map(c => ({
      "Case ID": c.id,
      "Title": c.title,
      "Severity": c.severity,
      "Status": c.status,
      "Analyst ID": c.analyst_id || "Unassigned",
      "Created At": new Date(c.created_at).toLocaleString(),
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Active_Cases_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExportCSV}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground border border-border rounded-md hover:bg-muted transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}
