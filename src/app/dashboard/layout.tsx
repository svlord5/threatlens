"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Target, Briefcase, LogOut, Menu, Search, Command, X, Activity, Terminal, Shield, BookOpen, Server, Cpu, Waypoints, Layers, Mail, Globe, Link2, Smartphone } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useMe, fetchMe } from "@/hooks/use-me";
import { UserAvatar } from "@/components/UserAvatar";
import { useRouter } from "next/navigation";
import { CmdKPalette } from "@/components/layout/CmdKPalette";
import React, { createContext, useContext } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

// IAM Context for child pages to consume
export const IAMContext = createContext<any>(null);

export function useIAM() {
  return useContext(IAMContext);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const me = useMe();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [iamPolicy, setIamPolicy] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showScreenshotWarning, setShowScreenshotWarning] = useState(false);

  useEffect(() => {
    let copyListener: (e: ClipboardEvent) => void;

    async function checkAuthAndIAM() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/");
        return;
      }
      setUser(session.user);

      // Check IAM Policy for users (supporting Discord IDs and Google Emails)
      const discordId = session.user.identities?.find((i: any) => i.provider === 'discord')?.id 
                     || (session.user.app_metadata?.provider === 'discord' ? session.user.user_metadata?.provider_id : null);
      const userEmail = session.user.email?.toLowerCase().trim();
      const rawSub = session.user.user_metadata?.sub;
      const providerId = discordId || userEmail || rawSub;

      // Secure bypass using strict ID matching via environment variables
      const isSvLord = (await fetchMe()).isAdmin; // decided server-side
                      
      if (providerId) {
        const orConditions: string[] = [];
        if (discordId) orConditions.push(`discord_id.eq.${discordId}`);
        if (userEmail) orConditions.push(`discord_id.eq.${userEmail}`);
        if (rawSub && rawSub !== discordId && rawSub !== userEmail) orConditions.push(`discord_id.eq.${rawSub}`);

        let policy = null;
        if (orConditions.length > 0) {
          const { data } = await supabase.from('iam_discord_invites').select('*').or(orConditions.join(',')).maybeSingle();
          policy = data;
        }

        if (policy) {
          setIamPolicy(policy);

          // If super admin, bypass all security enforcements
          if (isSvLord || policy.super_admin) {
             setCheckingAuth(false);
             return;
          }

          // 1. Time-Bound Access Enforcement
          if (policy.valid_until && new Date(policy.valid_until) < new Date()) {
            console.warn("[RBAC] Session Expired");
            toast.error(`Session expired. Your Discord ID is: ${providerId}`, { duration: 10000 });
            if ((window as any).logDiscordViolation) {
              (window as any).logDiscordViolation("SESSION_EXPIRED", "Analyst's pre-defined session time has passed.");
            }
            await supabase.auth.signOut();
            router.push("/");
            return;
          }

          // 2. Single-Session Enforcement (Local Check)
          if (policy.enforce_single_session) {
            let localToken = localStorage.getItem("ioc_session_token");
            if (!localToken) {
              localToken = crypto.randomUUID();
              localStorage.setItem("ioc_session_token", localToken);
              await supabase.from('iam_discord_invites').update({ current_session_token: localToken }).eq('discord_id', providerId);
            } else {
              if (policy.current_session_token && policy.current_session_token !== localToken) {
                console.warn("[RBAC] Session Conflict Detected");
                toast.error("Session terminated: You logged in from another device.", { duration: 10000 });
                if ((window as any).logDiscordViolation) {
                  (window as any).logDiscordViolation("SESSION_CONFLICT", "Analyst's session terminated due to concurrent login from another device.");
                }
                localStorage.removeItem("ioc_session_token");
                await supabase.auth.signOut();
                router.push("/");
                return;
              }
              if (!policy.current_session_token) {
                await supabase.from('iam_discord_invites').update({ current_session_token: localToken }).eq('discord_id', providerId);
              }
            }
          }

          // 3. Anti-Copy Enforcement
          if (policy.disable_copy) {
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            copyListener = (e: ClipboardEvent) => {
              e.preventDefault();
              console.warn("[RBAC] Data exfiltration attempt intercepted.");
              toast.warning("SECURITY POLICY: Data exfiltration (copy/paste) is strictly disabled for your clearance level.");
              if ((window as any).logDiscordViolation) {
                (window as any).logDiscordViolation("COPY_ATTEMPT", "Analyst attempted to use Copy/Paste functionality.");
              }
            };
            document.addEventListener('copy', copyListener);
          }
        }
      }

      setCheckingAuth(false);
    }
    
    checkAuthAndIAM();

    return () => {
      if (copyListener) document.removeEventListener('copy', copyListener);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [supabase, router]);

  // Real-time Single Session Enforcement
  useEffect(() => {
    if (!iamPolicy || !iamPolicy.enforce_single_session || !user) return;
    
    const providerId = user?.identities?.find((i: any) => i.provider === 'discord')?.id 
                    || user?.email
                    || user?.user_metadata?.provider_id 
                    || user?.user_metadata?.sub;
                    
    const isSvLord = me.isAdmin;
    if (isSvLord || iamPolicy.super_admin) return; // Super Admins bypass this completely

    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'iam_discord_invites', filter: `discord_id=eq.${providerId}` },
        (payload: any) => {
          const newPolicy = payload.new;
          if (newPolicy.enforce_single_session && newPolicy.current_session_token) {
             const localToken = localStorage.getItem("ioc_session_token");
             if (localToken && newPolicy.current_session_token !== localToken) {
                console.warn("[RBAC] Remote Session Conflict Detected");
                toast.error("Session terminated: You logged in from another device.", { duration: 10000 });
                localStorage.removeItem("ioc_session_token");
                supabase.auth.signOut().then(() => router.push("/"));
             }
          }
          setIamPolicy(newPolicy);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [iamPolicy?.enforce_single_session, iamPolicy?.super_admin, user, supabase, router]);

  // Anti-Screenshot Enforcement
  useEffect(() => {
    if (!iamPolicy || !iamPolicy.disable_screenshot) return;

    let warningTimeout: NodeJS.Timeout;

    const triggerWarning = () => {
      console.warn("[RBAC] OS Screenshot Attempt Detected");
      if ((window as any).logDiscordViolation) {
        (window as any).logDiscordViolation("SCREENSHOT_BLOCKED", "Analyst triggered system hotkeys for OS screenshot.");
      }
      // Instantly blackout the screen for the ones we CAN detect!
      document.documentElement.style.filter = 'brightness(0) contrast(0)';
      setShowScreenshotWarning(true);
      
      clearTimeout(warningTimeout);
      warningTimeout = setTimeout(() => {
        setShowScreenshotWarning(false);
        document.documentElement.style.filter = '';
      }, 5000); // Overlay stays for 5 seconds
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") triggerWarning();
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5" || e.key === "s" || e.key === "S")) triggerWarning();
    };

    const handleWindowBlur = () => {
      // We only trigger if Meta and Shift are held down during blur (indicates Cmd+Shift+4)
      // Otherwise we ignore it to allow normal tab switching.
      // Note: Safari OS-level screenshot tool often bypasses this entirely.
    };

    const handleWindowFocus = () => {
      document.documentElement.style.filter = '';
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(warningTimeout);
      document.documentElement.style.filter = '';
    };
  }, [iamPolicy]);

  useEffect(() => {
      if (!user) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- resolves the sign-in state once on mount
        setCheckingAuth(false);
        return;
      }

      const logDiscordViolation = async (action: string, metadata?: string) => {
        try {
          await fetch('/api/discord/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, user, metadata })
          });
        } catch (err) {
          console.error("Failed to log violation to Discord:", err);
        }
      };

      // Ensure the logDiscordViolation helper is globally available via context if needed, or attach it to window.
      (window as any).logDiscordViolation = logDiscordViolation;
  }, [user]);

  const providerId = user?.identities?.find((i: any) => i.provider === 'discord')?.id 
                  || user?.user_metadata?.provider_id 
                  || user?.user_metadata?.sub;
  const isSvLord = me.isAdmin;

  useEffect(() => {
    // 3. Page Level RBAC Enforcement
    if (isSvLord || iamPolicy?.super_admin) return; // Bypass for super admins

    if (!checkingAuth && iamPolicy && Array.isArray(iamPolicy.allowed_pages)) {
      // Enforce the whitelist if it is defined (even if empty, which means no subpage access)
      const allowed = iamPolicy.allowed_pages.some((page: string) => {
        if (page === "/dashboard") return pathname === "/dashboard";
        return pathname === page || pathname.startsWith(page + '/');
      });
      
      if (!allowed && pathname !== "/dashboard" && pathname !== "/dashboard/profile" && pathname !== "/dashboard/account") {
        console.warn(`[RBAC] Unauthorized access blocked: ${pathname}`);
        toast.error("SECURITY VIOLATION: You do not have clearance to view this page.");
        if ((window as any).logDiscordViolation) {
          (window as any).logDiscordViolation("UNAUTHORIZED_ACCESS", `Analyst attempted to visit restricted path: ${pathname}`);
        }
        router.push("/dashboard");
      } else {
        // Log authorized page visits
        if ((window as any).logDiscordViolation && !checkingAuth) {
           (window as any).logDiscordViolation("PAGE_VISIT", `Analyst navigated to: ${pathname}`);
        }
      }
    }
  }, [pathname, checkingAuth, iamPolicy, router, user]);

  const navigationCategories = [
    {
      category: "Intelligence",
      items: [
        { name: "Executive Summary", href: "/dashboard", icon: Command },
        { name: "Active Cases", href: "/dashboard/cases", icon: Activity },
        { name: "Threat Feeds", href: "/dashboard/feeds", icon: ShieldAlert },
        { name: "IOC Database", href: "/dashboard/iocs", icon: Target },
        { name: "ThreatLens Search", href: "/dashboard/threatlens", icon: Search },
        { name: "OSINT Engine", href: "/dashboard/osint", icon: Globe },
      ]
    },
    {
      category: "Forensics & Response",
      items: [
        { name: "Forensics Library", href: "/dashboard/forensics", icon: Briefcase },
        { name: "App Malware Hunter", href: "/dashboard/forensics/app", icon: Smartphone },
        { name: "SIEM & Endpoints", href: "/dashboard/siem", icon: Server },
        { name: "Log Hunter", href: "/dashboard/forensics/logs", icon: Search },
        { name: "Email Forensics", href: "/dashboard/forensics/email", icon: Mail },
        { name: "Website Forensics", href: "/dashboard/forensics/website", icon: Globe },
      ]
    },
    {
      category: "Automation & Security",
      items: [
        { name: "Integrations Hub", href: "/dashboard/integrations", icon: Link2 },
        { name: "Automation Rules", href: "/dashboard/automation", icon: Cpu },
        { name: "Playbook Library", href: "/dashboard/automation/playbooks/list", icon: Layers },
        { name: "Playbook Builder", href: "/dashboard/automation/playbooks", icon: Waypoints },
        { name: "API Security", href: "/dashboard/api-security", icon: Shield },
      ]
    },
    {
      category: "Resources",
      items: [
        { name: "CTF Toolkit", href: "/dashboard/ctf", icon: Terminal },
        { name: "ThreatLens Blog", href: "/blog", icon: BookOpen },
        { name: "Platform Guide", href: "/dashboard/guide", icon: BookOpen },
      ]
    }
  ];

  const handleLogout = async () => {
    if ((window as any).logDiscordViolation) {
      await (window as any).logDiscordViolation("LOGOUT", "Analyst deliberately signed out.");
    }
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="h-screen bg-muted/30 text-foreground font-sans selection:bg-zinc-800 flex p-0 md:p-3 gap-0 md:gap-3 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-[72px]' : 'w-[260px]'} bg-card rounded-2xl border border-border shadow-sm overflow-hidden shrink-0 relative z-30 transition-all duration-300`}>
        
        {/* Brand Area */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6'} border-b border-border shrink-0`}>
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/spy.png" alt="ThreatLens Logo" className="h-7 w-auto object-contain" />
            {!isCollapsed && <span className="font-semibold tracking-tight text-sm text-foreground">ThreatLens</span>}
          </Link>
        </div>
        
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navigationCategories.map((group) => (
            <div key={group.category} className="mb-6">
              {!isCollapsed && (
                <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                  {group.category}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  // RBAC Check for sidebar visibility
                  if (iamPolicy && Array.isArray(iamPolicy.allowed_pages) && !iamPolicy.super_admin && !isSvLord) {
                     const allowed = iamPolicy.allowed_pages.some((page: string) => {
                       if (page === "/dashboard") return item.href === "/dashboard";
                       return item.href === page || item.href.startsWith(page + '/');
                     });
                     if (item.href !== "/dashboard" && item.href !== "/blog" && !allowed) {
                        return null; // Hide unauthorized links
                     }
                  }

                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                        isActive 
                          ? "bg-accent text-accent-foreground font-medium shadow-sm border border-border/50" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-0.5"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-muted-foreground"}`} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {(!iamPolicy || iamPolicy.super_admin || isSvLord || (Array.isArray(iamPolicy.allowed_pages) && iamPolicy.allowed_pages.some((page:string) => {
             if (page === "/dashboard") return false;
             return "/dashboard/admin/users" === page || "/dashboard/admin/users".startsWith(page + '/');
          }))) && (
            <>
              {!isCollapsed && (
                <div className="px-3 mt-8 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Administration
                </div>
              )}
              <Link
                href="/dashboard/admin/users"
                title={isCollapsed ? "Identity & Access" : undefined}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                  pathname.startsWith("/dashboard/admin/users")
                    ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-medium border border-indigo-500/20" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-0.5"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 shrink-0 ${pathname.startsWith("/dashboard/admin/users") ? "text-indigo-400" : "text-muted-foreground group-hover:text-muted-foreground"}`}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {!isCollapsed && <span>Identity & Access</span>}
              </Link>
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className={`p-4 border-t border-border shrink-0 space-y-3 mt-auto bg-card z-10 ${isCollapsed ? 'px-2' : ''}`}>
          
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'} py-1 mb-2`}>
            <UserAvatar user={user} />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.custom_claims?.global_name || "Operator"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {user?.email || "Discord User"}
                </span>
              </div>
            )}
          </div>

          <button 
            onClick={handleLogout}
            title={isCollapsed ? "Sign out" : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} w-full py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-all border border-transparent hover:border-border`}
          >
            <LogOut className="w-4 h-4 shrink-0 text-muted-foreground" />
            {!isCollapsed && <span>Sign out</span>}
          </button>
          
          {!isCollapsed && (
            <div className="px-3 text-[11px] text-muted-foreground flex justify-between items-center bg-muted py-2 rounded-md">
              <span>Built by</span>
              <a href="https://surajv5.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors font-medium text-foreground">
                <img src="/api/avatar?u=https%3A%2F%2Fsurajv5.in%2Ficons%2FIcon.png" alt="Suraj" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                Suraj
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-card rounded-none md:rounded-2xl border-0 md:border border-border shadow-none md:shadow-sm overflow-hidden relative">
        
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 sticky top-0 z-20 shrink-0">
          
          {/* Desktop Menu Toggle */}
          <div className="hidden md:flex items-center">
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors mr-3 cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center md:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Open navigation">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <input
                type="text"
                readOnly
                onClick={() => window.dispatchEvent(new Event("open-cmdk"))}
                placeholder="Search indicators, cases, feeds..."
                className="w-full bg-muted border border-border rounded-md py-1.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border focus:ring-1 focus:ring-white/20 transition-all shadow-sm cursor-text"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-block border border-border bg-muted rounded px-1.5 text-[10px] font-mono text-muted-foreground">⌘</kbd>
                <kbd className="hidden sm:inline-block border border-border bg-muted rounded px-1.5 text-[10px] font-mono text-muted-foreground">K</kbd>
              </div>
            </div>
          </div>

          {/* IAM Banners (Centered in Topbar) */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-4">
            {iamPolicy?.read_only && !(isSvLord || iamPolicy?.super_admin) && (
              <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Read-Only Mode Active</span>
              </div>
            )}
            
            {(isSvLord || iamPolicy?.super_admin) && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Super Admin Active: All Restrictions Bypassed</span>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto relative">
            {/* Mobile Search Button to launch CmdK */}
            <button
              onClick={() => window.dispatchEvent(new Event("open-cmdk"))}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md"
              title="Search (Cmd+K)"
            >
              <Search className="w-5 h-5" />
            </button>

            <ThemeToggle />
            
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="shrink-0 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold cursor-pointer hover:bg-indigo-500/20 transition-all ring-2 ring-transparent hover:ring-indigo-500/10 overflow-hidden"
              style={{ width: 36, height: 36 }}
            >
              <UserAvatar user={user} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                <div className="absolute top-14 right-0 mt-1 w-64 max-w-[calc(100vw-1.5rem)] bg-muted border border-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-5 py-4 border-b border-border mb-2">
                    <p className="text-base font-medium text-foreground truncate">{user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.custom_claims?.global_name || "Operator"}</p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{user?.email || "Discord User"}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-2 select-all">UUID: {user?.id}</p>
                    {iamPolicy && (
                      <div className="mt-2 text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 inline-block">
                        Managed by IAM Policy
                      </div>
                    )}
                  </div>
                  <Link href="/dashboard/account" onClick={() => setUserMenuOpen(false)} className="block px-5 py-3 text-[15px] text-foreground hover:bg-muted hover:text-foreground transition-colors">
                    Account
                  </Link>
                  <div className="border-t border-border my-2"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-5 py-3 text-[15px] font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-background/50">
          
          <div className="flex-1 p-3 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto h-full">
              <IAMContext.Provider value={iamPolicy}>
                {children}
              </IAMContext.Provider>
            </div>
          </div>
        </main>
      </div>

      {/* Screenshot Warning Overlay */}
      {showScreenshotWarning && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-75">
          <ShieldAlert className="w-24 h-24 text-rose-600 mb-6 animate-pulse" />
          <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">SECURITY VIOLATION</h1>
          <p className="text-lg text-rose-400 max-w-xl">
            Taking screenshots or capturing data is strictly prohibited by your IAM clearance level. This attempt has been blocked.
          </p>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="w-[280px] bg-card/95 backdrop-blur-xl border-r border-border flex flex-col relative animate-in slide-in-from-left duration-300 shadow-2xl">
            
            <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <img src="/spy.png" alt="ThreatLens Logo" className="h-7 w-auto object-contain" />
                <span className="font-semibold tracking-tight text-sm">ThreatLens</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 -mr-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-border shrink-0 space-y-3">
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground truncate">{user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.custom_claims?.global_name || "Operator"}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email || "Discord User"}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1.5 select-all">UUID: {user?.id}</p>
                {iamPolicy && (
                  <div className="mt-2 text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 inline-block">
                    Managed by IAM
                  </div>
                )}
              </div>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-all border border-transparent hover:border-border"
              >
                <LogOut className="w-4 h-4 text-muted-foreground" />
                <span>Sign out</span>
              </button>
              
              <div className="px-3 text-[11px] text-muted-foreground flex justify-between items-center bg-muted py-2 rounded-md">
                <span>Built by</span>
                <a href="https://surajv5.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors font-medium text-foreground">
                  <img src="/api/avatar?u=https%3A%2F%2Fsurajv5.in%2Ficons%2FIcon.png" alt="Suraj" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                  Suraj Vishwanath
                </a>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navigationCategories.map((group) => (
                <div key={group.category} className="mb-6">
                  <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                    {group.category}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      if (iamPolicy && Array.isArray(iamPolicy.allowed_pages) && !iamPolicy.super_admin && !isSvLord) {
                        const allowed = iamPolicy.allowed_pages.some((page: string) => {
                          if (page === "/dashboard") return item.href === "/dashboard";
                          return item.href === page || item.href.startsWith(page + '/');
                        });
                        if (item.href !== "/dashboard" && item.href !== "/blog" && !allowed) return null;
                      }
                      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <item.icon className={`w-4 h-4 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {(!iamPolicy || iamPolicy.super_admin || isSvLord || (Array.isArray(iamPolicy.allowed_pages) && iamPolicy.allowed_pages.some((page:string) => {
                 if (page === "/dashboard") return false;
                 return "/dashboard/admin/users" === page || "/dashboard/admin/users".startsWith(page + '/');
              }))) && (
                <>
                  <div className="px-3 mt-8 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Administration
                  </div>
                  <Link
                    href="/dashboard/admin/users"
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 group ${
                      pathname.startsWith("/dashboard/admin/users")
                        ? "bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${pathname.startsWith("/dashboard/admin/users") ? "text-indigo-400" : "text-muted-foreground group-hover:text-muted-foreground"}`}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>Identity & Access</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Global Command Palette */}
      <CmdKPalette iamPolicy={iamPolicy} isSvLord={isSvLord} />
    </div>
  );
}
