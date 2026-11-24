import { createClient } from "@/utils/supabase/server";
import { Search, ShieldCheck, Activity, Globe, Users, Target, Bug } from "lucide-react";
import Link from "next/link";
import ThreatLensViewContainer from "./ThreatLensViewContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThreatActorsTab } from "@/components/dashboard/threatlens/ThreatActorsTab";
import { CampaignsTab } from "@/components/dashboard/threatlens/CampaignsTab";
import { MalwareFamiliesTab } from "@/components/dashboard/threatlens/MalwareFamiliesTab";

export const dynamic = "force-dynamic";

export default async function ThreatLensDashboard() {
  const supabase = await createClient();

  const { data: domains } = await supabase
    .from('threatlens_domains')
    .select('*, threatlens_scans(id, risk_score, status, created_at)')
    .order('created_at', { ascending: false });

  const domainList = domains || [];

  return (
    <div className="space-y-8">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            ThreatLens
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Domain Intelligence & Attack Surface Management</p>
        </div>
        <Link 
          href="/dashboard/threatlens/scan"
          className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 w-fit"
        >
          <Search className="w-4 h-4" />
          New Scan
        </Link>
      </div>

      <Tabs defaultValue="domains" className="w-full">
        <TabsList className="flex flex-wrap w-full sm:w-fit h-auto mb-8 bg-muted border border-border p-1 gap-1">
          <TabsTrigger value="domains" className="flex items-center gap-2 flex-1 sm:flex-none"><Globe className="w-4 h-4"/> Domains</TabsTrigger>
          <TabsTrigger value="actors" className="flex items-center gap-2 flex-1 sm:flex-none"><Users className="w-4 h-4"/> Actors</TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2 flex-1 sm:flex-none"><Target className="w-4 h-4"/> Campaigns</TabsTrigger>
          <TabsTrigger value="malware" className="flex items-center gap-2 flex-1 sm:flex-none"><Bug className="w-4 h-4"/> Malware</TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Monitored Domains List / Graph */}
            <div className="lg:col-span-2">
              <ThreatLensViewContainer domains={domainList} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                  Active Alerts
                </h2>
                <div className="bg-muted border border-border rounded-xl p-8 text-center">
                  <ShieldCheck className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
                  <p className="text-sm text-foreground font-medium">No critical alerts</p>
                  <p className="text-xs text-muted-foreground mt-1">Monitoring system is active</p>
                </div>
              </div>
              
              <div className="bg-muted border border-border rounded-xl p-6">
                <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  Continuous Monitoring
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Domains are scanned automatically every 24 hours to detect SSL expiration, DNS hijacking, open ports, and misconfigurations.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="actors">
          <ThreatActorsTab />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>

        <TabsContent value="malware">
          <MalwareFamiliesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
