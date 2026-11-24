"use client";

import { useState } from "react";
import { Server, ShieldAlert, MessageSquare, Globe, Database, CheckCircle2, XCircle, Link2, Copy, Terminal, Settings } from "lucide-react";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const [copiedWazuh, setCopiedWazuh] = useState(false);
  
  // NEXT_PUBLIC_APP_URL is the public address of this deployment (see .env.example).
  const wazuhWebhookUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")}/api/integrations/wazuh`;

  const copyWazuhUrl = () => {
    navigator.clipboard.writeText(wazuhWebhookUrl);
    setCopiedWazuh(true);
    toast.success("Wazuh Webhook URL copied to clipboard!");
    setTimeout(() => setCopiedWazuh(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
            <Link2 className="w-6 h-6 text-indigo-500" />
            Data Connectors & Integrations
          </h1>
          <p className="text-muted-foreground text-sm font-mono tracking-wide mt-1">
            Manage external SOC tools, APIs, and Webhook receivers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Wazuh SIEM Connector */}
        <div className="bg-card border border-indigo-500/30 rounded-xl overflow-hidden hover:border-indigo-500/60 transition-all shadow-lg shadow-indigo-500/5 group">
          <div className="p-6 border-b border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-500 group-hover:scale-110 transition-transform">
              <Server className="w-24 h-24" />
            </div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                  <Server className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Wazuh SIEM</h3>
                  <p className="text-xs text-muted-foreground">Log Ingestion & Alerts</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Listening
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Receive automated incident alerts directly from your Wazuh Manager into the ThreatLens case management system.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Webhook URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-xs font-mono text-foreground truncate">
                  {wazuhWebhookUrl}
                </code>
                <button 
                  onClick={copyWazuhUrl}
                  className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-md border border-indigo-500/20 transition-colors"
                >
                  {copiedWazuh ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="pt-2">
              <button className="w-full py-2 bg-muted hover:bg-accent text-sm font-medium text-foreground rounded-md border border-border transition-colors flex items-center justify-center gap-2">
                <Terminal className="w-4 h-4" />
                View Integration Guide
              </button>
            </div>
          </div>
        </div>

        {/* VirusTotal Connector */}
        <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-border transition-all shadow-lg group">
          <div className="p-6 border-b border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-24 h-24" />
            </div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">VirusTotal</h3>
                  <p className="text-xs text-muted-foreground">Threat Intelligence</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enrich IPs, Domains, and Hashes with reputation scoring and malware intelligence from VirusTotal.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API Status</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Key securely loaded from `.env`
              </div>
            </div>
             <div className="pt-2">
              <button className="w-full py-2 bg-muted hover:bg-accent text-sm font-medium text-foreground rounded-md border border-border transition-colors flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                Manage Keys
              </button>
            </div>
          </div>
        </div>

        {/* Shodan Connector */}
        <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-border transition-all shadow-lg group">
          <div className="p-6 border-b border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500 group-hover:scale-110 transition-transform">
              <Globe className="w-24 h-24" />
            </div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Shodan</h3>
                  <p className="text-xs text-muted-foreground">OSINT Reconnaissance</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Gather exposed port, banner, and vulnerability information for external IP addresses.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API Status</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Key securely loaded from `.env`
              </div>
            </div>
             <div className="pt-2">
              <button className="w-full py-2 bg-muted hover:bg-accent text-sm font-medium text-foreground rounded-md border border-border transition-colors flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                Manage Keys
              </button>
            </div>
          </div>
        </div>

        {/* Discord SOAR Connector */}
        <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-border transition-all shadow-lg group">
          <div className="p-6 border-b border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-[#5865F2] group-hover:scale-110 transition-transform">
              <MessageSquare className="w-24 h-24" />
            </div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Discord</h3>
                  <p className="text-xs text-muted-foreground">SOAR Alerts</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Push critical automated alerts, IAM violations, and active cases to the SOC Discord Channel.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Webhook Status</label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Webhook URL securely loaded
              </div>
            </div>
             <div className="pt-2">
              <button className="w-full py-2 bg-muted hover:bg-accent text-sm font-medium text-foreground rounded-md border border-border transition-colors flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                Configure Triggers
              </button>
            </div>
          </div>
        </div>

        {/* Splunk Connector (Placeholder) */}
        <div className="bg-card border border-white/5 rounded-xl overflow-hidden opacity-50 hover:opacity-100 transition-opacity">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Splunk Enterprise</h3>
                  <p className="text-xs text-muted-foreground">Enterprise SIEM</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs font-medium">
                <XCircle className="w-3 h-3" />
                Not Configured
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Two-way integration for pushing and pulling enterprise logs. Requires ThreatLens Pro license.
            </p>
            <div className="pt-2">
              <button disabled className="w-full py-2 bg-muted text-sm font-medium text-muted-foreground rounded-md border border-white/5 cursor-not-allowed">
                Upgrade Required
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
