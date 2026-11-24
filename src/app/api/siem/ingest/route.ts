import { NextResponse } from 'next/server';
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from '@supabase/supabase-js';
import { getSupabaseSecretKey } from '@/utils/supabase/keys';
import { requireAuth } from '@/lib/api-auth';
import { rejectLargeBody, LIMITS } from "@/lib/limits";

// We use the modern secret/publishable key to securely insert logs from the API endpoint
// because this is a machine-to-machine communication without a user session.
// Created lazily so the module can load with no environment configured (demo mode).
let _supabase: SupabaseClient | null = null;
const getSupabase = () =>
  (_supabase ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getSupabaseSecretKey()));

export async function POST(request: Request) {
  try {
    const authz = await requireAuth(request, { agentOnly: true, blockDemo: true });
    if (!authz.ok) return authz.response;
    const tooBig = rejectLargeBody(request, LIMITS.body.ingest);
    if (tooBig) return tooBig;

    let logs = await request.json();

    if (!Array.isArray(logs)) {
      if (typeof logs === 'object' && logs !== null) {
        logs = [logs];
      } else {
        return NextResponse.json({ error: 'Payload must be an array of logs or a single log object' }, { status: 400 });
      }
    }

    if (logs.length > LIMITS.ingestEventsPerBatch) {
      return NextResponse.json({ error: `At most ${LIMITS.ingestEventsPerBatch} events per request` }, { status: 413 });
    }

    const supabase = getSupabase();

    // Fetch active detection rules
    const { data: rules } = await supabase.from('detection_rules').select('*').eq('is_active', true);
    
    // Evaluate rules
    const logsToInsert = [];
    const actionsToTake = [];

    for (const log of logs) {
      let shouldDrop = false;
      const parsedLog = {
        timestamp: log.TimeCreated,
        machine_name: log.MachineName,
        event_id: log.Id?.toString() || "",
        provider: log.ProviderName,
        level: log.LevelDisplayName || "Information",
        message: log.Message || "",
        raw_data: log
      };

      if (rules && rules.length > 0) {
        for (const rule of rules) {
          const targetValue = String(parsedLog[rule.target_field as keyof typeof parsedLog] || "");
          const isMatch = targetValue.toLowerCase().includes(rule.match_pattern.toLowerCase());

          if (isMatch) {
            if (rule.action_type === 'drop_log') {
              shouldDrop = true;
              break; // Stop evaluating this log, we are dropping it
            } else {
              actionsToTake.push({ rule, log: parsedLog });
            }
          }
        }
      }

      if (!shouldDrop) {
        logsToInsert.push(parsedLog);
      }
    }

    // Insert the logs into Supabase
    if (logsToInsert.length > 0) {
      const { error } = await supabase.from('endpoint_logs').insert(logsToInsert);
      if (error) {
        console.error("Supabase Insertion Error:", error);
      }
    }

    // Execute SOAR Actions
    for (const action of actionsToTake) {
      const { rule, log } = action;
      
      if (rule.action_type === 'create_case' || rule.action_type === 'isolate_host') {
        const titlePrefix = rule.action_type === 'isolate_host' ? '[EDR ISOLATED] ' : '[SOAR Alert] ';
        await supabase.from('case').insert({
          title: `${titlePrefix}${rule.name} on ${log.machine_name}`,
          description: `SOAR Playbook Triggered by Rule: **${rule.name}**\n\n**Pattern Matched:** ${rule.target_field} contains "${rule.match_pattern}"\n\n**Raw Log:**\n\`\`\`text\n${log.message}\n\`\`\``,
          severity: rule.severity,
          status: 'Open'
        });
      } else if (rule.action_type === 'flag_ioc') {
        // If the rule flags an IOC, we might not know the exact IOC string, 
        // but we can flag the machine name or provider as an IOC for demonstration
        await supabase.from('ioc').insert({
          value: `SOAR-FLAG-${log.machine_name}-${Date.now()}`,
          type: 'DOMAIN',
          risk_score: 95,
          status: 'Active',
          reputation: 'Malicious'
        });
      }
    }

    return NextResponse.json({ success: true, count: logs.length });
  } catch (error: any) {
    console.error("SIEM Ingest Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
