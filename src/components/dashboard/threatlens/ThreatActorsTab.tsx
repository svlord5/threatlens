"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ThreatActor } from "@/types";
import { ShieldAlert, Plus, Search, MapPin, Target } from "lucide-react";
import { useIAM } from "@/app/dashboard/layout";
import { toast } from "sonner";
import { AddThreatActorModal } from "./AddThreatActorModal";

export function ThreatActorsTab() {
  const [actors, setActors] = useState<ThreatActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const supabase = createClient();
  const iamPolicy = useIAM();
  const isReadOnly = iamPolicy?.read_only;

  const fetchActors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('threat_actors').select('*').order('created_at', { ascending: false });
    if (data) setActors(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data once on mount
    fetchActors();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/50 p-4 border border-white/5 rounded-lg">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search Threat Actors..." 
            className="w-full pl-10 pr-4 py-2 bg-background/40 border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-muted-foreground"
          />
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md text-sm font-medium transition-all w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
          >
            <Plus className="w-4 h-4" />
            Add Threat Actor
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading actors...</div>
      ) : actors.length === 0 ? (
        <div className="text-center py-12 bg-background/20 border border-border rounded-lg">
          <ShieldAlert className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No Threat Actors Tracked</p>
          <p className="text-xs text-muted-foreground mt-1">Add a threat actor to begin correlation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actors.map(actor => (
            <div key={actor.id} className="bg-muted border border-border rounded-xl p-5 hover:border-indigo-500/30 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-indigo-400 transition-colors">{actor.name}</h3>
                {actor.mitre_id && (
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 text-foreground border border-zinc-700">
                    {actor.mitre_id}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 h-14">
                {actor.description || "No description provided."}
              </p>
              <div className="flex flex-col gap-2">
                {actor.origin_country && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Origin: {actor.origin_country}</span>
                  </div>
                )}
                {actor.aliases && actor.aliases.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="truncate">Aliases: {actor.aliases.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddThreatActorModal onClose={() => { setShowAddModal(false); fetchActors(); }} />}
    </div>
  );
}
