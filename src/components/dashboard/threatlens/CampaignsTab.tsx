"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Campaign, ThreatActor } from "@/types";
import { ShieldAlert, Plus, Search, Calendar } from "lucide-react";
import { useIAM } from "@/app/dashboard/layout";
import { toast } from "sonner";
import { AddCampaignModal } from "./AddCampaignModal";

export function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<(Campaign & { threat_actors?: ThreatActor })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const supabase = createClient();
  const iamPolicy = useIAM();
  const isReadOnly = iamPolicy?.read_only;

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, threat_actors(name, id)')
      .order('created_at', { ascending: false });
    
    if (data) setCampaigns(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data once on mount
    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/50 p-4 border border-white/5 rounded-lg">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search Campaigns..." 
            className="w-full pl-10 pr-4 py-2 bg-background/40 border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-muted-foreground"
          />
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md text-sm font-medium transition-all w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
          >
            <Plus className="w-4 h-4" />
            Track Campaign
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-background/20 border border-border rounded-lg">
          <ShieldAlert className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No Campaigns Tracked</p>
          <p className="text-xs text-muted-foreground mt-1">Start tracking active cyber attacks.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background/20 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/80 text-muted-foreground border-b border-border font-mono tracking-wider">
              <tr>
                <th className="px-6 py-4">Campaign Name</th>
                <th className="px-6 py-4">Threat Actor</th>
                <th className="px-6 py-4">Target Sectors</th>
                <th className="px-6 py-4">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-muted transition-colors group">
                  <td className="px-6 py-4 font-semibold text-foreground group-hover:text-indigo-400 transition-colors">
                    {camp.name}
                  </td>
                  <td className="px-6 py-4">
                    {camp.threat_actors ? (
                      <span className="flex items-center gap-2 text-foreground">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        {camp.threat_actors.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Unknown</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {camp.target_sectors?.map(sector => (
                        <span key={sector} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase tracking-wider">
                          {sector}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {camp.start_date ? new Date(camp.start_date).toISOString().split('T')[0] : 'Unknown'} 
                      {' -> '} 
                      {camp.end_date ? new Date(camp.end_date).toISOString().split('T')[0] : 'Present'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && <AddCampaignModal onClose={() => { setShowAddModal(false); fetchCampaigns(); }} />}
    </div>
  );
}
