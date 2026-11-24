"use client";

import React, { useState, useCallback, useRef } from "react";
import { Mail, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Globe, Clock, ShieldAlert, Paperclip, Hash, Info, FileText, ExternalLink, Eye, Code, CreditCard, MessageCircle, Bug, Download, Activity, RefreshCw } from "lucide-react";

// --- Types ---
interface ReceivedHop {
  raw: string;
  from: string;
  by: string;
  ip: string | null;
  timestamp: string | null;
  delay: number | null;
}

interface SpoofingResult {
  spf: "pass" | "fail" | "neutral" | "none" | "softfail" | "unknown";
  dkim: "pass" | "fail" | "none" | "unknown";
  dmarc: "pass" | "fail" | "none" | "unknown";
  fromDomain: string;
  returnPathDomain: string;
  mismatch: boolean;
}

interface Attachment {
  filename: string;
  contentType: string;
  encoding: string;
  size: string | null;
  hash: string | null;
  base64: string | null;
}

interface PivotLink {
  name: string;
  url: string;
}

interface BECAnalysis {
  score: number;
  threats: string[];
}

interface IOC {
  type: "url" | "ip" | "email" | "crypto" | "finance" | "social";
  value: string;
  defanged: string;
  pivots: PivotLink[];
}

interface EmailAnalysis {
  from: string;
  to: string;
  subject: string;
  date: string;
  messageId: string;
  replyTo: string;
  xMailer: string;
  xOriginalIp: string;
  receivedHops: ReceivedHop[];
  spoofing: SpoofingResult;
  attachments: Attachment[];
  rawHeaders: string;
  anomalies: string[];
  bec: BECAnalysis;
  iocs: IOC[];
  bodyRaw: string;
  bodyDecoded: string;
  trackingPixels: number;
}

// --- Parsing Logic ---
function decodeQuotedPrintable(str: string) {
  // Replace soft line breaks
  let decoded = str.replace(/=\r?\n/g, "");
  // Replace =XX hex characters
  decoded = decoded.replace(/=([A-Fa-f0-9]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  });
  return decoded;
}
function defangUrl(url: string) {
  return url.replace(/http/i, "hxxp").replace(/\./g, "[.]");
}

function defangIp(ip: string) {
  return ip.replace(/\./g, "[.]");
}

function defangEmail(email: string) {
  return email.replace(/@/, "[at]").replace(/\./g, "[.]");
}

function decodeBase64(rawStr: string) {
  // Strip any non-base64 characters safely to avoid DOMException crash
  const str = rawStr.replace(/[^A-Za-z0-9+/=]/g, '');
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    try {
      return atob(str);
    } catch {
      return rawStr;
    }
  }
}
function getHeader(headers: string, name: string): string {
  const regex = new RegExp(`^${name}:\\s*(.+?)(?=\\n\\S|\\n[\\t ]|$)`, "im");
  const match = headers.match(regex);
  if (!match) return "N/A";
  return match[1].replace(/\n\s+/g, " ").trim();
}

function extractIpFromReceived(received: string): string | null {
  const ipv4 = received.match(/\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/);
  if (ipv4) return ipv4[1];
  const ipv4bare = received.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
  if (ipv4bare) return ipv4bare[1];
  return null;
}

function parseSpfStatus(headers: string): SpoofingResult["spf"] {
  const authResults = getHeader(headers, "Authentication-Results");
  const receivedSpf = getHeader(headers, "Received-SPF");
  const combined = `${authResults} ${receivedSpf}`.toLowerCase();

  if (combined.includes("spf=pass")) return "pass";
  if (combined.includes("spf=fail")) return "fail";
  if (combined.includes("spf=softfail")) return "softfail";
  if (combined.includes("spf=neutral")) return "neutral";
  if (combined.includes("spf=none")) return "none";
  return "unknown";
}

