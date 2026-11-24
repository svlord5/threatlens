"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase user/identity and row shapes are loosely typed */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  BadgeCheck,
  Check,
  Copy,
  Database,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  MailWarning,
  MapPin,
  Pencil,
  Radio,
  Save,
  Search,
  Shield,
  Unlink,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useMe } from "@/hooks/use-me";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CaseRow {
  id: string;
  title: string;
  severity: string | null;
  status: string | null;
  created_at: string;
}

const SEVERITY: Record<string, string> = {
  Critical: "border-red-500/30 bg-red-500/10 text-red-500",
  High: "border-orange-500/30 bg-orange-500/10 text-orange-500",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  Low: "border-sky-500/30 bg-sky-500/10 text-sky-500",
};

const OSINT_KEYS = [
  { storage: "OTX_API_KEY", label: "AlienVault OTX", hint: "Hash and domain reputation" },
  { storage: "HIBP_API_KEY", label: "Have I Been Pwned", hint: "Email breach lookups" },
  { storage: "ABSTRACT_API_KEY", label: "Abstract API", hint: "Phone and IP intelligence" },
  { storage: "NUMVERIFY_API_KEY", label: "Numverify", hint: "Phone number validation" },
  { storage: "TRUECALLER_API_KEY", label: "Truecaller Business", hint: "Caller identification" },
  { storage: "NPCI_API_KEY", label: "NPCI", hint: "UPI lookups" },
] as const;

/** Browser and OS from the user agent: the only "device" information the browser actually has. */
function describeBrowser(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  const browser = ua.includes("Edg/") ? "Edge" : ua.includes("Firefox") ? "Firefox" : ua.includes("Chrome") ? "Chrome" : ua.includes("Safari") ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : ua.includes("Android") ? "Android" : ua.includes("Win") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : "Unknown OS";
  return `${browser} on ${os}`;
}

