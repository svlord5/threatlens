import { createClient } from "@/utils/supabase/server";
import { Cpu } from "lucide-react";
import { AddRuleModal } from "@/components/dashboard/automation/AddRuleModal";
import { AutomationRulesList } from "@/components/dashboard/automation/AutomationRulesList";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const supabase = await createClient();
  
  const { data: rules } = await supabase
    .from('detection_rules')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Automation & SOAR</h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono tracking-wide">Configure detection rules and automated playbooks for active telemetry streams.</p>
        </div>
      </div>

      {/* Rules Grid */}
      <AutomationRulesList initialRules={rules || []} />

    </div>
  );
}
