import { createClient } from "@/utils/supabase/server";
import { RealtimeFeedsList } from "@/components/dashboard/feeds/RealtimeFeedsList";
import { AddFeedButton } from "@/components/dashboard/AddFeedButton";
import { ForceSyncButton } from "@/components/dashboard/feeds/ForceSyncButton";

export default async function FeedsPage() {
  const supabase = await createClient();
  
  // Graceful fallback if the user hasn't created the `feed` table yet
  let feedsData = [];
  try {
    const { data, error } = await supabase
      .from("feed")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      feedsData = data;
    }
  } catch (e) {
    // Table might not exist yet
  }

  const feeds = feedsData || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Cyber Connector Modules</h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono tracking-wide">Manage external intelligence sources and active API telemetry streams.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ForceSyncButton />
          <AddFeedButton />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RealtimeFeedsList initialFeeds={feeds} />
      </div>
    </div>
  );
}
