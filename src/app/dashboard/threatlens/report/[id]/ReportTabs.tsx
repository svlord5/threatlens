"use client";

import { useState } from "react";
import { Activity, ShieldAlert, CheckCircle2, Globe, Server, AlertTriangle, ShieldCheck, Mail, Code, MapPin, Network, Terminal, Waypoints } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import ScanGraphView from "./ScanGraphView";
import SeverityChart from "./SeverityChart";

export default function ReportTabs({ scan }: { scan: any }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6 mt-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-border">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          Overview & Findings
        </button>
        <button 
          onClick={() => setActiveTab("infrastructure")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'infrastructure' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          Infrastructure & Intelligence
        </button>
        <button 
          onClick={() => setActiveTab("graph")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'graph' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Waypoints className="w-4 h-4" />
          Graph Explorer
        </button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* AI Executive Summary */}
          <div className="bg-card border border-border rounded-xl overflow-hidden relative group hover:border-indigo-500/30 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <div className="p-6">
              <h2 className="text-sm font-medium text-indigo-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Activity className="w-4 h-4" />
                AI Executive Summary
              </h2>
              <div className="prose prose-invert prose-sm max-w-none text-foreground [&>h1]:text-indigo-400 [&>h2]:text-indigo-400">
                {scan.ai_executive_summary ? (
                  <MarkdownRenderer content={scan.ai_executive_summary} />
                ) : (
                  <p className="text-muted-foreground italic">No AI summary generated for this scan.</p>
                )}
              </div>
            </div>
          </div>

          {/* Findings List & Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                Security Findings ({scan.threatlens_findings?.length || 0})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Chart Column */}
              <div className="md:col-span-1 border border-white/5 rounded-lg bg-white/[0.01] p-4 flex flex-col justify-center w-full">
                <h3 className="text-xs font-medium text-muted-foreground uppercase mb-4 w-full text-center tracking-wider">Severity Distribution</h3>
                <div className="w-full h-[250px]">
                  <SeverityChart findings={scan.threatlens_findings || []} />
                </div>
              </div>

              {/* Findings Column */}
              <div className="md:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {scan.threatlens_findings?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-white/[0.02] rounded-lg border border-white/5 h-full">
                    <ShieldCheck className="w-8 h-8 text-green-500 mb-3" />
                    <p className="text-sm text-muted-foreground">No major security misconfigurations detected.</p>
                  </div>
                ) : (
                scan.threatlens_findings?.map((finding: any) => (
                  <div key={finding.id} className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-medium text-foreground">{finding.title}</h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-sm border ${
                        finding.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        finding.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        finding.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{finding.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Impact</div>
                        <p className="text-xs text-foreground">{finding.impact}</p>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Remediation</div>
                        <p className="text-xs text-foreground">{finding.remediation}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>
          </div>

          {/* Exposed Files Warning */}
          {(scan.ssl_data?.exposed_files && scan.ssl_data.exposed_files.length > 0) && (
            <div className="bg-card border border-rose-500/30 rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-rose-400 flex items-center gap-2 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  Exposed Sensitive Files
                </h2>
                <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full font-bold animate-pulse">Critical Risk</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">The scanner identified critical configuration files actively exposed to the public internet.</p>
              <div className="space-y-2">
                {scan.ssl_data.exposed_files.map((file: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/10 px-3 py-2 rounded-lg">
                    <Terminal className="w-4 h-4 text-rose-500/70" />
                    <span className="text-sm text-rose-300 font-mono font-bold">
                      {file}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Technical Summary */}
          {scan.ai_technical_summary && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Code className="w-4 h-4" />
                AI Technical Analysis
              </h2>
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-indigo-400 prose-a:text-indigo-400">
                <MarkdownRenderer content={scan.ai_technical_summary} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Infrastructure Tab Content */}
      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="space-y-6">
            {/* Tech Stack */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Server className="w-4 h-4" />
                Technology Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {scan.tech_data && scan.tech_data.length > 0 ? (
                  scan.tech_data.map((tech: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-muted border border-border rounded text-xs text-foreground">
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No technologies detected</span>
                )}
              </div>
            </div>

            {/* Server Status */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Globe className="w-4 h-4" />
                Server Status
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-muted-foreground">HTTP Status</span>
                  <span className="text-foreground font-mono">{scan.ssl_data?.status_code || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">TLS Enforced</span>
                  {scan.ssl_data?.tls_enforced ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Hosting Intelligence */}
            {scan.dns_data?.geolocation && scan.dns_data.geolocation.status === "success" && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  Hosting Intelligence
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-muted-foreground">ISP</span>
                    <span className="text-foreground font-mono text-right max-w-[60%] truncate" title={scan.dns_data.geolocation.isp}>{scan.dns_data.geolocation.isp}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-muted-foreground">ASN</span>
                    <span className="text-foreground font-mono text-right max-w-[60%] truncate" title={scan.dns_data.geolocation.as}>{scan.dns_data.geolocation.as}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-foreground text-right">{scan.dns_data.geolocation.city}, {scan.dns_data.geolocation.country}</span>
                  </div>
                </div>
              </div>
            )}

            {/* DNS Records */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Mail className="w-4 h-4" />
                DNS Intelligence
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">A Records</div>
                  {scan.dns_data?.a_records?.length > 0 ? (
                    <div className="space-y-1">
                      {scan.dns_data.a_records.map((r: string, i: number) => (
                        <div key={i} className="text-[13px] text-foreground font-mono bg-muted px-2 py-1 rounded">{r}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">None found</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">MX Records</div>
                  {scan.dns_data?.mx_records?.length > 0 ? (
                    <div className="space-y-1">
                      {scan.dns_data.mx_records.map((r: string, i: number) => (
                        <div key={i} className="text-[13px] text-foreground font-mono bg-muted px-2 py-1 rounded truncate">{r}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">None found</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Historical Attack Surface (Wayback) */}
            {scan.dns_data?.wayback_archives && scan.dns_data.wayback_archives.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                    <Globe className="w-4 h-4" />
                    Historical Endpoints (Wayback)
                  </h2>
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">{scan.dns_data.wayback_archives.length} archived</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {scan.dns_data.wayback_archives.map((url: string, i: number) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 hover:border-border transition-colors px-3 py-2 rounded-lg text-sm">
                      <a href={url} target="_blank" rel="noreferrer" className="text-foreground hover:text-indigo-400 hover:underline font-mono break-all text-[11px]">
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discovered Subdomains */}
            {scan.dns_data?.subdomains && scan.dns_data.subdomains.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                    <Network className="w-4 h-4" />
                    Attack Surface (Subdomains)
                  </h2>
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">{scan.dns_data.subdomains.length} discovered</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {scan.dns_data.subdomains.map((sub: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/[0.02] border border-white/5 hover:border-border transition-colors px-3 py-2 rounded-lg text-sm gap-2">
                      <span className="text-foreground font-mono break-all" title={sub.host}>{sub.host}</span>
                      <span className="text-muted-foreground font-mono text-xs shrink-0">{sub.ip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw WHOIS Data */}
            <div className="bg-card border border-border rounded-xl p-6 h-full flex flex-col">
              <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Terminal className="w-4 h-4" />
                Raw WHOIS Records
              </h2>
              <div className="bg-muted border border-white/5 rounded-lg p-4 overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar flex-1">
                <pre className="text-[11px] text-emerald-400/80 font-mono leading-relaxed">
                  {scan.dns_data?.whois_raw || "WHOIS data not available for this scan."}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graph Tab Content */}
      {activeTab === 'graph' && (
        <ScanGraphView scan={scan} />
      )}
    </div>
  );
}
