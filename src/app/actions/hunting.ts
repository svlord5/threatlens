"use server";

import { createClient } from "@/utils/supabase/server";

export interface HuntFinding {
  logId: string;
  machineName: string;
  timestamp: string;
  iocValue: string;
  iocType: string;
  iocSeverity: string;
  logSnippet: string;
  provider: string;
}

export async function runIocHunt(): Promise<{ findings: HuntFinding[], metrics: any, error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Fetch all active IOCs
    const { data: iocs, error: iocError } = await supabase
      .from("iocs")
      .select("*");
      
    if (iocError) throw new Error("Failed to fetch IOCs: " + iocError.message);
    if (!iocs || iocs.length === 0) return { findings: [], metrics: { scannedLogs: 0, scannedIocs: 0 } };

    // Filter out expired IOCs
    const activeIocs = iocs.filter(ioc => {
      if (!ioc.expiration_date) return true;
      return new Date(ioc.expiration_date) > new Date();
    });

    // 2. Fetch recent Endpoint Logs (limit to 5000 for performance in this MVP)
    const { data: logs, error: logError } = await supabase
      .from("endpoint_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(5000);

    if (logError) throw new Error("Failed to fetch logs: " + logError.message);
    if (!logs || logs.length === 0) return { findings: [], metrics: { scannedLogs: 0, scannedIocs: activeIocs.length } };

    // 3. Correlate
    const findings: HuntFinding[] = [];
    
    // Very basic correlation: loop logs, loop IOCs, check if ioc.value is in log message, provider, or machine_name
    for (const log of logs) {
      const searchString = `${log.message || ""} ${log.provider || ""} ${log.machine_name || ""}`.toLowerCase();
      
      for (const ioc of activeIocs) {
        const iocValueLower = ioc.value.toLowerCase();
        if (searchString.includes(iocValueLower)) {
          findings.push({
            logId: log.id,
            machineName: log.machine_name,
            timestamp: log.timestamp,
            iocValue: ioc.value,
            iocType: ioc.type,
            iocSeverity: ioc.severity,
            logSnippet: log.message,
            provider: log.provider
          });
        }
      }
    }

    // Sort findings by most recent
    findings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { 
      findings, 
      metrics: { 
        scannedLogs: logs.length, 
        scannedIocs: activeIocs.length,
        hits: findings.length
      } 
    };

  } catch (error: any) {
    console.error("Hunt Error:", error);
    return { findings: [], metrics: { scannedLogs: 0, scannedIocs: 0 }, error: error.message };
  }
}
