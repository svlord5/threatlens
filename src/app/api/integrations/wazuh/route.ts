import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

function flattenToMarkdown(obj: any, prefix = ''): string[] {
  let result: string[] = [];
  if (typeof obj !== 'object' || obj === null) return result;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        result = result.concat(flattenToMarkdown(obj[key], propName));
      } else {
        result.push(`- **${propName}**: ${Array.isArray(obj[key]) ? obj[key].join(", ") : obj[key]}`);
      }
    }
  }
  return result;
}

import { getSupabaseSecretKey } from "@/utils/supabase/keys";
import { requireAuth } from "@/lib/api-auth";
import { rejectLargeBody, LIMITS } from "@/lib/limits";

// Initialize Supabase admin client for server-side ingestion
// Created lazily so the module can load with no environment configured (demo mode).
let _supabase: SupabaseClient | null = null;
const getSupabase = () =>
  (_supabase ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getSupabaseSecretKey(), {
    auth: { persistSession: false },
  }));

export async function POST(req: NextRequest) {
  const authz = await requireAuth(req, { agentOnly: true, blockDemo: true });
  if (!authz.ok) return authz.response;
  const tooBig = rejectLargeBody(req, LIMITS.body.medium);
  if (tooBig) return tooBig;

  try {
    const wazuhAlert = await req.json();


    // Basic Wazuh alert schema extraction (Wazuh typically sends { rule: { level, description, id }, agent: { name, id }, ... })
    const supabase = getSupabase();
    const alertLevel = wazuhAlert.rule?.level || 0;
    const alertDescription = wazuhAlert.rule?.description || "Unknown Wazuh Alert";
    const agentName = wazuhAlert.agent?.name || "Unknown Agent";
    const ruleId = wazuhAlert.rule?.id || "Unknown Rule ID";
    
    const severity = alertLevel >= 12 ? 'Critical' : (alertLevel >= 7 ? 'High' : (alertLevel >= 4 ? 'Medium' : 'Low'));

    // 1. Insert into endpoint_logs for raw telemetry tracking
    const { error: logError } = await supabase.from('endpoint_logs').insert({
      timestamp: new Date().toISOString(),
      machine_name: agentName,
      event_id: ruleId,
      provider: "Wazuh",
      level: severity,
      message: alertDescription,
      raw_data: wazuhAlert
    });

    if (logError) {
      console.error("[Wazuh Webhook] Error inserting into endpoint_logs:", logError);
    }

    // 2. If it's a High/Critical alert, automatically escalate to an Active Case
    if (alertLevel >= 7) {
       
       const mitreTactics = wazuhAlert.rule?.mitre?.tactic?.join(", ") || "None";
       const mitreId = wazuhAlert.rule?.mitre?.id?.join(", ") || "None";
       const agentIp = wazuhAlert.agent?.ip || "Unknown IP";
       const location = wazuhAlert.location || "Unknown Location";
       
       // Try to extract a clean readable message if it's a Windows event, otherwise fallback to full_log string
       const logContext = wazuhAlert.data?.win?.system?.message || wazuhAlert.full_log || "No additional context available.";

       // Flatten the entire wazuhAlert.data object (or wazuhAlert if data is missing) for the markdown description
       const dataToFlatten = wazuhAlert.data || wazuhAlert;
       const flattenedFields = flattenToMarkdown(dataToFlatten).join('\n');

       const formattedDescription = `**Automated Case generated from Wazuh SIEM**

**Agent Info:**
- Name: ${agentName}
- IP: ${agentIp}

**Rule Details:**
- Rule ID: ${ruleId}
- Level: ${alertLevel} (${severity})
- MITRE ATT&CK: ${mitreId} (${mitreTactics})
- Log Location: ${location}

**Extracted Context:**
\`\`\`text
${logContext}
\`\`\`

**Event Data Fields:**
${flattenedFields}`;

       const { data: newCase, error: caseError } = await supabase.from('case').insert({
         title: `[Wazuh] ${alertDescription}`,
         description: formattedDescription,
         severity: severity,
         status: 'Open'
       }).select().single();

       if (caseError) {
         console.error("[Wazuh Webhook] Error creating active case:", caseError);
       } else if (newCase) {
         // --- Auto-Populate DFIR Tabs ---

         // 1. Threat Mapping (MITRE)
         if (wazuhAlert.rule?.mitre) {
           const tactics = wazuhAlert.rule.mitre.tactic || [];
           const ids = wazuhAlert.rule.mitre.id || [];
           for (let i = 0; i < Math.max(tactics.length, ids.length); i++) {
             // Column names match supabase/schema.sql (case_mitre has tactic_name, not tactic).
             await supabase.from('case_mitre').insert({
               case_id: newCase.id,
               technique_id: ids[i] || 'Unknown',
               tactic_name: tactics[i] || 'Unknown',
             });
           }
         }

         // 2. Extracted Telemetry (IOCs)
         if (wazuhAlert.agent?.ip) {
           // First insert/get the IOC
           const { data: iocData } = await supabase.from('ioc').upsert({
             value: wazuhAlert.agent.ip,
             type: 'IP',
             risk_score: 50
           }, { onConflict: 'value' }).select().single();
           
           if (iocData) {
             await supabase.from('case_ioc').insert({
               case_id: newCase.id,
               ioc_id: iocData.id
             });
           }
         }

         // 3. Timeline (Investigations)
         await supabase.from('investigations').insert({
           case_id: newCase.id,
           event_time: new Date().toISOString(),
           // investigations stores a single timeline_event text (see supabase/schema.sql).
           timeline_event: `Automated case escalated from Wazuh level ${alertLevel} alert. Triggered by rule ID ${ruleId}.`,
         });
       }
    }

    return NextResponse.json({ success: true, message: "Wazuh alert processed" });

  } catch (error: any) {
    console.error("[Wazuh Webhook] Error processing payload:", error);
    return NextResponse.json({ error: "Failed to process Wazuh payload", details: error.message }, { status: 500 });
  }
}
