import { BookOpen, Command, Activity, ShieldAlert, Target, Search, Shield, Lock, Zap, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-static";

export default function GuidePage() {
  const guides = [
    {
      id: "executive-summary",
      title: "Executive Summary",
      icon: Command,
      color: "text-blue-500",
      description: "The primary command center providing a high-level, real-time overview of the entire Security Operations Center.",
      features: [
        "Live WebSocket Tracking: The top statistical cards (Total IOCs, High Risk IOCs, Active Cases) are wired directly to Supabase Realtime via WebSockets. They tick up instantly without requiring a page refresh when data changes.",
        "Interactive Threat Globe: A stunning 3D WebGL visualization of global cyber threats and geoblocked IP locations.",
        "Recent Activity Feed: A dynamically generated live feed showing the most recent incidents and cases logged into the platform by the SOC team.",
        "Threat Ingestion Trends: A visual chart mapping the volume of incoming threat data over time."
      ]
    },
    {
      id: "active-cases",
      title: "SOC Investigation Center (Active Cases)",
      icon: Activity,
      color: "text-rose-500",
      description: "The core Digital Forensics and Incident Response (DFIR) workspace for managing live cyber attacks and tracking incident response lifecycles.",
      features: [
        "Case Matrix: A detailed administrative table displaying the severity, status (Open, Investigating, Contained, Closed), and assigned primary analyst for every open incident.",
        "Investigation Timeline: A dynamic, chronological event log where analysts can document remediation steps taken during an investigation. It automatically timestamps the event and tags the user's Discord name to guarantee attribution.",
        "Evidence Vault: A secure digital attachment manager designed to store malicious payloads, memory dumps, and forensic artifacts alongside their calculated SHA256 hashes.",
        "Hex & PCAP Analysis: Embedded widgets allowing Level 2 analysts to natively parse network packet captures (.pcap) and inspect raw binary files directly in the browser."
      ]
    },
    {
      id: "threat-feeds",
      title: "Threat Feeds",
      icon: ShieldAlert,
      color: "text-orange-500",
      description: "Automated intelligence ingestion pipelines designed to keep the SOC updated on the latest global threat landscapes.",
      features: [
        "RSS Integration: Automatically pulls the latest CVEs, zero-day disclosures, and intelligence from trusted sources like BleepingComputer, CISA Alerts, and The Hacker News.",
        "Custom Feed Configuration: Administrators can effortlessly add, pause, or remove external RSS/JSON feeds to tailor the intelligence flow to their specific organizational needs.",
        "Auto-Enrichment: Parses incoming intelligence to extract potential IOCs (IPs, Domains) for direct insertion into the IOC Database."
      ]
    },
    {
      id: "ioc-database",
      title: "IOC Database",
      icon: Target,
      color: "text-red-500",
      description: "The central nervous system of the platform, tracking bad IPs, malicious domains, and known payload hashes.",
      features: [
        "Multi-Type Support: Natively supports IPv4, IPv6, Domains, URLs, SHA256, MD5, SHA1, Email Addresses, and Registry Keys.",
        "Automated Expiration (TTL): Indicators of Compromise are assigned a Time-To-Live. When they expire, they visually turn red to notify analysts that the indicator may no longer be reliable or might have been sinkholed.",
        "Confidence & Risk Scoring: Rank IOCs from 0-100 based on the reliability of the intelligence source and the potential impact of the indicator.",
        "Tagging System: Dynamically tag indicators with labels like 'Ransomware', 'APT29', or 'Phishing' for easy filtering and correlation."
      ]
    },
    {
      id: "threatlens",
      title: "ThreatLens (Attack Surface & Intelligence)",
      icon: Search,
      color: "text-emerald-500",
      description: "A specialized, multi-tab intelligence hub for tracking advanced persistent threats (APTs) and managing external attack surfaces.",
      features: [
        "Domain Intelligence: Actively monitors organizational domains for SSL certificate expiration, DNS hijacking, open ports, and cloud misconfigurations.",
        "Threat Actors Database: Maintains detailed profiles on known APT groups, including their origin countries, common aliases, and MITRE ATT&CK IDs.",
        "Campaign Tracking: Maps specific historical cyber attacks (e.g., SolarWinds, Log4j) to targeted industry sectors and the responsible threat actors.",
        "Malware Families: A catalog of ransomware strains, wipers, and trojans tied back to the threat actors who created and deploy them."
      ]
    },
    {
      id: "osint-engine",
      title: "OSINT Engine",
      icon: Activity,
      color: "text-indigo-500",
      description: "A suite of Open Source Intelligence gathering tools for passive reconnaissance.",
      features: [
        "Passive DNS & Whois: Quickly look up domain registration details and historical IP resolutions without tipping off the adversary by interacting with their infrastructure directly.",
        "Dark Web Sentiment: Monitors underground forums, ransomware leak sites, and Telegram channels for mentions of your organization's assets or leaked credentials."
      ]
    },
    {
      id: "api-security",
      title: "API Security Workspace",
      icon: Shield,
      color: "text-rose-400",
      description: "A dedicated vulnerability management module tailored for application security engineers.",
      features: [
        "Vulnerability Matrix: A beautifully color-coded table exclusively tracking BOLA, BFLA, IDOR, Mass Assignment, and Injection flaws in internal APIs.",
        "Method Parsing: Intelligently extracts and highlights the HTTP Method (GET, POST, DELETE, PUT) from the raw endpoint path and renders it in a styled badge.",
        "Risk Scoring Translation: Converts 0-100 severity scores into instantly recognizable CRITICAL, HIGH, MEDIUM, and LOW badges for rapid triaging.",
        "PoC Tracking: Logs exact replication steps and Proof of Concept payloads to assist developers in reproducing and patching the vulnerability."
      ]
    },
    {
      id: "iam-security",
      title: "IAM & Platform Security",
      icon: Lock,
      color: "text-muted-foreground",
      description: "The underlying authorization, authentication, and anti-exfiltration engine powering the SOC.",
      features: [
        "Discord OAuth SSO: Strict Single Sign-On requirement forcing all users to authenticate via Discord, entirely removing password management.",
        "Role-Based Access Control (RBAC): Every login attempt is strictly verified against an allowed list inside the `iam_discord_invites` database table.",
        "Read-Only Mode: Analysts flagged as 'read-only' have all modification forms, submission buttons, and destructive actions (Add IOC, Log Evidence, Add Finding) completely stripped from their UI.",
        "Super Admin Bypass: Hardcoded administrative Discord IDs bypass all session limits, RBAC restrictions, and invite requirements.",
        "Anti-Exfiltration Watermarking: Flashes the user's Discord ID dynamically on the screen during the session to heavily deter insider threats from taking malicious screenshots."
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-2 pb-6 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-500" />
          Platform Guide
        </h1>
        <p className="text-muted-foreground text-base">
          A comprehensive manual outlining the architecture, features, and capabilities of the Cyber Threat Intelligence Platform.
        </p>
      </div>

      {/* Project Operations Guides */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-rose-500" />
          Project Operations Guides
        </h2>
        <p className="text-sm text-muted-foreground">Step-by-step internal guides tailored to specific SOC projects.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/dashboard/guide/project1" className="bg-card border border-border hover:border-border hover:bg-muted transition-all p-5 rounded-xl group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Project 1</h3>
              <p className="text-xs text-muted-foreground">SIEM Setup & Log Ingestion</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 mt-4 group-hover:translate-x-1 transition-transform">
              View Guide <ChevronRight className="w-3 h-3" />
            </div>
          </Link>

          <Link href="/dashboard/guide/project2" className="bg-card border border-border hover:border-border hover:bg-muted transition-all p-5 rounded-xl group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Project 2</h3>
              <p className="text-xs text-muted-foreground">Email Forensics Analysis</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-cyan-400 mt-4 group-hover:translate-x-1 transition-transform">
              View Guide <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
          
          <Link href="/dashboard/guide/project4" className="bg-card border border-border hover:border-border hover:bg-muted transition-all p-5 rounded-xl group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Project 4</h3>
              <p className="text-xs text-muted-foreground">Android Mobile Forensics</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-violet-400 mt-4 group-hover:translate-x-1 transition-transform">
              View Guide <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
          
          <Link href="/dashboard/guide/project6" className="bg-card border border-border hover:border-border hover:bg-muted transition-all p-5 rounded-xl group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Project 6</h3>
              <p className="text-xs text-muted-foreground">Threat Intelligence Analysis</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-indigo-400 mt-4 group-hover:translate-x-1 transition-transform">
              View Guide <ChevronRight className="w-3 h-3" />
            </div>
          </Link>

          <Link href="/dashboard/guide/project10" className="bg-card border border-border hover:border-border hover:bg-muted transition-all p-5 rounded-xl group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Project 10</h3>
              <p className="text-xs text-muted-foreground">IOC Hunting in Logs</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-rose-400 mt-4 group-hover:translate-x-1 transition-transform">
              View Guide <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      </div>

      <div className="pt-4 space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          Core Modules Documentation
        </h2>
        {guides.map((guide) => (
          <div key={guide.id} className="bg-card border border-border rounded-xl overflow-hidden group hover:border-border transition-colors">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border ${guide.color}`}>
                  <guide.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{guide.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 pl-16">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Key Features</h3>
                {guide.features.map((feature, idx) => {
                  const [title, ...rest] = feature.split(': ');
                  const description = rest.join(': ');
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        {description ? (
                          <>
                            <span className="text-foreground font-medium">{title}: </span>
                            <span className="text-muted-foreground">{description}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">{title}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