function parseDkimStatus(headers: string): SpoofingResult["dkim"] {
  const authResults = getHeader(headers, "Authentication-Results").toLowerCase();
  if (authResults.includes("dkim=pass")) return "pass";
  if (authResults.includes("dkim=fail")) return "fail";
  if (authResults.includes("dkim=none")) return "none";
  const hasDkim = headers.match(/^DKIM-Signature:/im);
  return hasDkim ? "unknown" : "none";
}

function parseDmarcStatus(headers: string): SpoofingResult["dmarc"] {
  const authResults = getHeader(headers, "Authentication-Results").toLowerCase();
  if (authResults.includes("dmarc=pass")) return "pass";
  if (authResults.includes("dmarc=fail")) return "fail";
  if (authResults.includes("dmarc=none")) return "none";
  return "unknown";
}

function extractDomain(email: string): string {
  const match = email.match(/@([\w.-]+)/);
  return match ? match[1].toLowerCase() : email.toLowerCase();
}

async function parseAttachments(raw: string): Promise<Attachment[]> {
  const attachments: Attachment[] = [];
  const parts = raw.split(/--[^\n]+/);
  for (const part of parts) {
    const filenameMatch = part.match(/(?:filename|name)="?([^"\n;]+)"?/i);
    const contentTypeMatch = part.match(/Content-Type:\s*([\w\/]+)/i);
    const encodingMatch = part.match(/Content-Transfer-Encoding:\s*(\S+)/i);
    
    if (filenameMatch) {
      let base64 = null;
      let hash = null;
      let sizeStr = null;
      
      const enc = encodingMatch ? encodingMatch[1].toLowerCase() : "";
      if (enc === "base64") {
        // Extract base64 payload (everything after the headers in this part)
        const splitMatch = part.match(/\r?\n\r?\n/);
        if (splitMatch && splitMatch.index !== undefined) {
          let payload = part.substring(splitMatch.index + splitMatch[0].length).replace(/\s+/g, '');
          // Strip any trailing non-base64 chars (like boundary artifacts)
          payload = payload.replace(/[^A-Za-z0-9+/=]/g, '');
          
          if (payload.length > 0) {
            base64 = payload;
            sizeStr = (payload.length * 0.75 / 1024).toFixed(2) + " KB";
            try {
              // Hash the base64 payload
              const binaryString = atob(payload);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch(e) {
              console.error("Hashing failed", e);
            }
          }
        }
      }

      attachments.push({
        filename: filenameMatch[1].trim(),
        contentType: contentTypeMatch ? contentTypeMatch[1] : "application/octet-stream",
        encoding: encodingMatch ? encodingMatch[1] : "unknown",
        size: sizeStr,
        hash,
        base64
      });
    }
  }
  return attachments;
}