const providerLabel = (p: string) => (p === "google" ? "Google" : p === "discord" ? "Discord" : p === "email" ? "Email and password" : p);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default function AccountPage() {
  const supabase = useMemo(() => createClient(), []);
  const me = useMe();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [counts, setCounts] = useState({ iocs: 0, feeds: 0, playbooks: 0 });
  const [tab, setTab] = useState("overview");
  const [caseSearch, setCaseSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSpecs, setEditSpecs] = useState("");

  const [linking, setLinking] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Client-only values: the page renders a skeleton first, so reading them lazily is safe.
  const [keys, setKeys] = useState<Record<string, string>>(() => {
    const stored: Record<string, string> = {};
    if (typeof window !== "undefined") for (const k of OSINT_KEYS) stored[k.storage] = localStorage.getItem(k.storage) || "";
    return stored;
  });
  const [browser] = useState(describeBrowser);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("linked")) {
      toast.success(`Connected your ${params.get("linked")} account.`);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("error")) {
      toast.error(`Authentication error: ${params.get("error_description") || params.get("error")}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!alive) return;
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      const [profileRes, caseRes, iocRes, feedRes, pbRes, auditRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
        supabase.from("case").select("id, title, severity, status, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("ioc").select("*", { count: "exact", head: true }),
        supabase.from("feed").select("*", { count: "exact", head: true }),
        supabase.from("soar_playbooks").select("*", { count: "exact", head: true }),
        supabase.from("audit_logs").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(25),
      ]);
      if (!alive) return;
      setProfile(profileRes.data ?? null);
      setCases((caseRes.data ?? []) as CaseRow[]);
      setCounts({ iocs: iocRes.count ?? 0, feeds: feedRes.count ?? 0, playbooks: pbRes.count ?? 0 });
      setActivity(auditRes.data ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  const identities: any[] = user?.identities ?? [];
  const hasEmailIdentity = identities.some((i) => i.provider === "email");
  const emailConfirmed = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Account";
  const role = me.isDemo ? "Demo" : me.isAdmin ? "Admin" : "Analyst";
  const specializations: string[] = Array.isArray(profile?.specializations) ? profile.specializations : [];

  const activeCases = cases.filter((c) => ["Open", "Investigating"].includes(c.status ?? "")).length;
  const closedCases = cases.filter((c) => c.status === "Closed").length;
  const filteredCases = cases.filter((c) => c.title.toLowerCase().includes(caseSearch.toLowerCase()));

  const openEdit = () => {
    setEditName(profile?.full_name || displayName);
    setEditLocation(profile?.location || "");
    setEditSpecs(specializations.join(", "));
    setEditOpen(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    const updates = {
      full_name: editName.trim().slice(0, 100),
      location: editLocation.trim().slice(0, 100),
      specializations: editSpecs.split(",").map((s) => s.trim().slice(0, 40)).filter(Boolean).slice(0, 12),
    };
    // Only these three fields are written. Role and clearance are never set from the browser.
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...updates });
    setSaving(false);
    if (error) return void toast.error(error.message || "Could not save your profile.");
    setProfile((p: any) => ({ ...(p ?? { id: user.id }), ...updates }));
    toast.success("Profile updated.");
    setEditOpen(false);
  };

  const copyId = () => {
    navigator.clipboard.writeText(user?.id ?? "");
    setCopied(true);
    toast.success("User ID copied.");
    setTimeout(() => setCopied(false), 1800);
  };

  const link = async (provider: "google" | "discord") => {
    setLinking(provider);
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/account?linked=${provider}` },
    });
    if (error) {
      toast.error(error.message || `Could not start linking ${provider}.`);
      setLinking(null);
    }
  };

  const unlink = async (provider: string) => {
    if (identities.length <= 1) return void toast.error("You can't remove your only sign-in method.");
    const target = identities.find((i) => i.provider === provider);
    if (!target) return;
    setLinking(provider);
    const { error } = await supabase.auth.unlinkIdentity(target);
    setLinking(null);
    if (error) return void toast.error(error.message || `Could not unlink ${provider}.`);
    toast.success(`${providerLabel(provider)} disconnected.`);
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const resendVerification = async () => {
    if (!user?.email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    setResending(false);
    if (error) toast.error(error.message || "Could not send the email.");
    else toast.success("Verification email sent.");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 12) return void toast.error("Use at least 12 characters.");
    if (newPassword !== confirmPassword) return void toast.error("The passwords do not match.");
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) return void toast.error(error.message || "Could not update the password.");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated.");
  };

  const saveKeys = () => {
    for (const k of OSINT_KEYS) localStorage.setItem(k.storage, (keys[k.storage] || "").trim());
    toast.success("Saved in this browser.");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return <p className="py-20 text-center text-sm text-muted-foreground">You are not signed in.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your profile, sign-in methods and integrations.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar user={user} name={displayName} className="size-20 text-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold">{displayName}</h2>
              <Badge variant={me.isAdmin && !me.isDemo ? "default" : "secondary"}>{role}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="truncate">{user.email}</span>
              {emailConfirmed ? (
                <span className="inline-flex items-center gap-1 text-emerald-500"><BadgeCheck className="size-4" /> Verified</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-500"><MailWarning className="size-4" /> Not verified</span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1 sm:grid-cols-3">
              <Field label="Member since">{user.created_at ? format(new Date(user.created_at), "d MMM yyyy") : "n/a"}</Field>
              <Field label="Last sign-in">{user.last_sign_in_at ? formatDistanceToNowStrict(new Date(user.last_sign_in_at), { addSuffix: true }) : "n/a"}</Field>
              <Field label="User ID">
                <button type="button" onClick={copyId} className="inline-flex items-center gap-1.5 font-mono text-xs hover:text-foreground" title="Copy user ID">
                  {String(user.id).slice(0, 8)}… {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                </button>
              </Field>
            </dl>
          </div>
          <Button variant="outline" onClick={openEdit} className="self-start sm:self-center">
            <Pencil className="size-4" /> Edit profile
          </Button>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="h-auto w-full justify-start gap-1 sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile details</CardTitle>
              <CardDescription>What teammates see. Edit it from the button above.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name">{profile?.full_name || displayName}</Field>
                <Field label="Location">
                  {profile?.location ? (
                    <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-muted-foreground" />{profile.location}</span>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </Field>
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Specializations</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {specializations.length ? specializations.map((s) => <Badge key={s} variant="secondary">{s}</Badge>) : <span className="text-sm text-muted-foreground">Not set</span>}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Workspace snapshot</h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Cases", value: cases.length, note: `${activeCases} active, ${closedCases} closed`, icon: Shield },
                { label: "Indicators", value: counts.iocs, note: "In the IOC database", icon: Database },
                { label: "Threat feeds", value: counts.feeds, note: "Configured sources", icon: Radio },
                { label: "Playbooks", value: counts.playbooks, note: "SOAR automations", icon: Workflow },
              ].map((s) => (
                <Card key={s.label} className="gap-0 py-0">
                  <CardContent className="space-y-1 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {s.label}
                      <s.icon className="size-4" />
                    </div>
                    <p className="text-2xl font-semibold tabular-nums">{s.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{s.note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account activity</CardTitle>
              <CardDescription>Events recorded for your account.</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No recorded activity yet.</p>
              ) : (
                <ol className="space-y-4 border-l pl-5">
                  {activity.map((log) => (
                    <li key={log.id} className="relative">
                      <span className="absolute -left-[26px] top-1.5 size-2 rounded-full bg-primary ring-4 ring-card" />
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium">{String(log.action).replace(/_/g, " ")}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNowStrict(new Date(log.created_at), { addSuffix: true })}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cases</CardTitle>
              <CardDescription>Incident cases in the workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)} placeholder="Search cases" className="pl-9" />
              </div>
              {filteredCases.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{cases.length === 0 ? "No cases yet." : "No cases match your search."}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Case</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-right">Opened</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.slice(0, 15).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="max-w-[280px]">
                          <Link href={`/dashboard/cases/${c.id}`} className="block truncate font-medium hover:underline">{c.title}</Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={SEVERITY[c.severity ?? ""] ?? ""}>{c.severity ?? "n/a"}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">{c.status ?? "n/a"}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums text-muted-foreground">{formatDistanceToNowStrict(new Date(c.created_at), { addSuffix: true })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sign-in methods</CardTitle>
              <CardDescription>
                Google is used to sign in. Discord can be linked so your Discord ID matches your access invite.
                {me.isDemo && " (Disabled in demo mode.)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["google", "discord"] as const).map((provider) => {
                const identity = identities.find((i) => i.provider === provider);
                return (
                  <div key={provider} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{providerLabel(provider)}</p>
                      <p className="text-xs text-muted-foreground">
                        {identity
                          ? `Connected${identity.identity_data?.email ? ` as ${identity.identity_data.email}` : identity.identity_data?.full_name ? ` as ${identity.identity_data.full_name}` : ""}`
                          : "Not connected"}
                      </p>
                    </div>
                    {identity ? (
                      <Button variant="outline" size="sm" disabled={me.isDemo || linking === provider} onClick={() => unlink(provider)}>
                        {linking === provider ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />} Disconnect
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled={me.isDemo || linking === provider} onClick={() => link(provider)}>
                        {linking === provider ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} Connect
                      </Button>
                    )}
                  </div>
                );
              })}
              {!emailConfirmed && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-sm">Your email address is not verified.</p>
                  <Button variant="outline" size="sm" onClick={resendVerification} disabled={resending || me.isDemo}>
                    {resending && <Loader2 className="size-4 animate-spin" />} Resend email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current session</CardTitle>
              <CardDescription>Details this browser can report. Other devices are not listed.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-3">
                <Field label="Browser">{browser || "Unknown"}</Field>
                <Field label="Signed in">{user.last_sign_in_at ? format(new Date(user.last_sign_in_at), "d MMM yyyy, HH:mm") : "n/a"}</Field>
                <Field label="Method">{providerLabel(user.app_metadata?.provider ?? "unknown")}</Field>
              </dl>
            </CardContent>
          </Card>

          {hasEmailIdentity && (
            <Card>
              <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>Use at least 12 characters.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={changePassword} className="grid max-w-md gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New password</Label>
                    <div className="relative">
                      <Input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={updatingPassword || me.isDemo} className="w-fit">
                    {updatingPassword && <Loader2 className="size-4 animate-spin" />} Update password
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>OSINT integrations</CardTitle>
              <CardDescription>
                Optional personal API keys for OSINT scans. They are stored only in this browser (local storage) and are
                sent to the server only when you run a scan. Clear them on shared computers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {OSINT_KEYS.map((k) => (
                  <div key={k.storage} className="grid gap-2">
                    <Label htmlFor={k.storage}>{k.label}</Label>
                    <Input
                      id={k.storage}
                      type="password"
                      autoComplete="off"
                      value={keys[k.storage] ?? ""}
                      onChange={(e) => setKeys((prev) => ({ ...prev, [k.storage]: e.target.value }))}
                      placeholder="Not set"
                    />
                    <p className="text-xs text-muted-foreground">{k.hint}</p>
                  </div>
                ))}
              </div>
              <Button onClick={saveKeys}>
                <Save className="size-4" /> Save keys
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={saveProfile} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>Your role and access are managed by an administrator and can&apos;t be changed here.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full name</Label>
                <Input id="edit-name" value={editName} maxLength={100} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" value={editLocation} maxLength={100} onChange={(e) => setEditLocation(e.target.value)} placeholder="City, country" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-specs">Specializations</Label>
                <Input id="edit-specs" value={editSpecs} onChange={(e) => setEditSpecs(e.target.value)} placeholder="Threat hunting, Incident response" />
                <p className="text-xs text-muted-foreground">Separate with commas.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />} Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
