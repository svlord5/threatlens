import { BookOpen, ArrowLeft, Terminal, ChevronRight, Mail, ShieldAlert, Paperclip, Globe } from "lucide-react";
import Link from "next/link";
import React from "react";

export const dynamic = "force-static";

export default function Project2GuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Back Button */}
      <Link href="/dashboard/guide" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-fit px-3 py-1.5 rounded-full hover:bg-muted border border-transparent hover:border-border group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Internal Guide
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          Internal SOC Documentation
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Project 2: Email Forensics Analysis
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          A complete operational guide on analyzing suspicious phishing emails using ThreatLens&apos;s native Email Forensics Analyzer — without executing a single file.
        </p>
      </div>

      <hr className="border-border" />

      <div className="space-y-12">

        {/* Phase 1 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 1: Header Extraction & Metadata Analysis</h2>
              <p className="text-muted-foreground mt-1">Understanding the identity of the email.</p>
            </div>
          </div>
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Raw email headers contain a wealth of forensic information — the real sender&apos;s IP, the mail client used, reply-to discrepancies, and more. Start by extracting the full headers from your phishing sample.
            </p>
            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Open your phishing email sample (in Thunderbird, Gmail, etc.) and select <strong>&quot;Show Original&quot;</strong> or <strong>&quot;View Source&quot;</strong> to access the raw headers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Navigate to <strong>Email Forensics</strong> in the ThreatLens sidebar and paste the full raw content into the analyzer.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Click <strong>Analyze Email</strong>. The tool will instantly extract the From, Reply-To, X-Originating-IP, X-Mailer, and Message-ID for your report.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 2 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 2: Spoofing Indicator Detection</h2>
              <p className="text-muted-foreground mt-1">Verifying sender authenticity through SPF, DKIM, and DMARC.</p>
            </div>
          </div>
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Phishing emails almost always spoof a trusted domain (e.g., <code>security@microsoft.com</code>). The authentication protocols SPF, DKIM, and DMARC exist precisely to detect this. A <strong>FAIL</strong> on any of these is a definitive spoofing indicator.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: "SPF", desc: "Checks if the sending server's IP is authorized to send for the From domain." },
                { label: "DKIM", desc: "Verifies the email's cryptographic signature to ensure it wasn't tampered with in transit." },
                { label: "DMARC", desc: "Policy layer that checks if SPF and DKIM align with the From domain." },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-muted border border-border rounded-xl p-4">
                  <h4 className="text-foreground font-semibold text-sm mb-1">{label}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>After analysis, the <strong>Spoofing & Authentication</strong> section automatically shows SPF, DKIM, and DMARC status badges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>If ThreatLens detects a <strong>domain mismatch</strong> between the From header and the Return-Path, a red alert will fire. Document this in your report as a confirmed spoofing indicator.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 3 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 3: Routing Path Reconstruction</h2>
              <p className="text-muted-foreground mt-1">Tracing the email&apos;s hop-by-hop journey back to its origin.</p>
            </div>
          </div>
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Each mail server the email passes through adds a <code>Received:</code> header at the top of the stack. By reading these in reverse order, you can trace the complete routing path from the attacker&apos;s server to your inbox.
            </p>
            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>The <strong>Email Routing Path</strong> section shows each hop numbered from origin (Hop 1) to destination. Click any hop to expand it and view the raw header.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>The extracted IP address from each hop is highlighted in cyan. Take the <strong>first hop&apos;s IP</strong> — this is the originating mail server IP (the attacker&apos;s infrastructure).</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>Copy that IP into the <strong>OSINT Engine</strong> to geolocate the attacker, check it against abuse databases, and see if it&apos;s a known malicious host.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Phase 4 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Paperclip className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Phase 4: Safe Attachment Analysis</h2>
              <p className="text-muted-foreground mt-1">Extracting attachment metadata without executing any file.</p>
            </div>
          </div>
          <div className="pl-16 space-y-4">
            <p className="text-foreground leading-relaxed">
              Phishing emails commonly embed malicious payloads in attachments (.zip, .exe, .docm). You must analyze the attachment metadata (filename, content-type, encoding) without ever opening or executing the file.
            </p>
            <div className="bg-muted border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                How to use it for your project:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>ThreatLens automatically parses MIME boundaries in the pasted email content and lists all detected attachments with their filename, Content-Type, and encoding in the <strong>Attachments Detected</strong> section.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Never download or execute files. Instead, use the filename and Content-Type from ThreatLens to search for the exact attachment hash on <strong>VirusTotal</strong> via the OSINT Engine.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Document the filename, MIME type, and encoding in your report as forensic evidence of a malicious payload delivery attempt.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
