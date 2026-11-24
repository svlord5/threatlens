"use client";

import { Download, Loader2 } from "lucide-react";
import { useIsClient } from "@/hooks/use-is-client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReportTemplate from "./ReportTemplate";

export default function PrintButton({ scan, domainName }: { scan: any, domainName: string }) {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <button disabled className="bg-indigo-600 opacity-50 text-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 cursor-not-allowed">
        <Loader2 className="w-4 h-4 animate-spin" />
        Preparing Template...
      </button>
    );
  }

  return (
    <PDFDownloadLink 
      document={<ReportTemplate scan={scan} />} 
      fileName={`ThreatLens_Report_${domainName}.pdf`}
      className="bg-indigo-600 hover:bg-indigo-500 text-foreground px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
    >
      {({ loading }) => (
        <>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? "Generating Template..." : "Download Custom PDF"}
        </>
      )}
    </PDFDownloadLink>
  );
}