async function parseEmail(raw: string): Promise<EmailAnalysis> {
  // Split headers from body
  const headerBodySplit = raw.indexOf("\n\n");
  const headersOnly = headerBodySplit !== -1 ? raw.substring(0, headerBodySplit) : raw;
  const bodyRaw = headerBodySplit !== -1 ? raw.substring(headerBodySplit + 2) : "";

  // Parse received hops
  const receivedRegex = /^Received:([\s\S]+?)(?=^Received:|^[\w-]+:|$)/gim;
  const hops: ReceivedHop[] = [];
  let match;
  while ((match = receivedRegex.exec(headersOnly)) !== null) {
    const rawHop = match[1].replace(/\n\s+/g, " ").trim();
    const fromMatch = rawHop.match(/from\s+(\S+)/i);
    const byMatch = rawHop.match(/by\s+(\S+)/i);
    const timeMatch = rawHop.match(/;\s*(.+)$/i);
    hops.push({
      raw: rawHop,
      from: fromMatch ? fromMatch[1] : "unknown",
      by: byMatch ? byMatch[1] : "unknown",
      ip: extractIpFromReceived(rawHop),
      timestamp: timeMatch ? timeMatch[1].trim() : null,
      delay: null,
    });
  }
  
  // Calculate hop delays
  // We reverse to start from origin (earliest) to destination (latest)
  hops.reverse();
  for (let i = 1; i < hops.length; i++) {
    const prevTime = hops[i - 1].timestamp;
    const currTime = hops[i].timestamp;
    if (prevTime && currTime) {
      const prevMs = Date.parse(prevTime);
      const currMs = Date.parse(currTime);
      if (!isNaN(prevMs) && !isNaN(currMs)) {
        hops[i].delay = Math.max(0, currMs - prevMs) / 1000; // delay in seconds
      }
    }
  }

  const fromHeader = getHeader(headersOnly, "From");
  const returnPath = getHeader(headersOnly, "Return-Path");
  const fromDomain = extractDomain(fromHeader);
  const returnPathDomain = extractDomain(returnPath);

  const spoofing: SpoofingResult = {
    spf: parseSpfStatus(headersOnly),
    dkim: parseDkimStatus(headersOnly),
    dmarc: parseDmarcStatus(headersOnly),
    fromDomain,
    returnPathDomain,
    mismatch: returnPath !== "N/A" && fromDomain !== returnPathDomain,
  };

  const messageId = getHeader(headersOnly, "Message-ID");
  const messageIdDomain = extractDomain(messageId);
  
  // Anomalies
  const anomalies: string[] = [];
  if (spoofing.mismatch) anomalies.push(`From domain (${fromDomain}) does not match Return-Path domain (${returnPathDomain}).`);
  if (messageId !== "N/A" && messageIdDomain !== fromDomain) anomalies.push(`Message-ID domain (${messageIdDomain}) does not match From domain (${fromDomain}).`);
  if (getHeader(headersOnly, "X-PHP-Script") !== "N/A") anomalies.push("Found X-PHP-Script header, indicating potential script-based sending.");
  if (getHeader(headersOnly, "X-Spam-Flag") === "YES") anomalies.push("X-Spam-Flag is set to YES.");
  if (getHeader(headersOnly, "X-Priority") === "1" || getHeader(headersOnly, "X-Priority") === "1 (Highest)") anomalies.push("Email is flagged with high priority (common in phishing).");

  // Deep DKIM Inspection
  const dkimHeader = getHeader(headersOnly, "DKIM-Signature");
  if (dkimHeader !== "N/A") {
    const dMatch = dkimHeader.match(/d=([a-zA-Z0-9.-]+)/);
    if (dMatch) {
      const dkimDomain = extractDomain(dMatch[1]);
      // If it passes DKIM but the signing domain is different, it might be bulk sender abuse
      if (dkimDomain !== fromDomain) {
        anomalies.push(`DKIM Third-Party Signature: Email signed by (${dkimDomain}) but From domain is (${fromDomain}). High risk if unexpected.`);
      }
    }
  }

  // Suspicious TLD Detection
  const spammyTlds = ["xyz", "top", "click", "date", "shop", "pw", "monster", "icu", "bar", "live", "rest"];
  const fromTld = fromDomain.split('.').pop() || "";
  const returnPathTld = returnPathDomain.split('.').pop() || "";
  
  if (spammyTlds.includes(fromTld.toLowerCase())) {
    anomalies.push(`Suspicious TLD: The sender domain (${fromDomain}) uses a Top-Level Domain (.${fromTld}) frequently abused by threat actors.`);
  }
  if (fromTld !== returnPathTld && spammyTlds.includes(returnPathTld.toLowerCase())) {
    anomalies.push(`Suspicious TLD: The hidden Return-Path domain (${returnPathDomain}) uses a highly abused Top-Level Domain (.${returnPathTld}).`);
  }

  // Body Decoding
  let bodyDecoded = bodyRaw;
  if (bodyRaw) {
    const htmlMatch = bodyRaw.match(/Content-Type:\s*text\/html[^]*?\n\n([^]*?)(?=\n--[a-zA-Z0-9_=.-]+|$)/i);
    if (htmlMatch) {
      let extracted = htmlMatch[1].trim();
      const partFull = bodyRaw.substring(bodyRaw.lastIndexOf("--", htmlMatch.index), htmlMatch.index);
      const encodingMatch = partFull.match(/Content-Transfer-Encoding:\s*(\S+)/i);
      if (encodingMatch) {
        const enc = encodingMatch[1].toLowerCase();
        if (enc === "base64") extracted = decodeBase64(extracted.replace(/\s+/g, ''));
        else if (enc === "quoted-printable") extracted = decodeQuotedPrintable(extracted);
      }
      bodyDecoded = extracted;
    } else {
      if (bodyRaw.includes("=") && (/=[0-9A-F]{2}/i.test(bodyRaw) || /=\r?\n/.test(bodyRaw))) {
        bodyDecoded = decodeQuotedPrintable(bodyRaw);
      }
      const b64Regex = /(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g;
      bodyDecoded = bodyDecoded.replace(b64Regex, (m) => {
        const decoded = decodeBase64(m);
        if (/^[\x20-\x7E\r\n\t]*$/.test(decoded)) return `[Decoded Base64]:\n${decoded}\n[End Decoded]`;
        return m;
      });
    }
  }

  // Extract IOCs
  const iocs: IOC[] = [];
  const urlRegex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/\S*)?/gi;
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const cryptoRegex = /\b(bc1[a-zA-HJ-NP-Z0-9]{25,39}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-fA-F0-9]{40})\b/g;

  const foundUrls = new Set<string>();
  let uMatch;
  while ((uMatch = urlRegex.exec(bodyDecoded)) !== null) {
    foundUrls.add(uMatch[0]);
  }
  foundUrls.forEach(url => {
    let domain = url;
    try { domain = new URL(url).hostname; } catch {}
    iocs.push({ 
      type: "url", 
      value: url, 
      defanged: defangUrl(url),
      pivots: [
        { name: "URLScan", url: `https://urlscan.io/search/#domain:${domain}` },
        { name: "VirusTotal", url: `https://www.virustotal.com/gui/domain/${domain}` },
        { name: "URLhaus", url: `https://urlhaus.abuse.ch/browse.php?search=${domain}` }
      ]
    });
  });

  const foundIps = new Set<string>();
  let ipMatch;
  while ((ipMatch = ipRegex.exec(bodyDecoded)) !== null) {
    // filter local ips
    if (!ipMatch[0].startsWith("127.") && !ipMatch[0].startsWith("10.") && !ipMatch[0].startsWith("192.168.")) {
      foundIps.add(ipMatch[0]);
    }
  }
  foundIps.forEach(ip => iocs.push({ 
    type: "ip", 
    value: ip, 
    defanged: defangIp(ip),
    pivots: [
      { name: "AbuseIPDB", url: `https://www.abuseipdb.com/check/${ip}` },
      { name: "VirusTotal", url: `https://www.virustotal.com/gui/ip-address/${ip}` },
      { name: "Shodan", url: `https://www.shodan.io/host/${ip}` }
    ]
  }));

  const foundEmails = new Set<string>();
  let eMatch;
  while ((eMatch = emailRegex.exec(bodyDecoded)) !== null) {
    foundEmails.add(eMatch[0]);
  }
  foundEmails.forEach(e => iocs.push({ 
    type: "email", 
    value: e, 
    defanged: defangEmail(e),
    pivots: [] 
  }));

  const foundCrypto = new Set<string>();
  let cMatch;
  while ((cMatch = cryptoRegex.exec(bodyDecoded)) !== null) {
    foundCrypto.add(cMatch[0]);
  }
  foundCrypto.forEach(wallet => iocs.push({
    type: "crypto",
    value: wallet,
    defanged: wallet,
    pivots: [
      { name: "Blockchair", url: `https://blockchair.com/search?q=${wallet}` }
    ]
  }));

  const ibanRegex = /\b[A-Z]{2}[0-9]{2}(?:[ ]?[0-9a-zA-Z]{4}){4,7}\b/g;
  const ccRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;
  const socialRegex = /\b(?:https?:\/\/)?(?:t\.me|wa\.me|discord\.gg|linkedin\.com\/in)\/[a-zA-Z0-9_-]+\b/gi;

  const foundFinance = new Set<string>();
  let fMatch;
  while ((fMatch = ibanRegex.exec(bodyDecoded)) !== null) foundFinance.add(fMatch[0]);
  while ((fMatch = ccRegex.exec(bodyDecoded)) !== null) foundFinance.add(fMatch[0]);
  foundFinance.forEach(f => iocs.push({
    type: "finance",
    value: f,
    defanged: f,
    pivots: []
  }));

  const foundSocial = new Set<string>();
  let sMatch;
  while ((sMatch = socialRegex.exec(bodyDecoded)) !== null) foundSocial.add(sMatch[0]);
  foundSocial.forEach(s => iocs.push({
    type: "social",
    value: s,
    defanged: defangUrl(s),
    pivots: []
  }));

  // BEC Analysis
  const becThreats: string[] = [];
  const urgencyKeywords = /(urgent|immediate action required|asap|overdue|suspended|final notice)/gi;
  const financeKeywords = /(wire transfer|updated bank details|new routing number|swift code|invoice attached|payment details)/gi;
  
  const urgencyMatches = bodyDecoded.match(urgencyKeywords) || [];
  const financeMatches = bodyDecoded.match(financeKeywords) || [];
  
  let becScore = 0;
  if (urgencyMatches.length > 0) {
    becThreats.push(`Found ${urgencyMatches.length} urgency keywords (e.g. "${urgencyMatches[0]}").`);
    becScore += 40;
  }
  if (financeMatches.length > 0) {
    becThreats.push(`Found ${financeMatches.length} financial manipulation keywords (e.g. "${financeMatches[0]}").`);
    becScore += 40;
  }
  if (foundFinance.size > 0 && financeMatches.length > 0) {
    becThreats.push("High risk: Financial keywords found alongside actual IBAN/Credit Card data.");
    becScore += 20;
  }

  // Tracking Pixels
  const pixelRegex = /<img[^>]+(?:width=["']?1["']?\s*height=["']?1["']?|height=["']?1["']?\s*width=["']?1["']?)[^>]*>/gi;
  const trackingPixels = (bodyDecoded.match(pixelRegex) || []).length;

  return {
    from: fromHeader,
    to: getHeader(headersOnly, "To"),
    subject: getHeader(headersOnly, "Subject"),
    date: getHeader(headersOnly, "Date"),
    messageId: messageId,
    replyTo: getHeader(headersOnly, "Reply-To"),
    xMailer: getHeader(headersOnly, "X-Mailer") || getHeader(headersOnly, "X-Originating-Client"),
    xOriginalIp: getHeader(headersOnly, "X-Originating-IP") || getHeader(headersOnly, "X-Original-IP") || "",
    receivedHops: hops,
    spoofing,
    attachments: await parseAttachments(raw),
    rawHeaders: headersOnly,
    anomalies,
    bec: { score: Math.min(100, becScore), threats: becThreats },
    iocs,
    bodyRaw,
    bodyDecoded,
    trackingPixels
  };
}

// --- Status Badge ---
function StatusBadge({ status }: { status: string }) {
  const isGood = status === "pass";
  const isBad = ["fail", "softfail"].includes(status);
  const isUnknown = ["unknown", "none", "N/A"].includes(status);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
      isGood ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
      isBad ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
      "bg-zinc-800 text-muted-foreground border border-border"
    }`}>
      {isGood ? <CheckCircle className="w-3 h-3" /> : isBad ? <XCircle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
      {status}
    </span>
  );
}

// --- Main Component ---
export function EmailAnalyzerClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawInput, setRawInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [aiVerdict, setAiVerdict] = useState<any>(null);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [expandedHop, setExpandedHop] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  React.useEffect(() => {
    const handleErr = (ev: ErrorEvent) => {
      setErrorState(ev.message);
    };
    window.addEventListener("error", handleErr);
    return () => window.removeEventListener("error", handleErr);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setRawInput(event.target.result);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyze = useCallback(async () => {
    if (!rawInput.trim()) return;
    setIsAnalyzing(true);
    setAiVerdict(null);
    try {
      const res = await parseEmail(rawInput);
      setAnalysis(res);
      
      setIsAiAnalyzing(true);
      const aiRes = await fetch("/api/forensics/analyze", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            type: "email",
            iocs: res.iocs.map(i => i.value),
            contextData: { 
              senderIp: res.xOriginalIp, 
              subject: res.subject, 
              anomalies: res.anomalies, 
              from: res.from 
            }
         })
      });
      if (aiRes.ok) {
         const aiData = await aiRes.json();
         setAiVerdict(aiData);
      }
    } catch (e) {
      setErrorState(e instanceof Error ? e.message : String(e));
    } finally {
      setIsAnalyzing(false);
      setIsAiAnalyzing(false);
    }
  }, [rawInput]);

  const exportJson = useCallback(() => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email_analysis_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analysis]);

  const exportCsv = useCallback(() => {
    if (!analysis || analysis.iocs.length === 0) return;
    const headers = ["Type", "Value", "Defanged"];
    const rows = analysis.iocs.map(ioc => `${ioc.type},"${ioc.value}","${ioc.defanged}"`);
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email_iocs_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analysis]);

  const loadSample = useCallback(async () => {
    try {
      const res = await fetch("/sample.eml");
      if (!res.ok) throw new Error("Failed to load sample");
      const text = await res.text();
      setRawInput(text);
    } catch (e) {
      alert("Could not load sample.eml");
    }
  }, []);

  return (
    <div className="space-y-8">
      {errorState && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg font-mono text-xs">
          CRASH DETECTED: {errorState}
        </div>
      )}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            Paste Raw Email Headers / .eml Content
          </h2>
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".eml,.txt" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Paperclip className="w-3 h-3" />
              Upload .eml
            </button>
            <button
              onClick={loadSample}
              className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-border px-3 py-1 rounded-md transition-colors"
            >
              Load Phishing Sample
            </button>
          </div>
        </div>
        <textarea
          className="w-full h-48 bg-background/50 border border-border rounded-lg p-4 text-xs font-mono text-foreground placeholder-zinc-700 focus:outline-none focus:border-cyan-500/50 resize-none"
          placeholder="Paste the full raw email headers or .eml file content here..."
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
        />
        <button
          onClick={analyze}
          disabled={!rawInput.trim() || isAnalyzing}
          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-muted-foreground disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Email"}
        </button>
      </div>

      {/* Results Dashboard */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* AI Verdict Panel */}
          {aiVerdict && (
            <div className={`p-6 rounded-xl border ${aiVerdict.verdict === 'MALICIOUS' ? 'bg-red-500/10 border-red-500/30' : aiVerdict.verdict === 'SUSPICIOUS' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Activity className={`w-6 h-6 ${aiVerdict.verdict === 'MALICIOUS' ? 'text-red-400' : aiVerdict.verdict === 'SUSPICIOUS' ? 'text-yellow-400' : 'text-green-400'}`} />
                  <h3 className={`text-xl font-bold tracking-wider ${aiVerdict.verdict === 'MALICIOUS' ? 'text-red-400' : aiVerdict.verdict === 'SUSPICIOUS' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {aiVerdict.verdict}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-foreground">{aiVerdict.score}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Risk Score</div>
                </div>
              </div>
              <p className="text-foreground text-sm leading-relaxed border-t border-white/5 pt-4">
                {aiVerdict.justification}
              </p>
            </div>
          )}
          {isAiAnalyzing && (
            <div className="p-6 rounded-xl border border-white/5 bg-muted flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-sm text-muted-foreground">Running AI Threat Evaluation...</span>
            </div>
          )}

          {/* Header Metadata */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                Email Metadata
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportJson}
                  className="text-xs flex items-center gap-1.5 bg-muted hover:bg-accent border border-border px-3 py-1.5 rounded transition-colors text-foreground font-medium"
                >
                  <Download className="w-3 h-3" />
                  JSON Report
                </button>
                <button
                  onClick={exportCsv}
                  className="text-xs flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded transition-colors text-cyan-400 font-medium"
                >
                  <Download className="w-3 h-3" />
                  IOCs (CSV)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                { label: "From", value: analysis.from },
                { label: "To", value: analysis.to },
                { label: "Subject", value: analysis.subject },
                { label: "Date", value: analysis.date },
                { label: "Reply-To", value: analysis.replyTo },
                { label: "Message-ID", value: analysis.messageId },
                { label: "X-Mailer", value: analysis.xMailer },
                { label: "X-Originating-IP", value: analysis.xOriginalIp || "Not found" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
                  <span className={`text-foreground font-mono text-xs break-all ${
                    (label === "Reply-To" && value !== "N/A" && value !== analysis.from) ? "text-amber-400" : ""
                  }`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spoofing Analysis */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Spoofing & Authentication Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { label: "SPF", value: analysis.spoofing.spf },
                { label: "DKIM", value: analysis.spoofing.dkim },
                { label: "DMARC", value: analysis.spoofing.dmarc },
              ].map(({ label, value }) => (
                <div key={label} className="bg-background/40 border border-border rounded-lg p-4 flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
                  <StatusBadge status={value} />
                </div>
              ))}
            </div>
            {analysis.spoofing.mismatch && (
              <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-rose-400 font-medium text-sm">Domain Mismatch Detected — Likely Spoofed!</p>
                  <p className="text-rose-400/70 text-xs mt-1">
                    <strong>From:</strong> {analysis.spoofing.fromDomain} &nbsp;|&nbsp; <strong>Return-Path:</strong> {analysis.spoofing.returnPathDomain}
                  </p>
                </div>
              </div>
            )}
            
            {analysis.anomalies.length > 0 && (
              <div className="mt-4 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-rose-400 font-medium text-sm">Anomalies Detected</p>
                  <ul className="list-disc pl-4 mt-2 text-rose-400/70 text-xs space-y-1">
                    {analysis.anomalies.map((anomaly, idx) => (
                      <li key={idx}>{anomaly}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {analysis.bec.score > 0 && (
              <div className="mt-4 flex flex-col gap-3 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <p className="text-rose-400 font-medium text-sm">BEC Threat Analysis</p>
                  <span className="ml-auto text-xs font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Risk Score: {analysis.bec.score}/100
                  </span>
                </div>
                <ul className="list-disc pl-4 text-rose-400/70 text-xs space-y-1">
                  {analysis.bec.threats.map((threat, idx) => (
                    <li key={idx}>{threat}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.trackingPixels > 0 && (
              <div className="mt-4 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <Bug className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 font-medium text-sm">Tracking Pixels Detected ({analysis.trackingPixels})</p>
                  <p className="text-amber-400/70 text-xs mt-1">
                    Invisible 1x1 images were found in the HTML body. Attackers use these to know if and when you opened the email.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Extracted IOCs */}
          {analysis.iocs.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4 text-rose-400" />
                Extracted Indicators of Compromise (IOCs)
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {analysis.iocs.map((ioc, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background/40 border border-white/5 rounded-lg gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                        ioc.type === 'url' ? 'bg-indigo-500/10 text-indigo-400' :
                        ioc.type === 'ip' ? 'bg-emerald-500/10 text-emerald-400' :
                        ioc.type === 'crypto' ? 'bg-fuchsia-500/10 text-fuchsia-400' :
                        ioc.type === 'finance' ? 'bg-yellow-500/10 text-yellow-400' :
                        ioc.type === 'social' ? 'bg-sky-500/10 text-sky-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {ioc.type === 'finance' && <CreditCard className="w-3 h-3" />}
                        {ioc.type === 'social' && <MessageCircle className="w-3 h-3" />}
                        {ioc.type}
                      </span>
                      <span className="text-sm font-mono text-foreground break-all">{ioc.defanged}</span>
                    </div>
                    {ioc.pivots && ioc.pivots.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {ioc.pivots.map(pivot => (
                          <a
                            key={pivot.name}
                            href={pivot.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] bg-muted hover:bg-accent text-muted-foreground hover:text-cyan-400 px-2 py-1 rounded transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {pivot.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decoded Body */}
          {analysis.bodyDecoded && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Decoded Email Body (Preview)
                </h3>
                <button 
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-xs bg-muted hover:bg-accent border border-border px-3 py-1.5 rounded transition-colors text-foreground"
                >
                  {showPreview ? <Code className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPreview ? "View Source" : "Visual Preview"}
                </button>
              </div>
              
              {showPreview ? (
                <div className="bg-white rounded-lg p-2 h-96 overflow-hidden border border-border">
                  <iframe 
                    srcDoc={analysis.bodyDecoded}
                    sandbox=""
                    className="w-full h-full border-none"
                    title="Visual Preview Sandbox"
                  />
                </div>
              ) : (
                <div className="bg-background/50 border border-border rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                    {analysis.bodyDecoded.length > 20000 
                      ? analysis.bodyDecoded.substring(0, 20000) + "\n\n... [TRUNCATED DUE TO LENGTH] ..." 
                      : analysis.bodyDecoded}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {/* Routing Path */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              Email Routing Path ({analysis.receivedHops.length} hops)
            </h3>
            <div className="space-y-2">
              {analysis.receivedHops.map((hop, idx) => (
                <div key={idx} className="border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors text-left"
                    onClick={() => setExpandedHop(expandedHop === idx ? null : idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-zinc-800 text-muted-foreground border border-border"}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{hop.from} → <span className="text-muted-foreground">{hop.by}</span></p>
                        {hop.ip && <p className="text-xs text-cyan-400 font-mono">{hop.ip}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hop.delay !== null && hop.delay > 0 && (
                        <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          +{hop.delay}s
                        </span>
                      )}
                      {hop.timestamp && <span className="text-xs text-muted-foreground hidden sm:block">{hop.timestamp}</span>}
                      {expandedHop === idx ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {expandedHop === idx && (
                    <div className="px-4 pb-4 bg-background/30">
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">{hop.raw}</pre>
                    </div>
                  )}
                </div>
              ))}
              {analysis.receivedHops.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">No Received headers found.</p>
              )}
            </div>
          </div>

          {/* Attachments */}
          {analysis.attachments.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                Attachments ({analysis.attachments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.attachments.map((att, idx) => (
                  <div key={idx} className="bg-background/40 border border-border rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-foreground break-all">{att.filename}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase tracking-wider">{att.size || "Unknown Size"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-col gap-1">
                        <p>Type: <span className="text-foreground font-mono">{att.contentType}</span></p>
                        {att.hash && (
                          <p>SHA256: <span className="text-fuchsia-400 font-mono break-all">{att.hash}</span></p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      {att.base64 && (
                        <button
                          onClick={() => {
                            try {
                              const binaryStr = atob(att.base64!);
                              const len = binaryStr.length;
                              const bytes = new Uint8Array(len);
                              for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
                              const blob = new Blob([bytes], { type: att.contentType });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = att.filename;
                              a.click();
                              URL.revokeObjectURL(url);
                            } catch(e) {
                              alert("Failed to download attachment");
                            }
                          }}
                          className="text-xs flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded transition-colors text-cyan-400 font-medium w-full justify-center"
                        >
                          <Download className="w-3 h-3" />
                          Download Payload
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
