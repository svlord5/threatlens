"use client";

import { X, Server, Key, Clock, ShieldAlert, Copy, Check, Eye, EyeOff, RefreshCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { updateFeedConfig } from "@/app/actions";

interface ConfigureFeedModalProps {
  feed: any;
  onClose: () => void;
}

export function ConfigureFeedModal({ feed, onClose }: ConfigureFeedModalProps) {
  const [isPending, startTransition] = useTransition();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  
  // Real values from DB, fallback to defaults
  const [endpointUrl, setEndpointUrl] = useState(feed.endpoint_url || "");
  const [authKey, setAuthKey] = useState(feed.auth_key || "*************************");
  const [pollingInterval, setPollingInterval] = useState(feed.polling_interval || "5m");

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generateNewKey = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const newKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setAuthKey(newKey);
    setShowKey(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateFeedConfig(feed.id, endpointUrl, authKey, pollingInterval);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={!isPending ? onClose : undefined}></div>
      <div className="bg-card border border-border rounded-lg w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Configure Module</h2>
            <p className="text-sm text-muted-foreground">{feed.name}</p>
          </div>
          <button onClick={onClose} disabled={isPending} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-orange-500/10 border-b border-orange-500/20 p-3.5 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-200/80 leading-relaxed">
            Modifying ingestion endpoints or polling intervals while the feed is active may result in skipped telemetry packets.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                API Endpoint URL
              </label>
              <div className="relative">
                <input 
                  type="url" 
                  disabled={isPending} 
                  value={endpointUrl}
                  placeholder="e.g. https://api.alienvault.com/v1/indicators"
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  className="w-full bg-background border border-border rounded-md pl-3 pr-10 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50" 
                />
                <button 
                  type="button" 
                  onClick={() => handleCopy(endpointUrl, 'endpoint')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {copiedField === 'endpoint' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>You</strong> must provide the API URL here. If you want to pull data from your Vercel site, enter your Vercel URL. If you want to pull from Kaspersky/AlienVault, enter their URL here.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  Authentication Key
                </div>
                <button 
                  type="button" 
                  onClick={generateNewKey}
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <RefreshCcw className="w-3 h-3" />
                  Regenerate
                </button>
              </label>
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input 
                    type={showKey ? "text" : "password"} 
                    disabled={isPending} 
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                    className="w-full bg-background border border-border rounded-md pl-3 pr-20 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50" 
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button 
                      type="button" 
                      onClick={() => setShowKey(!showKey)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleCopy(authKey, 'key')}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {copiedField === 'key' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Enter your Bearer token or API key for this feed. This key is used to authorize incoming or outgoing requests to the endpoint.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Polling Interval
              </label>
              <select 
                disabled={isPending} 
                value={pollingInterval}
                onChange={(e) => setPollingInterval(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none disabled:opacity-50"
              >
                <option value="1m">Real-time (Every 1 minute)</option>
                <option value="5m">Aggressive (Every 5 minutes)</option>
                <option value="1h">Standard (Every 1 hour)</option>
                <option value="24h">Batch (Every 24 hours)</option>
              </select>
              <p className="text-xs text-muted-foreground">Determine how frequently ThreatLens queries this endpoint for new IOCs.</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-white text-black hover:bg-zinc-200 rounded-md transition-colors disabled:opacity-50">
              {isPending && <Server className="w-4 h-4 animate-pulse" />}
              {isPending ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
