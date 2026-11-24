"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Globe, Database, FileText, MapPin, Hash, Mail, Map, Shield, Server, FileSearch, Smartphone, IndianRupee, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { runOsintScan } from "@/app/actions";
import OsintPdfExport from "./OsintPdfExport";
import { useSearchParams } from "next/navigation";

export function OsintClient() {
  const searchParams = useSearchParams();
  const initialIndicator = searchParams.get("indicator") || "";

  const [indicator, setIndicator] = useState(initialIndicator);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");


  const handleScan = async (targetIndicator: string) => {
    if (!targetIndicator.trim()) return;

    setIsScanning(true);
    setError("");
    setResults(null);

    const apiKeys = {
      numverifyKey: localStorage.getItem('NUMVERIFY_API_KEY') || "",
      abstractKey: localStorage.getItem('ABSTRACT_API_KEY') || "",
      truecallerKey: localStorage.getItem('TRUECALLER_API_KEY') || "",
      npciKey: localStorage.getItem('NPCI_API_KEY') || "",
      hibpKey: localStorage.getItem('HIBP_API_KEY') || "",
      otxKey: localStorage.getItem('OTX_API_KEY') || "",
    };

    const response = await runOsintScan(targetIndicator.trim(), apiKeys);

    if (response.success && response.data) {
      setResults(response.data);
    } else {
      setError(response.error || "An unknown error occurred during OSINT gathering.");
    }

    setIsScanning(false);
  };

  useEffect(() => {
    if (initialIndicator) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizes state with an external source
      handleScan(initialIndicator);
    }
  }, [initialIndicator]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(indicator);
  };

  const renderIcon = () => {
    if (!results) return <Globe className="w-5 h-5 text-muted-foreground" />;
    switch (results.type) {
      case 'ip': return <MapPin className="w-5 h-5 text-sky-500" />;
      case 'hash': return <Hash className="w-5 h-5 text-rose-500" />;
      case 'email': return <Mail className="w-5 h-5 text-amber-500" />;
      case 'mobile': return <Smartphone className="w-5 h-5 text-indigo-500" />;
      case 'upi': return <IndianRupee className="w-5 h-5 text-green-500" />;
      default: return <Globe className="w-5 h-5 text-emerald-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "do MMMM, yyyy");
    } catch {
      return dateString;
    }
  };

  const domainWarnings = results?.dnsInfo?.whois_parsed ? (() => {
    const { creationDate, expiryDate } = results.dnsInfo.whois_parsed;
    const warnings = [];
    if (creationDate) {
      try {
        const cDate = new Date(creationDate);
        if (!isNaN(cDate.getTime())) {
           const daysOld = differenceInDays(new Date(), cDate);
           if (daysOld <= 30) {
             warnings.push({ type: 'warning', text: `Domain is very new (${daysOld} days old). High risk of phishing/spam.` });
           }
        }
      } catch (e) {}
    }
    
    if (expiryDate) {
      try {
        const eDate = new Date(expiryDate);
        if (!isNaN(eDate.getTime())) {
           const daysLeft = differenceInDays(eDate, new Date());
           if (daysLeft < 0) {
             warnings.push({ type: 'danger', text: `Domain expired ${Math.abs(daysLeft)} days ago.` });
           } else if (daysLeft <= 30) {
             warnings.push({ type: 'warning', text: `Domain expires soon (in ${daysLeft} days).` });
           }
        }
      } catch (e) {}
    }
    return warnings;
  })() : [];

  return (
    <div className="space-y-8">
      {/* Search Input */}
      <div className="bg-muted border border-border rounded-xl p-6 shadow-2xl">
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {renderIcon()}
            </div>
            <input
              type="text"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              placeholder="Enter Domain, IP Address, Email, Mobile Number, UPI ID, or Hash"
              className="w-full bg-card border border-border rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border transition-all font-mono text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !indicator.trim()}
            className="flex items-center justify-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 shadow-md shrink-0"
          >
            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {isScanning ? "Scanning..." : "Investigate"}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-400 bg-red-400/10 p-3 rounded-md border border-red-400/20 font-medium">{error}</p>}
      </div>

      {/* Results */}
      {results && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2 uppercase tracking-widest text-sm">
              <span className="text-muted-foreground">Target Type:</span> {results.type}
            </h2>
            <OsintPdfExport results={results} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Mobile Intelligence */}
            {results.mobileInfo && (
              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  Mobile & Telecom Intelligence
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mobile Number</p>
                    <p className="text-sm text-foreground font-mono">{results.mobileInfo.number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Telecom Provider</p>
                    <p className="text-sm text-foreground">{results.mobileInfo.provider} ({results.mobileInfo.circle})</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Intelligence Sources</p>
                    <p className="text-sm font-semibold text-indigo-400">{results.mobileInfo.sources}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fraud / NCRP Reports</p>
                    <p className={`text-sm font-bold ${results.mobileInfo.ncrp_reports > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {results.mobileInfo.ncrp_reports} Reports (Pending)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* UPI Intelligence */}
            {results.upiInfo && (
              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-green-500" />
                  UPI & Financial Intelligence
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">UPI VPA</p>
                    <p className="text-sm text-foreground font-mono">{results.upiInfo.vpa}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Acquiring Bank</p>
                    <p className="text-sm text-foreground">{results.upiInfo.bank}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registered Entity</p>
                    <p className="text-sm text-foreground font-semibold">{results.upiInfo.name_registered}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fraud Risk Status</p>
                    <p className={`text-sm font-bold ${results.upiInfo.fraud_score > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {results.upiInfo.status} (Score: {results.upiInfo.fraud_score})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* IP Intelligence */}
            {results.ipInfo && (
              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Map className="w-4 h-4 text-sky-500" />
                  IP Geolocation & ASN
                </h2>
                <div className="bg-muted border border-border rounded-xl overflow-hidden shadow-sm">
                  {results.ipInfo.latitude && results.ipInfo.longitude && (
                     <div className="w-full h-[250px] bg-zinc-900 relative border-b border-white/5">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          scrolling="no" 
                          marginHeight={0} 
                          marginWidth={0} 
                          src={`https://maps.google.com/maps?q=${results.ipInfo.latitude},${results.ipInfo.longitude}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                          style={{ border: 0 }}
                          title="IP Location Map"
                        ></iframe>
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                           <a 
                             href={`https://www.google.com/maps/search/?api=1&query=${results.ipInfo.latitude},${results.ipInfo.longitude}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 transition-colors px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium text-white shadow-lg pointer-events-auto"
                           >
                             <MapPin className="w-3 h-3" />
                             Open in Google Maps
                           </a>
                           <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-md flex items-center gap-2 pointer-events-none hidden sm:flex">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">Live Trace</span>
                           </div>
                        </div>
                     </div>
                  )}
                  
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between border border-white/5 bg-background/50 p-4 rounded-lg gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">IP Address / Network</p>
                        <p className="text-lg text-foreground font-mono flex items-center gap-2">
                          {results.ipInfo.ip} 
                          {results.ipInfo.version && <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">{results.ipInfo.version}</span>}
                        </p>
                        {results.ipInfo.network && <p className="text-xs text-indigo-400 font-mono mt-1 flex items-center gap-1.5"><Database className="w-3 h-3" /> CIDR: {results.ipInfo.network}</p>}
                      </div>
                      <div className="sm:text-right border-t border-white/5 sm:border-t-0 sm:border-l sm:pl-4 pt-3 sm:pt-0">
                         <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Timezone</p>
                         <p className="text-sm text-foreground font-mono">{results.ipInfo.timezone || "Unknown"}</p>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2 flex flex-col justify-center border border-white/5 bg-background/30 p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Organization / ISP</p>
                      <p className="text-base text-foreground font-medium truncate" title={results.ipInfo.org}>{results.ipInfo.org || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground font-mono mt-0.5">{results.ipInfo.asn}</p>
                    </div>
                    
                    <div className="px-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Country</p>
                      <p className="text-sm text-foreground">{results.ipInfo.country || "Unknown"}</p>
                    </div>
                    
                    <div className="px-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Region / City</p>
                      <p className="text-sm text-foreground truncate" title={`${results.ipInfo.region}, ${results.ipInfo.city}`}>{results.ipInfo.region}, {results.ipInfo.city}</p>
                    </div>
                    
                    <div className="px-1">
                       <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Postal Code</p>
                       <p className="text-sm text-foreground font-mono">{results.ipInfo.postal || "Unknown"}</p>
                    </div>
                    
                    <div className="px-1">
                       <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Coordinates</p>
                       <p className="text-sm text-foreground font-mono">{results.ipInfo.latitude}, {results.ipInfo.longitude}</p>
                    </div>
                  </div>
                  
                  {results.ipInfo.security && (
                    <div className="p-5 border-t border-border/50 bg-background/20">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        Security Profile (Abstract API)
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-background/50 border border-white/5 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">VPN</p>
                          <p className={`text-sm font-bold ${results.ipInfo.security.is_vpn ? 'text-red-500' : 'text-emerald-500'}`}>
                            {results.ipInfo.security.is_vpn ? 'True' : 'False'}
                          </p>
                        </div>
                        <div className="bg-background/50 border border-white/5 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Proxy</p>
                          <p className={`text-sm font-bold ${results.ipInfo.security.is_proxy ? 'text-red-500' : 'text-emerald-500'}`}>
                            {results.ipInfo.security.is_proxy ? 'True' : 'False'}
                          </p>
                        </div>
                        <div className="bg-background/50 border border-white/5 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tor</p>
                          <p className={`text-sm font-bold ${results.ipInfo.security.is_tor ? 'text-red-500' : 'text-emerald-500'}`}>
                            {results.ipInfo.security.is_tor ? 'True' : 'False'}
                          </p>
                        </div>
                        <div className="bg-background/50 border border-white/5 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hosting</p>
                          <p className={`text-sm font-bold ${results.ipInfo.security.is_hosting ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {results.ipInfo.security.is_hosting ? 'True' : 'False'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Threat Intelligence (VirusTotal) */}
            {results.vtInfo && !results.vtInfo.error && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  VirusTotal Detection
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2">
                  <div className="text-4xl font-bold text-foreground tracking-tighter">
                    <span className={results.vtInfo.malicious > 0 ? "text-red-500" : "text-emerald-500"}>
                      {results.vtInfo.malicious}
                    </span>
                    <span className="text-muted-foreground text-2xl"> / {results.vtInfo.total}</span>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Vendors flagged as malicious</p>
                </div>
              </div>
            )}
            
            {results.vtInfo?.error && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  VirusTotal Detection
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">{results.vtInfo.error}</p>
                </div>
              </div>
            )}

            {/* Email Intelligence (HaveIBeenPwned) */}
            {results.hibpInfo && !results.hibpInfo.error && (
              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Data Breaches (HaveIBeenPwned)
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5">
                  {results.hibpInfo.breaches.length === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-500">
                       <Shield className="w-5 h-5" />
                       <p className="text-sm font-medium">Good news! This email was not found in any known data breaches.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <p className="text-sm font-bold text-rose-500 mb-4">Warning: Email found in {results.hibpInfo.breaches.length} breaches.</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {results.hibpInfo.breaches.map((breach: any, idx: number) => (
                           <div key={idx} className="bg-background/50 border border-white/5 p-4 rounded-lg flex flex-col justify-between">
                              <div>
                                <h3 className="text-base font-bold text-foreground mb-1">{breach.Title || breach.Name}</h3>
                                <p className="text-xs text-muted-foreground font-mono">{formatDate(breach.BreachDate)}</p>
                              </div>
                              <div className="mt-4 pt-3 border-t border-white/5">
                                 <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Compromised Data</p>
                                 <div className="flex flex-wrap gap-1">
                                   {breach.DataClasses.map((dc: string, i: number) => (
                                     <span key={i} className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded">{dc}</span>
                                   ))}
                                 </div>
                              </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SSL/TLS Certificate */}
            {results.sslInfo && !results.sslInfo.error && (
              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  SSL/TLS Certificate
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Issuer</p>
                    <p className="text-sm text-foreground">{results.sslInfo.issuer || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <p className={`text-sm font-bold ${results.sslInfo.expired ? 'text-red-500' : 'text-emerald-500'}`}>
                      {results.sslInfo.expired ? "Expired" : "Valid"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expires On</p>
                    <p className="text-sm text-foreground font-medium">{formatDate(results.sslInfo.valid_to)}</p>
                  </div>
                  <div className="sm:col-span-4 border-t border-white/5 pt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Subject</p>
                    <p className="text-xs text-foreground font-mono bg-background/50 p-2 rounded">{results.sslInfo.subject}</p>
                  </div>
                </div>
              </div>
            )}

            {/* AlienVault OTX Intelligence */}
            {results.otxInfo && !results.otxInfo.error && (
              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-500" />
                  AlienVault OTX Pulses
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5">
                  <div className="flex items-center gap-6 mb-4 pb-4 border-b border-white/5">
                     <div>
                       <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Related Pulses</p>
                       <p className="text-2xl font-bold text-foreground">{results.otxInfo.pulse_info?.count || 0}</p>
                     </div>
                     {results.otxInfo.pulse_info?.count > 0 && (
                       <div>
                         <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Malware Families</p>
                         <div className="flex gap-2">
                           {Array.from(new Set(results.otxInfo.pulse_info.pulses.flatMap((p: any) => p.malware_families))).map((m: any, i: number) => (
                             <span key={i} className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-1 rounded">{m}</span>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                  
                  {results.otxInfo.pulse_info?.count > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {results.otxInfo.pulse_info.pulses.slice(0, 4).map((pulse: any, idx: number) => (
                        <div key={idx} className="bg-background/50 border border-white/5 p-4 rounded-lg flex flex-col justify-between">
                           <h3 className="text-sm font-bold text-foreground mb-2 truncate" title={pulse.name}>{pulse.name}</h3>
                           <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                             <p className="text-[10px] text-muted-foreground font-mono">Created: {formatDate(pulse.created)}</p>
                             <p className="text-[10px] text-teal-400 font-mono">Author: {pulse.author_name}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No AlienVault pulses found for this indicator.</p>
                  )}
                </div>
              </div>
            )}

            {/* Shodan Info */}
            {results.shodanInfo && !results.shodanInfo.error && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-500" />
                  Exposed Services (Shodan)
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5">
                  <div className="flex gap-2 flex-wrap">
                    {results.shodanInfo.ports.map((port: number) => (
                      <span key={port} className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded text-sm font-mono">
                        Port {port}
                      </span>
                    ))}
                    {results.shodanInfo.ports.length === 0 && (
                      <span className="text-muted-foreground text-sm">No open ports found.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {results.shodanInfo?.error && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  Exposed Services (Shodan)
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">{results.shodanInfo.error}</p>
                </div>
              </div>
            )}

            {/* DNS Intelligence */}
            {results.dnsInfo && (
              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-500" />
                  DNS Intelligence
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">A / AAAA Records (Resolved IPs)</h3>
                    {results.dnsInfo.a_records.length > 0 || results.dnsInfo.aaaa_records.length > 0 ? (
                      <ul className="space-y-1">
                        {results.dnsInfo.a_records.map((ip: string, i: number) => (
                          <li key={i} className="text-sm text-foreground font-mono">{ip} <span className="text-muted-foreground text-xs ml-1">(IPv4)</span></li>
                        ))}
                        {results.dnsInfo.aaaa_records.map((ip: string, i: number) => (
                          <li key={i} className="text-sm text-foreground font-mono break-all">{ip} <span className="text-muted-foreground text-xs ml-1">(IPv6)</span></li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-muted-foreground">No A or AAAA records found.</span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Mail Servers (MX)</h3>
                    {results.dnsInfo.mx_records.length > 0 ? (
                      <ul className="space-y-1">
                        {results.dnsInfo.mx_records.map((mx: string, i: number) => (
                          <li key={i} className="text-sm text-foreground font-mono break-all">{mx}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-muted-foreground">No MX records found.</span>
                    )}
                  </div>

                  <div className="md:col-span-2 border-t border-white/5 pt-4 mt-2">
                    <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Security Records (SPF / DMARC)</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground mr-2">SPF:</span>
                        {results.dnsInfo.spf_record ? (
                          <span className="text-sm text-emerald-400 font-mono break-all bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{results.dnsInfo.spf_record}</span>
                        ) : (
                          <span className="text-sm text-rose-400 font-mono break-all bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Missing or invalid SPF</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground mr-2">DMARC:</span>
                        {results.dnsInfo.dmarc_record ? (
                          <span className="text-sm text-emerald-400 font-mono break-all bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{results.dnsInfo.dmarc_record}</span>
                        ) : (
                          <span className="text-sm text-amber-400 font-mono break-all bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Missing DMARC policy</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subdomains (Domain/URL/Email only) */}
            {results.subdomains?.length >= 0 && results.type !== 'hash' && results.type !== 'ip' && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  Discovered Subdomains ({results.subdomains.length})
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5 max-h-[500px] overflow-y-auto">
                  {results.subdomains.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">No subdomains found.</p>
                  ) : (
                    <ul className="space-y-2">
                      {results.subdomains.map((sub: string, idx: number) => (
                        <li key={idx} className="text-sm text-foreground font-mono bg-muted px-3 py-2 rounded border border-white/5 break-all hover:bg-accent transition-colors cursor-pointer">
                          {sub}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Wayback Archives (Domain/URL/Email only) */}
            {results.archives?.length >= 0 && results.type !== 'hash' && results.type !== 'ip' && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Historical Archives ({results.archives.length > 100 ? "100+" : results.archives.length})
                </h2>
                <div className="bg-muted border border-border rounded-xl p-5 max-h-[300px] overflow-y-auto">
                  {results.archives.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">No archives found in Wayback Machine.</p>
                  ) : (
                    <ul className="space-y-2">
                      {results.archives.slice(0, 100).map((url: string, idx: number) => (
                        <li key={idx} className="text-sm text-foreground font-mono bg-muted px-3 py-2 rounded border border-white/5 break-all hover:bg-accent transition-colors">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors block">
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* WHOIS Data */}
            {results.whoisData && (
              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-blue-500" />
                  Domain WHOIS Record
                </h2>

                {results.dnsInfo?.whois_parsed && (
                  <div className="bg-muted border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {results.dnsInfo.whois_parsed.registrar && (
                      <div className="lg:col-span-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registrar</p>
                        <p className="text-sm text-foreground truncate" title={results.dnsInfo.whois_parsed.registrar}>{results.dnsInfo.whois_parsed.registrar}</p>
                      </div>
                    )}
                    {results.dnsInfo.whois_parsed.creationDate && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created On</p>
                        <p className="text-sm text-foreground font-medium">{formatDate(results.dnsInfo.whois_parsed.creationDate)}</p>
                      </div>
                    )}
                    {results.dnsInfo.whois_parsed.expiryDate && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expires On</p>
                        <p className="text-sm text-foreground font-medium">{formatDate(results.dnsInfo.whois_parsed.expiryDate)}</p>
                      </div>
                    )}
                    {results.dnsInfo.whois_parsed.status && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                        <p className="text-sm text-foreground">{results.dnsInfo.whois_parsed.status}</p>
                      </div>
                    )}
                  </div>
                )}

                {domainWarnings.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    {domainWarnings.map((warn: any, i: number) => (
                      <div key={i} className={`flex items-center gap-2 p-3 rounded-lg border ${warn.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium">{warn.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mt-4">Raw Record</h3>
                <div className="bg-muted border border-border rounded-xl p-5 max-h-[250px] overflow-y-auto">
                  <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                    {results.whoisData}
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
