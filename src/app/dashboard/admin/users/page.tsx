"use client";

import { useState, useEffect } from "react";
import { Users, ShieldAlert, Lock, Search, MoreVertical, Shield, Loader2, UserCheck, X, Clock, Mail, CheckCircle2, RefreshCw, ExternalLink, Check, Ban, Globe, FileText } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useMe } from "@/hooks/use-me";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function ApplicantPurposeModal({ request, onClose }: { request: any | null, onClose: () => void }) {
  if (!request) return null;
  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-muted border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-5 flex justify-between items-center border-b border-border">
          <div className="flex items-center gap-2.5 text-foreground">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-sm">Research Focus & Purpose</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <div className="text-xs text-muted-foreground">Applicant</div>
            <div className="text-sm font-medium text-foreground">{request.fullName || 'Operator'} &bull; <span className="font-mono text-xs">{request.email}</span></div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Affiliation</div>
            <div className="text-sm font-medium text-foreground">{request.organization || 'Independent'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Stated Intended Purpose</div>
            <div className="p-3.5 rounded-lg bg-background border border-border text-sm text-foreground/90 leading-relaxed italic">
              &quot;{request.purpose}&quot;
            </div>
          </div>
          {request.website && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Portfolio / Profile</div>
              <a 
                href={request.website.startsWith('http') ? request.website : `https://${request.website}`} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1.5 font-mono"
              >
                <span>{request.website}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
        <div className="p-4 bg-background/50 border-t border-border flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RestrictionsInfoModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-muted border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-5 flex justify-between items-center border-b border-border">
          <div className="flex items-center gap-3 text-foreground">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold">Restriction Policies</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] uppercase border border-indigo-500/30 font-bold">Super Admin / God Mode</span>
            </div>
            <p className="text-sm text-muted-foreground">Completely bypasses all restrictions. User has full unfettered access to all pages and features regardless of other settings.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] uppercase border border-rose-500/20 font-medium">Global Read-Only</span>
            </div>
            <p className="text-sm text-muted-foreground">User can view whitelisted pages but all destructive actions (delete, modify, update, invite) are blocked.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] uppercase border border-indigo-500/20 font-medium">No Screenshots Allowed</span>
            </div>
            <p className="text-sm text-muted-foreground">Platform listens for system screenshot hotkeys (Cmd+Shift+3/4/5, PrintScreen) and instantly overlays a black screen to prevent data exfiltration.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] uppercase border border-rose-500/20 font-medium">Copy/Paste Disabled</span>
            </div>
            <p className="text-sm text-muted-foreground">Prevents highlighting text, right-clicking, and triggering keyboard copy shortcuts within the dashboard.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] uppercase border border-amber-500/20 font-medium">Strict Single Session</span>
            </div>
            <p className="text-sm text-muted-foreground">Ensures the user can only be logged in from one device or browser at a time (coming soon to engine).</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-foreground text-[10px] uppercase border border-border font-medium">Pages Whitelisted</span>
            </div>
            <p className="text-sm text-muted-foreground">List of specific dashboard sub-routes the user is authorized to access. Any other path redirects them away.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscordUserCell({ discordId }: { discordId: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(!discordId.includes('@'));

  useEffect(() => {
    if (discordId.includes('@')) return;
    async function fetchDiscord() {
      try {
        const res = await fetch(`/api/discord/user?id=${discordId}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        // Silent fail for table cells
      } finally {
        setLoading(false);
      }
    }
    fetchDiscord();
  }, [discordId]);

  if (discordId.includes('@')) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 border border-border flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium text-foreground leading-none font-mono">{discordId}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Google Login Whitelist</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
          <div className="h-2 w-16 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user || user.error) {
    return (
      <span className="font-mono text-muted-foreground text-xs">
        {discordId}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <img 
        src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
        alt="Avatar" 
        className="w-8 h-8 rounded-full border border-indigo-500/30"
      />
      <div>
        <div className="text-sm font-medium text-foreground leading-none">{user.global_name || user.username}</div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          <span>@{user.username}</span>
          <span className="text-[10px] bg-zinc-800/50 text-muted-foreground px-1.5 py-0.5 rounded font-mono">{discordId}</span>
        </div>
      </div>
    </div>
  );
}

export default function IAMPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const supabase = createClient();
  const me = useMe();

  // Pending Access Requests Monitor State
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsFilter, setRequestsFilter] = useState<'pending' | 'all'>('pending');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [purposeModalRequest, setPurposeModalRequest] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Invite Form State
  const [identityType, setIdentityType] = useState<'email' | 'discord'>('email');
  const [inviteId, setInviteId] = useState("");
  const [discordPreview, setDiscordPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [durationDays, setDurationDays] = useState("0"); // 0 = never
  const [validUntil, setValidUntil] = useState("");
  const [allowedPages, setAllowedPages] = useState<string[]>(["/dashboard"]);
  const [allowedActions, setAllowedActions] = useState<string[]>([]);
  const [disableCopy, setDisableCopy] = useState(false);
  const [singleSession, setSingleSession] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [disableScreenshot, setDisableScreenshot] = useState(false);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [role, setRole] = useState("User");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const loadRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await fetch('/api/auth/request-access?all=1');
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setAccessRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to load access requests:", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadData = async () => {
    const { data: userData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (userData) setUsers(userData);

    const { data: inviteData } = await supabase.from('iam_discord_invites').select('*').order('created_at', { ascending: false });
    if (inviteData) setInvites(inviteData);

    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clears a preview or loads data when the input changes
    loadData();
    loadRequests();
  }, [supabase]);

  const handleApproveRequest = async (req: any) => {
    setProcessingRequestId(req.id);
    try {
      const res = await fetch('/api/auth/request-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: req.id,
          action: 'APPROVE',
          role: 'Analyst',
          allowedPages: ['/dashboard'],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve clearance.');
      }
      toast.success(`Clearance approved! ${req.email} has been whitelisted.`);
      await Promise.all([loadRequests(), loadData()]);
    } catch (err: any) {
      toast.error(err.message || 'Approval failed.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (req: any) => {
    setProcessingRequestId(req.id);
    try {
      const res = await fetch('/api/auth/request-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: req.id,
          action: 'REJECT',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject clearance.');
      }
      toast.info(`Request for ${req.email} marked as rejected.`);
      await loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Rejection failed.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Fetch Discord User Preview
  useEffect(() => {
    if (!inviteId || inviteId.length < 17 || inviteId.includes('@')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears a preview or loads data when the input changes
      setDiscordPreview(null);
      setPreviewError("");
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError("");
      try {
        const res = await fetch(`/api/discord/user?id=${inviteId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to fetch user");
        
        setDiscordPreview(data);
      } catch (err: any) {
        setDiscordPreview(null);
        setPreviewError(err.message);
      } finally {
        setPreviewLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [inviteId]);

  const handleInvite = async () => {
    setSubmitting(true);
    setSubmitError("");
    
    const targetIdentity = identityType === 'email' ? inviteId.trim().toLowerCase() : inviteId.trim();
    if (!targetIdentity) {
      setSubmitError("Please enter a valid identity (Email or Discord ID).");
      setSubmitting(false);
      return;
    }
    if (identityType === 'email' && !targetIdentity.includes('@')) {
      setSubmitError("Please enter a valid email address (e.g. analyst@example.com).");
      setSubmitting(false);
      return;
    }

    let targetValidUntil = null;
    if (durationDays !== "0") {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(durationDays));
      targetValidUntil = d.toISOString();
    } else if (validUntil) {
      targetValidUntil = new Date(validUntil).toISOString();
    }

    const payload = {
      discord_id: targetIdentity,
      valid_until: targetValidUntil,
      allowed_pages: allowedPages,
      allowed_actions: allowedActions,
      disable_copy: disableCopy,
      enforce_single_session: singleSession,
      read_only: readOnly,
      disable_screenshot: disableScreenshot,
      super_admin: superAdmin,
      role: role
    };

    let res;
    if (editMode) {
      res = await supabase.from('iam_discord_invites').update(payload).eq('discord_id', targetIdentity);
    } else {
      res = await supabase.from('iam_discord_invites').insert([payload]);
    }

    if (res.error) {
      console.error("Supabase Error:", res.error);
      setSubmitError(res.error.message);
    } else {
      setShowInviteModal(false);
      setInviteId("");
      setEditMode(false);
      const { data: inviteData } = await supabase.from('iam_discord_invites').select('*').order('created_at', { ascending: false });
      if (inviteData) setInvites(inviteData);
    }
    setSubmitting(false);
  };

  const handleEdit = (inv: any) => {
    const isEmail = inv.discord_id && inv.discord_id.includes('@');
    setIdentityType(isEmail ? 'email' : 'discord');
    setInviteId(inv.discord_id);
    setValidUntil(inv.valid_until ? inv.valid_until.slice(0, 16) : "");
    setAllowedPages(inv.allowed_pages || []);
    setAllowedActions(inv.allowed_actions || []);
    setDisableCopy(inv.disable_copy);
    setSingleSession(inv.enforce_single_session);
    setReadOnly(inv.read_only);
    setDisableScreenshot(inv.disable_screenshot);
    setSuperAdmin(inv.super_admin);
    setRole(inv.role || "User");
    setEditMode(true);
    setShowInviteModal(true);
  };

  const handleRevoke = async (id: string) => {
    toast("Are you sure you want to completely revoke this analyst's access?", {
      action: {
        label: "Revoke",
        onClick: async () => {
          const { error } = await supabase.from('iam_discord_invites').delete().eq('discord_id', id);
          if (!error) {
            setInvites(prev => prev.filter(inv => inv.discord_id !== id));
            toast.success("Access permanently revoked.");
          } else {
            toast.error("Error revoking access: " + error.message);
          }
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  const togglePage = (page: string) => {
    setAllowedPages(prev => prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]);
  };

  const toggleAction = (action: string) => {
    setAllowedActions(prev => prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]);
  };

  const filteredRequests = accessRequests.filter((req) => {
    const matchesFilter = requestsFilter === 'pending' ? (!req.status || req.status === 'PENDING') : true;
    if (!matchesFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      req.fullName?.toLowerCase().includes(q) ||
      req.email?.toLowerCase().includes(q) ||
      req.discordId?.includes(q) ||
      req.organization?.toLowerCase().includes(q)
    );
  });

  const pendingCount = accessRequests.filter((r) => !r.status || r.status === 'PENDING').length;

  const filteredInvites = invites.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.discord_id?.toLowerCase().includes(q) ||
      inv.role?.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <RestrictionsInfoModal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
      <ApplicantPurposeModal request={purposeModalRequest} onClose={() => setPurposeModalRequest(null)} />
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-500" />
          Identity & Access Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage platform clearance requests, Discord whitelists, and analyst RBAC policies.</p>
      </div>

      {/* Tools & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-[#020202] border border-border p-4 rounded-lg shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applicants, identities, analysts..."
            className="w-full bg-muted border border-border rounded-md py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={() => { setInviteId(""); setEditMode(false); setIdentityType('email'); setShowInviteModal(true); }} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md text-sm font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] cursor-pointer">
            <UserCheck className="w-4 h-4" />
            Whitelist Analyst
          </button>
        </div>
      </div>

      {/* Main IAM Navigation Tabs */}
      <Tabs defaultValue="pending" className="w-full space-y-4">
        <div className="border-b border-border pb-3">
          <TabsList className="bg-[#020202] border border-border p-1 rounded-lg h-auto flex flex-wrap gap-1">
            <TabsTrigger
              value="pending"
              className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 data-[state=active]:border data-[state=active]:border-amber-500/30 transition-all text-muted-foreground cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Clearance</span>
              {pendingCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold animate-pulse">
                  {pendingCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-muted-foreground text-[10px] font-mono">
                  0
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="whitelisted"
              className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-400 data-[state=active]:border data-[state=active]:border-indigo-500/30 transition-all text-muted-foreground cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Whitelisted Identities</span>
              <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-muted-foreground text-[10px] font-mono">
                {filteredInvites.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="analysts"
              className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-400 data-[state=active]:border data-[state=active]:border-blue-500/30 transition-all text-muted-foreground cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Registered Analysts</span>
              <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-muted-foreground text-[10px] font-mono">
                {filteredUsers.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Pending Clearance Requests Monitor */}
        <TabsContent value="pending" className="mt-0 space-y-4">
          <div className="bg-[#020202] border border-amber-500/25 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">Pending Clearance Requests</h2>
                    {pendingCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold animate-pulse">
                        {pendingCount} Awaiting Review
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-muted-foreground border border-border text-[11px] font-medium">
                        0 Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Applicants requesting private access via /create-account gateway. Review credentials and whitelist with 1 click.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-background/80 border border-border rounded-lg p-0.5 flex text-xs">
                  <button
                    onClick={() => setRequestsFilter('pending')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      requestsFilter === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setRequestsFilter('all')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      requestsFilter === 'all'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All History ({accessRequests.length})
                  </button>
                </div>

                <button
                  onClick={loadRequests}
                  disabled={requestsLoading}
                  className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                  title="Refresh access requests"
                >
                  <RefreshCw className={`w-4 h-4 ${requestsLoading ? 'animate-spin text-primary' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted text-muted-foreground text-xs border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Applicant Identity</th>
                    <th className="px-6 py-3.5 font-medium">Organization / Affiliation</th>
                    <th className="px-6 py-3.5 font-medium">Verification & Links</th>
                    <th className="px-6 py-3.5 font-medium">Submitted</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium text-right">Clearance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requestsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
                        <span className="text-xs">Loading access clearance requests...</span>
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-xs">
                        {searchQuery
                          ? 'No access clearance requests match your search.'
                          : requestsFilter === 'pending'
                          ? 'No pending access clearance requests awaiting triage.'
                          : 'No clearance requests found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-muted/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-foreground font-semibold text-xs shrink-0">
                              {req.fullName ? req.fullName.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div>
                              <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                                <span>{req.fullName || 'Anonymous Operator'}</span>
                              </div>
                              <div className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                <span>{req.email}</span>
                              </div>
                              {req.discordId && (
                                <div className="text-[11px] text-[#5865F2] font-mono mt-0.5 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" />
                                  <span>ID: {req.discordId}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-foreground text-xs font-medium">{req.organization || 'Independent Researcher'}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            {req.website ? (
                              <a
                                href={req.website.startsWith('http') ? req.website : `https://${req.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1 font-mono"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Website</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">None</span>
                            )}

                            {req.purpose && (
                              <button
                                onClick={() => setPurposeModalRequest(req)}
                                className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Purpose</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                          {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : (req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent')}
                        </td>

                        <td className="px-6 py-4">
                          {req.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          ) : req.status === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                              Declined
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/25 font-semibold">
                              <Clock className="w-3 h-3 animate-spin" />
                              Pending Review
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {req.status === 'APPROVED' ? (
                            <span className="text-xs text-emerald-400/80 font-mono">Whitelisted &bull; Active</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveRequest(req)}
                                disabled={processingRequestId === req.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {processingRequestId === req.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Approve</span>
                              </button>

                              {req.status !== 'REJECTED' && (
                                <button
                                  onClick={() => handleRejectRequest(req)}
                                  disabled={processingRequestId === req.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Active Whitelisted Identities */}
        <TabsContent value="whitelisted" className="mt-0 space-y-4">
          <div className="bg-[#020202] border border-indigo-500/20 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-border bg-indigo-500/5 flex items-center justify-between">
              <h2 className="text-sm font-medium text-indigo-400">Active Whitelisted Identities (Google & Discord)</h2>
              <span className="text-xs text-muted-foreground font-mono">{filteredInvites.length} identities</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted text-muted-foreground text-xs border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Analyst Identity (Google / Discord)</th>
                    <th className="px-6 py-4 font-medium">Valid Until</th>
                    <th className="px-6 py-4 text-left font-medium text-muted-foreground">
                      <button onClick={() => setInfoModalOpen(true)} className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                        Restrictions
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInvites.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">
                        {searchQuery ? "No whitelisted identities match your search." : "No whitelisted identities active. Click \"Whitelist Analyst\" above to add."}
                      </td>
                    </tr>
                  ) : (
                    filteredInvites.map(inv => (
                      <tr key={inv.discord_id} className="hover:bg-muted transition-colors">
                        <td className="px-6 py-4">
                          <DiscordUserCell discordId={inv.discord_id} />
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {inv.valid_until ? new Date(inv.valid_until).toLocaleString() : "Never (Permanent)"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2 cursor-pointer" onClick={() => setInfoModalOpen(true)}>
                            {inv.role && inv.role !== 'User' && <span className="px-2 py-0.5 rounded bg-zinc-800 text-foreground text-[10px] uppercase border border-border font-bold tracking-wider">{inv.role}</span>}
                            {inv.super_admin && <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] uppercase border border-indigo-500/30 font-bold tracking-wider">God Mode</span>}
                            {inv.read_only && !inv.super_admin && <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] uppercase border border-rose-500/20 font-medium tracking-wide">Read-Only</span>}
                            {inv.disable_screenshot && !inv.super_admin && <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] uppercase border border-indigo-500/20 font-medium tracking-wide">No Screenshots</span>}
                            {inv.disable_copy && !inv.super_admin && <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] uppercase border border-rose-500/20 font-medium tracking-wide">No Copy</span>}
                            {inv.enforce_single_session && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] uppercase border border-amber-500/20 font-medium tracking-wide">Single Session</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {me.ownerDiscordId && inv.discord_id === me.ownerDiscordId ? (
                            <span className="text-xs text-muted-foreground italic mr-3 pr-2 border-r border-border/50">Owner (Protected)</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleEdit(inv)}
                                className="text-indigo-400 hover:text-foreground hover:bg-indigo-500/20 px-3 py-1.5 rounded transition-all text-xs font-medium border border-transparent hover:border-indigo-500/30 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleRevoke(inv.discord_id)}
                                className="text-rose-400 hover:text-foreground hover:bg-rose-500/20 px-3 py-1.5 rounded transition-all text-xs font-medium border border-transparent hover:border-rose-500/30 cursor-pointer"
                              >
                                Revoke Access
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: Registered Analysts */}
        <TabsContent value="analysts" className="mt-0 space-y-4">
          <div className="bg-[#020202] border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-border bg-background/50 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Registered Analysts</h2>
              <span className="text-xs text-muted-foreground font-mono">{filteredUsers.length} profiles</span>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-muted text-muted-foreground text-xs border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium">Analyst Name</th>
                      <th className="px-6 py-4 font-medium">Clearance Level</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Cases Resolved</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                          {searchQuery ? "No registered analysts match your search." : "No analysts found in the registry."}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-muted transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-foreground font-medium shrink-0">
                                {u.full_name?.charAt(0).toUpperCase() || "O"}
                              </div>
                              <div>
                                <div className="text-foreground font-medium">{u.full_name || "Unknown Operator"}</div>
                                <div className="text-muted-foreground text-xs font-mono mt-0.5">ID: {u.id.substring(0,8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border ${
                              u.clearance_level === 'Level 5' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              u.clearance_level === 'Level 4' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              u.clearance_level === 'Level 3' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              'bg-zinc-800 text-muted-foreground border-border'
                            }`}>
                              <Lock className="w-3 h-3" />
                              {u.clearance_level || "Level 1"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-foreground">{u.role || "Analyst"}</td>
                          <td className="px-6 py-4 font-mono text-muted-foreground">{u.metrics_cases_resolved || 0}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setShowInviteModal(false); setEditMode(false); }}></div>
          <div className="bg-muted border border-border rounded-xl shadow-2xl w-full max-w-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0 bg-background/40">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
                {editMode ? "Edit Analyst Permissions" : "Whitelist Analyst Identity"}
              </h2>
              <button onClick={() => { setShowInviteModal(false); setEditMode(false); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Navigation & Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <Tabs defaultValue="general" className="w-full flex flex-col h-full">
                <TabsList className="flex w-full bg-background/50 border border-border rounded-lg p-1 mb-8">
                  <TabsTrigger value="general" className="flex-1 rounded-md py-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 data-[state=active]:border data-[state=active]:border-indigo-500/30 transition-all text-muted-foreground">
                    General Info
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="flex-1 rounded-md py-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 data-[state=active]:border data-[state=active]:border-indigo-500/30 transition-all text-muted-foreground">
                    Access & Permissions
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex-1 rounded-md py-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 data-[state=active]:border data-[state=active]:border-indigo-500/30 transition-all text-muted-foreground">
                    Security Policies
                  </TabsTrigger>
                </TabsList>
                
                {/* General Tab */}
                <TabsContent value="general" className="space-y-6">
                  {/* Identity Type Switcher */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Identity Provider</label>
                    <div className="grid grid-cols-2 gap-2 bg-background/60 p-1 rounded-lg border border-border">
                      <button
                        type="button"
                        disabled={editMode}
                        onClick={() => { setIdentityType('email'); setInviteId(''); }}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                          identityType === 'email'
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        Google / Email Account
                      </button>
                      <button
                        type="button"
                        disabled={editMode}
                        onClick={() => { setIdentityType('discord'); setInviteId(''); }}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                          identityType === 'discord'
                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Discord User ID
                      </button>
                    </div>
                  </div>

                  {identityType === 'email' ? (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center justify-between">
                        <span>Google / Email Address</span>
                        <span className="text-xs text-muted-foreground">Authorized for OAuth Login</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="email" 
                          value={inviteId}
                          disabled={editMode}
                          onChange={(e) => setInviteId(e.target.value.trim().toLowerCase())}
                          placeholder="analyst@example.com"
                          className="w-full bg-background border border-border rounded-md py-2 pl-9 pr-3 text-foreground focus:outline-none focus:border-indigo-500/50 font-mono text-sm disabled:opacity-50"
                          required
                        />
                      </div>
                      
                      <div className="mt-3 p-3 rounded-md border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold text-blue-400">Google OAuth Whitelist</div>
                          <div className="text-muted-foreground mt-0.5 leading-relaxed">
                            When an analyst authenticates with Google using this email address, ThreatLens will immediately authorize access and enforce the role & RBAC permissions configured below.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Discord User ID</label>
                      <input 
                        type="text" 
                        value={inviteId}
                        disabled={editMode}
                        onChange={(e) => setInviteId(e.target.value.trim())}
                        placeholder="e.g. 123456789012345678"
                        className="w-full bg-background border border-border rounded-md py-2 px-3 text-foreground focus:outline-none focus:border-indigo-500/50 font-mono text-sm disabled:opacity-50"
                        required
                      />
                      
                      {/* Live Preview Area */}
                      <div className="mt-3 min-h-[60px] flex items-center p-3 rounded-md border border-white/5 bg-white/[0.02]">
                        {previewLoading ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Fetching Discord user...
                          </div>
                        ) : previewError ? (
                          <div className="text-rose-400 text-sm">{previewError}</div>
                        ) : discordPreview ? (
                          <div className="flex items-center gap-3">
                            <img 
                              src={discordPreview.avatar ? `https://cdn.discordapp.com/avatars/${discordPreview.id}/${discordPreview.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                              alt="Avatar" 
                              className="w-10 h-10 rounded-full border border-indigo-500/30"
                            />
                            <div>
                              <div className="text-sm font-medium text-foreground">{discordPreview.global_name || discordPreview.username}</div>
                              <div className="text-xs text-muted-foreground">@{discordPreview.username}</div>
                            </div>
                            <div className="ml-auto text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                              Verified Found
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Enter a valid 17-19 digit Discord ID to verify the analyst.</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Access Duration</label>
                    <div className="relative">
                      <select 
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                        className="w-full bg-card border border-border rounded-md h-11 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer hover:border-zinc-700 transition-colors"
                      >
                        <option value="0">Permanent (Never Expires) — Full Time Analyst</option>
                        <option value="1">24 Hours — Temporary Audit/Review</option>
                        <option value="7">7 Days — Short Term Contract</option>
                        <option value="30">30 Days — Standard Probation</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Access will automatically be revoked after this period.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Role Assignment</label>
                    <div className="relative">
                      <select 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-card border border-border rounded-md h-11 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer hover:border-zinc-700 transition-colors"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Moderator">Moderator</option>
                        <option value="User">User</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Determines their primary preset capability level across the platform.</p>
                  </div>
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="space-y-8 mt-4">
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-foreground">Page Access</h3>
                      <p className="text-xs text-muted-foreground">Select which dashboard pages this analyst is allowed to view.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { path: '/dashboard', label: 'Executive Summary', desc: 'High-level metrics and system overviews.' },
                        { path: '/dashboard/cases', label: 'Active Cases', desc: 'View and manage ongoing incident response cases.' },
                        { path: '/dashboard/feeds', label: 'Threat Feeds', desc: 'Live incoming threat intelligence feeds.' },
                        { path: '/dashboard/iocs', label: 'IOC Database', desc: 'Global database of Indicators of Compromise.' },
                        { path: '/dashboard/threatlens', label: 'ThreatLens Scanner', desc: 'Deep-dive AI analysis tool for specific threats.' }
                      ].map(page => (
                        <label key={page.path} className="flex items-start gap-3 p-4 rounded-lg border border-border/80 bg-muted/20 cursor-pointer hover:bg-zinc-800/40 hover:border-zinc-700 transition-all group">
                          <div className="relative flex items-center mt-0.5">
                            <input 
                              type="checkbox" 
                              checked={allowedPages.includes(page.path)}
                              onChange={() => togglePage(page.path)}
                              className="peer h-5 w-5 shrink-0 rounded-sm border border-zinc-600 bg-transparent focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-zinc-950 checked:bg-indigo-600 checked:border-indigo-600 appearance-none cursor-pointer transition-all" 
                            />
                            <svg className="absolute w-5 h-5 p-0.5 text-foreground pointer-events-none hidden peer-checked:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">{page.label}</span>
                            <span className="text-xs text-muted-foreground mt-1 leading-relaxed">{page.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Feature Permissions</h3>
                        <p className="text-xs text-muted-foreground">Specific destructive or sensitive actions they can perform.</p>
                      </div>
                      <label className="flex items-center gap-3 p-2 px-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 cursor-pointer hover:bg-indigo-500/20 transition-all">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={superAdmin}
                            onChange={(e) => setSuperAdmin(e.target.checked)}
                            className="peer h-4 w-4 shrink-0 rounded border border-indigo-500/50 bg-transparent focus:ring-2 focus:ring-indigo-500/50 checked:bg-indigo-500 checked:border-indigo-500 appearance-none cursor-pointer transition-all" 
                          />
                          <svg className="absolute w-4 h-4 p-0.5 text-foreground pointer-events-none hidden peer-checked:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Grant Super Admin (Bypass All)</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: 'edit_case', label: 'Modify Case Data', desc: 'Allows editing and closing active investigation cases.' },
                        { id: 'add_ioc', label: 'Add IOCs', desc: 'Allows injecting new IOCs into the global database.' },
                        { id: 'delete_ioc', label: 'Delete IOCs', desc: 'Allows permanently removing existing IOCs.' },
                        { id: 'run_scans', label: 'Execute Threat Scans', desc: 'Allows consuming credits to run AI threat scans.' }
                      ].map(action => (
                        <label key={action.id} className="flex items-start gap-3 p-4 rounded-lg border border-border/80 bg-muted/20 cursor-pointer hover:bg-zinc-800/40 hover:border-zinc-700 transition-all group">
                          <div className="relative flex items-center mt-0.5">
                            <input 
                              type="checkbox" 
                              checked={allowedActions.includes(action.id)}
                              onChange={() => toggleAction(action.id)}
                              className="peer h-5 w-5 shrink-0 rounded-sm border border-zinc-600 bg-transparent focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-zinc-950 checked:bg-indigo-600 checked:border-indigo-600 appearance-none cursor-pointer transition-all" 
                            />
                            <svg className="absolute w-5 h-5 p-0.5 text-foreground pointer-events-none hidden peer-checked:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                            <span className="text-xs text-muted-foreground mt-1 leading-relaxed">{action.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6 mt-4">
                  <div className="mb-4 border-b border-rose-500/20 pb-4">
                    <h3 className="text-base font-medium text-rose-400">Strict Security Policies</h3>
                    <p className="text-sm text-muted-foreground mt-1">These settings override all standard platform defaults for this specific user.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-5 rounded-lg border border-amber-500/20 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors">
                      <div className="relative flex items-center mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={singleSession}
                          onChange={(e) => setSingleSession(e.target.checked)}
                          className="peer h-5 w-5 shrink-0 rounded-sm border border-amber-500/50 bg-transparent focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-1 focus:ring-offset-zinc-950 checked:bg-amber-500 checked:border-amber-500 appearance-none cursor-pointer transition-all" 
                        />
                        <svg className="absolute w-5 h-5 p-0.5 text-black pointer-events-none hidden peer-checked:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-amber-400">Enforce Single Session Limit</span>
                        <span className="text-xs text-amber-500/70 mt-1.5 leading-relaxed">If enabled, the user will automatically be logged out of all other devices when they log in. Prevents credential sharing.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-5 rounded-lg border border-rose-500/20 bg-rose-500/5 cursor-pointer hover:bg-rose-500/10 transition-colors">
                      <div className="relative flex items-center mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={readOnly}
                          onChange={(e) => setReadOnly(e.target.checked)}
                          className="peer h-5 w-5 shrink-0 rounded-sm border border-rose-500/50 bg-transparent focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-1 focus:ring-offset-zinc-950 checked:bg-rose-500 checked:border-rose-500 appearance-none cursor-pointer transition-all" 
                        />
                        <svg className="absolute w-5 h-5 p-0.5 text-foreground pointer-events-none hidden peer-checked:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-rose-400">Global Read-Only Mode</span>
                        <span className="text-xs text-rose-500/70 mt-1.5 leading-relaxed">If enabled, the user cannot edit or modify any data, and will see a permanent Read-Only banner.</span>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-4 p-5 rounded-lg border border-rose-500/20 bg-rose-500/5 cursor-pointer hover:bg-rose-500/10 transition-colors">
                      <div className="relative flex items-center mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={disableCopy}
                          onChange={(e) => setDisableCopy(e.target.checked)}
                          className="peer h-5 w-5 shrink-0 rounded-sm border border-rose-500/50 bg-transparent focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-1 focus:ring-offset-zinc-950 checked:bg-rose-500 checked:border-rose-500 appearance-none cursor-pointer transition-all" 
                        />
                        <svg className="absolute w-5 h-5 p-0.5 text-foreground pointer-events-none hidden peer-checked:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-rose-400">Disable Data Exfiltration (Copy & Paste)</span>
                        <span className="text-xs text-rose-500/70 mt-1.5 leading-relaxed">If enabled, standard text selection, highlighting, right-clicking, and keyboard shortcuts (Ctrl+C) will be entirely blocked for this user globally.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 cursor-pointer hover:bg-indigo-500/10 transition-colors">
                      <div className="relative flex items-center mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={disableScreenshot}
                          onChange={(e) => setDisableScreenshot(e.target.checked)}
                          className="peer h-5 w-5 shrink-0 rounded-sm border border-indigo-500/50 bg-transparent focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-zinc-950 checked:bg-indigo-500 checked:border-indigo-500 appearance-none cursor-pointer transition-all" 
                        />
                        <svg className="absolute w-5 h-5 p-0.5 text-foreground pointer-events-none hidden peer-checked:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-indigo-400">Block OS Screenshots</span>
                        <span className="text-xs text-indigo-500/70 mt-1.5 leading-relaxed">If enabled, the app will attempt to block screenshots taken via system hotkeys (e.g. PrintScreen, Cmd+Shift+3) by blanking the screen with a warning.</span>
                      </div>
                    </label>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="p-6 border-t border-border shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4 bg-background/50 rounded-b-xl">
              {submitError ? (
                <div className="text-sm text-rose-400 font-medium">
                  Error: {submitError}
                </div>
              ) : (
                <div />
              )}
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  type="button" 
                  onClick={() => { setShowInviteModal(false); setEditMode(false); }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleInvite}
                  disabled={submitting || !inviteId}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {editMode ? "Save Changes" : "Authorize Discord ID"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
