import { createClient } from "@/utils/supabase/server";
import { IOCsTable } from "@/components/dashboard/iocs/IOCsTable";

export default async function IOCsPage() {
  const supabase = await createClient();
  
  let iocsData: any = [];
  try {
    // ONE-TIME SEED SCRIPT FOR TESTING
    const { data: check } = await supabase.from("iocs").select("id").eq("value", "malicious-test-domain.com").maybeSingle();
    if (!check) {
      await supabase.from("iocs").insert({ value: "malicious-test-domain.com", type: "DOMAIN", severity: "Critical", confidence_score: 100 });
      await supabase.from("endpoint_logs").insert({ machine_name: "WIN-TEST-AGENT", event_id: 9999, provider: "Test-Injector", level: "Critical", message: "Suspicious outbound connection to malicious-test-domain.com" });
    }
    // END SEED SCRIPT

    // Fetch IOCs and join with campaigns and created_by to get rich details if needed.
    // For now we'll just fetch the base table and left join tags if possible.
    const { data, error } = await supabase
      .from("iocs")
      .select("*, ioc_tags(tag)")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      iocsData = data.map((ioc: any) => ({
        ...ioc,
        tags: ioc.ioc_tags.map((t: any) => t.tag)
      }));
    }
  } catch (e) {
    console.error(e);
  }

  const iocs = iocsData || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">IOC Hunter</h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono tracking-wide">Central Indicators of Compromise Database & Threat Correlation.</p>
        </div>
      </div>

      <IOCsTable initialIocs={iocs} />
    </div>
  );
}
