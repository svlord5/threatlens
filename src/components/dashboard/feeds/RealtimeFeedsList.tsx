"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Rss, Power, Loader2, Trash2, Pencil, Check, X } from "lucide-react";
import { toggleFeedStatus, deleteFeed, editFeedName } from "@/app/actions";
import { ConfigureFeedModal } from "@/components/dashboard/feeds/ConfigureFeedModal";
import { toast } from "sonner";

export function RealtimeFeedsList({ initialFeeds }: { initialFeeds: any[] }) {
  const [feeds, setFeeds] = useState(initialFeeds);
  const [configuringFeed, setConfiguringFeed] = useState<any | null>(null);
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});
  
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('realtime_feeds')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed' },
        (payload) => {
          setFeeds((current) => [payload.new, ...current]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'feed' },
        (payload) => {
          setFeeds((current) => current.map((f) => f.id === payload.new.id ? payload.new : f));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'feed' },
        (payload) => {
          setFeeds((current) => current.filter((f) => f.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleToggle = async (feed: any) => {
    setPendingToggles(prev => ({ ...prev, [feed.id]: true }));
    await toggleFeedStatus(feed.id, feed.status);
    setPendingToggles(prev => ({ ...prev, [feed.id]: false }));
  };

  const handleDelete = (feedId: string) => {
    toast("Permanently delete this Threat Intelligence Feed?", {
      action: {
        label: "Delete",
        onClick: async () => {
          setIsDeleting(prev => ({ ...prev, [feedId]: true }));
          await deleteFeed(feedId);
          toast.success("Feed deleted successfully.");
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  const handleSaveEdit = async (feedId: string) => {
    if (editName.trim().length > 0) {
      await editFeedName(feedId, editName);
    }
    setEditingFeedId(null);
  };

  const getHealthDot = (health: string) => {
    switch (health) {
      case "Healthy": return "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]";
      case "Degraded": return "bg-yellow-500";
      case "Offline": return "bg-red-500";
      default: return "bg-zinc-500";
    }
  };

  if (feeds.length === 0) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center text-muted-foreground text-sm bg-card border border-border rounded-md">
        No threat feeds configured. Add a feed to start ingesting intelligence.
      </div>
    );
  }

  return (
    <>
      {feeds.map((feed) => (
        <div key={feed.id} className="bg-[#020202] border border-white/5 p-6 rounded-lg flex flex-col justify-between group hover:border-indigo-500/50 hover:bg-indigo-950/10 transition-all shadow-xl relative overflow-hidden">
          
          {/* Animated Data Flow Background Line */}
          {feed.status === 'Enabled' && (
            <div className="absolute top-0 left-0 w-full h-[2px] bg-muted overflow-hidden">
              <div className="h-full bg-indigo-500 w-1/3 animate-[translateX_2s_linear_infinite]" style={{ animationName: 'slide-right' }}></div>
            </div>
          )}
          
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none opacity-10"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 border border-border bg-background/50 backdrop-blur rounded shadow-[0_0_10px_rgba(255,255,255,0.02)_inset]">
                <Rss className={`w-5 h-5 ${feed.status === 'Enabled' ? 'text-indigo-400' : 'text-muted-foreground'} transition-colors`} />
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleDelete(feed.id)}
                  disabled={isDeleting[feed.id]}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/30 transition-all disabled:opacity-50"
                  title="Delete Feed"
                >
                  {isDeleting[feed.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm text-[10px] font-mono border border-white/5 bg-muted text-muted-foreground uppercase tracking-widest shadow-inner">
                  <div className="relative flex items-center justify-center">
                    <div className={`absolute w-3 h-3 rounded-full opacity-30 animate-ping ${getHealthDot(feed.health)}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full relative ${getHealthDot(feed.health)}`}></div>
                  </div>
                  {feed.health}
                </div>
              </div>
            </div>
            
            {editingFeedId === feed.id ? (
              <div className="flex items-center gap-2 mb-1 z-20 relative">
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(feed.id);
                    if (e.key === 'Escape') setEditingFeedId(null);
                  }}
                  className="bg-background border border-indigo-500/50 rounded px-2 py-1 text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                />
                <button onClick={() => handleSaveEdit(feed.id)} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingFeedId(null)} className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1 group/title">
                <h3 className="text-lg font-bold tracking-wide text-foreground group-hover:text-indigo-300 transition-colors">{feed.name}</h3>
                <button 
                  onClick={() => {
                    setEditingFeedId(feed.id);
                    setEditName(feed.name);
                  }}
                  className="opacity-0 group-hover/title:opacity-100 p-1 text-muted-foreground hover:text-indigo-400 transition-all"
                  title="Edit Name"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-6">
              Telemetry: <span className={feed.status === 'Enabled' ? 'text-indigo-400 font-bold' : 'text-muted-foreground'}>{feed.status === 'Enabled' ? 'ACTIVE STREAM' : 'OFFLINE'}</span>
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-background/40 p-3 rounded border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">Indicators</div>
                <div className="font-mono text-lg font-bold text-foreground group-hover:text-foreground transition-colors">{parseInt(feed.indicators || "0", 10).toLocaleString()}</div>
              </div>
              <div className="bg-background/40 p-3 rounded border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">Last Sync</div>
                <div className="font-mono text-sm font-bold text-foreground group-hover:text-foreground transition-colors truncate">{feed.last_sync || feed.lastSync || 'NEVER'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-auto pt-4 border-t border-white/5 relative z-10">
            <button 
              onClick={() => setConfiguringFeed(feed)}
              className="flex-1 py-2 text-[10px] font-bold font-mono tracking-widest text-muted-foreground border border-white/5 rounded bg-background/50 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30 transition-all uppercase"
            >
              Configure Module
            </button>
            <button 
              onClick={() => handleToggle(feed)}
              disabled={pendingToggles[feed.id]}
              className={`p-2 border border-white/5 rounded transition-all bg-background/50 ${feed.status === 'Enabled' ? 'text-muted-foreground hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)_inset]' : 'text-zinc-700 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)_inset]'} disabled:opacity-50`}
            >
              {pendingToggles[feed.id] ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Power className="w-4 h-4" />}
            </button>
          </div>

          <style jsx>{`
            @keyframes slide-right {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
        </div>
      ))}

      {configuringFeed && (
        <ConfigureFeedModal feed={configuringFeed} onClose={() => setConfiguringFeed(null)} />
      )}
    </>
  );
}
