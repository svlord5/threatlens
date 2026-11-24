import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldAlert, AlertTriangle, Fingerprint, Activity, Network } from "lucide-react";
import { ActorComparisonChart, MitreTacticsChart } from "@/components/blog/Charts";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Q2 2026 Campaign Analysis | ThreatLens by Suraj Vishwanath',
  description: 'A structural analysis of Volt Typhoon, Scattered Spider, and Midnight Blizzard cyber campaigns. Abstracted into the MITRE ATT&CK framework by Suraj Vishwanath.',
  authors: [{ name: 'Suraj Vishwanath', url: 'https://surajv5.in' }],
  openGraph: {
    title: 'Q2 2026 Campaign Analysis | ThreatLens by Suraj Vishwanath',
    description: 'A structural analysis of Volt Typhoon, Scattered Spider, and Midnight Blizzard cyber campaigns. Abstracted into the MITRE ATT&CK framework by Suraj Vishwanath.',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Q2 2026 Campaign Analysis | ThreatLens by Suraj Vishwanath',
    description: 'A structural analysis of Volt Typhoon, Scattered Spider, and Midnight Blizzard cyber campaigns. Abstracted into the MITRE ATT&CK framework by Suraj Vishwanath.',
  },
};

const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
  <span 
    tabIndex={0}
    className="group relative inline-block border-b border-dashed border-indigo-400/70 cursor-help text-indigo-300 transition-colors hover:text-indigo-200 focus:outline-none"
  >
    {children}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none w-64 max-w-[85vw] p-3 bg-muted border border-zinc-700 text-xs text-foreground rounded-md shadow-2xl z-10 text-left font-sans leading-relaxed">
      {text}
    </span>
  </span>
);

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-card text-foreground selection:bg-indigo-500/30 font-sans pb-24 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm font-medium">
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Articles</span>
          </Link>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight leading-none mb-1 text-foreground">ThreatLens</span>
              <span className="text-[11px] sm:text-xs text-muted-foreground flex flex-wrap sm:flex-nowrap items-center gap-1 mt-0.5">
                <span className="hidden sm:inline">Researched & Built by</span>
                <span className="sm:hidden">By</span>
                <a href="https://surajv5.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-foreground hover:text-indigo-400 transition-colors whitespace-nowrap">
                  <img src="/api/avatar?u=https%3A%2F%2Fsurajv5.in%2Ficons%2FIcon.png" referrerPolicy="no-referrer" alt="Suraj Vishwanath" className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                  Suraj Vishwanath
                </a>
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        
        {/* Header */}
        <header className="mb-12 sm:mb-16">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                Threat Intel Report
              </span>
              <span className="text-xs sm:text-sm font-mono text-muted-foreground">June 27, 2026</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4 sm:mb-6 leading-snug">
              Q2 2026 Campaign Analysis: Volt Typhoon, Scattered Spider, & Midnight Blizzard
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10">
              A highly granular, structural analysis of three profoundly sophisticated cyber campaigns. We abstract their execution flows into the <a href="https://attack.mitre.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">MITRE ATT&CK framework</a> and identify critical, proactive Indicators of Compromise (IOCs).
            </p>
          </div>

          {/* Author Details */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6 border-y border-white/5 text-center sm:text-left">
            <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
              <img src="/api/avatar?u=https%3A%2F%2Fsurajv5.in%2Ficons%2FIcon.png" referrerPolicy="no-referrer" alt="Suraj Vishwanath" className="w-full h-full rounded-full object-cover bg-card" />
            </div>
            <div>
              <div className="text-foreground font-bold tracking-tight">Suraj Vishwanath</div>
              <div className="text-muted-foreground text-sm">Cybersecurity Student & Developer</div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-white/10 mx-4"></div>
            <div className="w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0 mt-2 sm:mt-0">
              <div className="text-muted-foreground text-sm">Published in</div>
              <div className="text-indigo-400 font-bold text-sm tracking-tight flex items-center justify-center sm:justify-start gap-1.5"><ShieldAlert className="w-3.5 h-3.5 shrink-0" /> ThreatLens Intelligence</div>
            </div>
          </div>
        </header>

        {/* Executive Summary */}
        <div className="mb-20 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            Executive Summary & Key Takeaways
          </h2>
          <ul className="space-y-3 text-foreground list-disc list-inside marker:text-indigo-500 text-sm sm:text-base">
            <li><strong className="text-foreground">Volt Typhoon</strong> has completely pivoted from espionage to pre-positioning for destructive attacks on US Critical Infrastructure, relying strictly on fileless LotL techniques.</li>
            <li><strong className="text-foreground">Scattered Spider</strong> is accelerating ransomware deployments by bypassing MFA via highly aggressive Help Desk vishing and MFA fatigue attacks.</li>
            <li><strong className="text-foreground">Midnight Blizzard</strong> is targeting identity infrastructure (Azure AD / Entra ID) by abusing OAuth applications and Service Principals for silent, persistent email exfiltration.</li>
          </ul>
        </div>

        {/* Charts Section */}
        <section className="mb-24 space-y-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-4">Executive Threat Landscape</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActorComparisonChart />
            <MitreTacticsChart />
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto">
            *Figure 1: Comparative capability analysis and tactic frequency based on observed Q2 2026 incident response telemetry.*
          </p>
        </section>

        {/* Actor 1: Volt Typhoon */}
        <section className="mb-24 relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              <Network className="w-7 h-7 text-rose-500" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-foreground tracking-tight">Volt Typhoon</h2>
              <p className="text-rose-400 font-mono text-sm uppercase tracking-widest mt-1">PRC State-Sponsored • G1017</p>
            </div>
          </div>
          
          <div className="prose prose-invert prose-zinc max-w-none mb-10">
            <p className="text-lg leading-relaxed text-foreground">
              Unlike traditional state-sponsored espionage groups whose primary objective is the extraction of intellectual property or corporate secrets, Volt Typhoon has demonstrated a chilling pivot in strategic intent. Their primary focus is <strong>pre-positioning</strong> within the networks of U.S. Critical Infrastructure (such as energy, communications, and water treatment facilities). The objective is to establish deep, dormant, and highly stealthy access that can be rapidly weaponized to <Tooltip text="Disruptive attacks aim to render systems inoperable (e.g., ransomware), while destructive attacks aim to permanently destroy hardware or data (e.g., wiper malware).">disrupt or destroy</Tooltip> critical services during moments of elevated geopolitical tension.
            </p>
            <p className="text-lg leading-relaxed text-foreground">
              The absolute defining characteristic of Volt Typhoon is their strict adherence to <strong>Living-off-the-Land (LotL)</strong> techniques. They exhibit extreme operational discipline, aggressively avoiding the deployment of custom, compiled malware to the victim&apos;s disk. Instead, they seamlessly blend into background noise by hijacking native operating system administration tools—such as <code>PowerShell</code>, <code>Windows Management Instrumentation (WMI)</code>, and <code>netsh</code>—to execute their objectives. Because these tools are essential to standard IT operations, their abuse is incredibly difficult to detect using traditional signature-based <Tooltip text="Endpoint Detection and Response (EDR) platforms monitor endpoint and network events and record the information in a central database where further analysis, detection, investigation, and reporting occur.">EDR solutions</Tooltip>.
            </p>
            <p className="text-lg leading-relaxed text-foreground">
              Furthermore, to obfuscate their <Tooltip text="Command and Control (C2) is the infrastructure an attacker uses to communicate with compromised systems, issue commands, and exfiltrate data.">Command & Control (C2)</Tooltip> traffic, they route malicious payloads through the heavily publicized <strong>KV Botnet</strong>. This botnet is comprised of thousands of compromised, end-of-life Small Office/Home Office (SOHO) routers located globally, though primarily within the United States. This routing makes their attacks appear as legitimate domestic web traffic, easily bypassing geofencing rules.
            </p>
          </div>

          <div className="bg-muted border border-border rounded-xl p-8 mb-8 shadow-xl">
            <h3 className="text-foreground font-bold text-lg mb-6 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-rose-400" />
              Indicators of Compromise (IOCs) & Hunting Directives
            </h3>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex items-start gap-4">
                <span className="text-rose-400 shrink-0 font-bold min-w-[100px]">Behavioral:</span>
                <span className="text-muted-foreground leading-relaxed">Alert on unexplained spikes in `wmic process call create`, `ntdsutil`, or `netsh portproxy` usage, particularly when executed by non-administrative service accounts or originating from web application worker processes (e.g., w3wp.exe).</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-rose-400 shrink-0 font-bold min-w-[100px]">Network:</span>
                <span className="text-muted-foreground leading-relaxed">Anomalous inbound administrative connections (SSH, RDP) originating directly from residential ISP IP blocks communicating directly with edge firewalls, completely bypassing corporate VPNs.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-rose-400 shrink-0 font-bold min-w-[100px]">Artifacts:</span>
                <span className="text-muted-foreground leading-relaxed">The presence of tools like Fast Reverse Proxy (FRP) or EarthWorm, or unexpected heavily obfuscated `.bat` or `.ps1` files residing in `C:\Windows\Temp` or `C:\PerfLogs`.</span>
              </li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-muted border border-border p-5 rounded-xl hover:border-rose-500/50 transition-colors">
              <div className="text-xs font-mono text-muted-foreground mb-2">MITRE: <a href="https://attack.mitre.org/techniques/T1190/" target="_blank" className="text-rose-400 hover:underline">T1190</a></div>
              <div className="font-bold text-foreground text-lg">Exploit Public-Facing App</div>
              <p className="text-xs text-muted-foreground mt-2">Exploiting zero-days in Fortinet and Ivanti edge appliances to gain initial access.</p>
            </div>
            <div className="bg-muted border border-border p-5 rounded-xl hover:border-rose-500/50 transition-colors">
              <div className="text-xs font-mono text-muted-foreground mb-2">MITRE: <a href="https://attack.mitre.org/techniques/T1059/001/" target="_blank" className="text-rose-400 hover:underline">T1059.001</a></div>
              <div className="font-bold text-foreground text-lg">PowerShell Execution</div>
              <p className="text-xs text-muted-foreground mt-2">Executing entirely fileless payloads in memory using native scripting tools.</p>
            </div>
            <div className="bg-muted border border-border p-5 rounded-xl hover:border-rose-500/50 transition-colors">
              <div className="text-xs font-mono text-muted-foreground mb-2">MITRE: <a href="https://attack.mitre.org/techniques/T1090/002/" target="_blank" className="text-rose-400 hover:underline">T1090.002</a></div>
              <div className="font-bold text-foreground text-lg">External Proxy Routing</div>
              <p className="text-xs text-muted-foreground mt-2">Routing all C2 traffic through the SOHO KV Botnet to evade geographic blocks.</p>
            </div>
          </div>
          
          {/* Volt Typhoon KQL */}
          <div className="mb-8">
            <h4 className="text-foreground font-bold mb-3 text-sm uppercase tracking-widest text-rose-400">Detection Engineering (KQL)</h4>
            <div className="bg-[#09090b] border border-rose-500/20 rounded-xl p-5 overflow-x-auto relative group">
              <div className="absolute top-3 right-3 text-xs text-rose-500/50 font-mono">Microsoft Sentinel</div>
              <pre className="text-sm font-mono text-foreground">
<span className="text-rose-400">DeviceProcessEvents</span>
<br/>| <span className="text-blue-400">where</span> FileName <span className="text-blue-400">in~</span> (<span className="text-green-400">&quot;wmic.exe&quot;</span>, <span className="text-green-400">&quot;ntdsutil.exe&quot;</span>, <span className="text-green-400">&quot;netsh.exe&quot;</span>)
<br/>| <span className="text-blue-400">where</span> ProcessCommandLine <span className="text-blue-400">has_any</span> (<span className="text-green-400">&quot;process call create&quot;</span>, <span className="text-green-400">&quot;portproxy&quot;</span>)
<br/>| <span className="text-blue-400">where</span> InitiatingProcessAccountName <span className="text-blue-400">!contains</span> <span className="text-green-400">&quot;admin&quot;</span>
<br/>| <span className="text-blue-400">project</span> TimeGenerated, DeviceName, FileName, ProcessCommandLine, InitiatingProcessAccountName
              </pre>
            </div>
          </div>
        </section>

        {/* Actor 2: Scattered Spider */}
        <section className="mb-24 relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-foreground tracking-tight">Scattered Spider</h2>
              <p className="text-amber-400 font-mono text-sm uppercase tracking-widest mt-1">Financially Motivated • UNC3944</p>
            </div>
          </div>
          
          {/* Attack Chain */}
          <div className="mb-10 p-6 bg-muted/50 border border-amber-500/10 rounded-xl">
            <h4 className="text-foreground font-bold mb-6 text-sm uppercase tracking-widest text-amber-400 text-center">Typical Attack Chain</h4>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm font-mono">
              <div className="bg-amber-500/10 text-amber-300 px-3 py-2 rounded-lg text-center w-full sm:w-auto">1. OSINT Recon</div>
              <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground shrink-0" />
              <div className="bg-amber-500/10 text-amber-300 px-3 py-2 rounded-lg text-center w-full sm:w-auto">2. Help Desk Vishing</div>
              <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground shrink-0" />
              <div className="bg-amber-500/10 text-amber-300 px-3 py-2 rounded-lg text-center w-full sm:w-auto">3. MFA Fatigue</div>
              <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground shrink-0" />
              <div className="bg-amber-500/10 text-amber-300 px-3 py-2 rounded-lg text-center w-full sm:w-auto">4. RMM / Ransomware</div>
            </div>
          </div>

          <div className="prose prose-invert prose-zinc max-w-none mb-10">
            <p className="text-lg leading-relaxed text-foreground">
              Scattered Spider (also tracked as UNC3944 or Octo Tempest) is arguably one of the most effective and aggressive financially motivated threat groups operating today. Rather than investing months into developing custom exploits for technical vulnerabilities, they exploit the weakest link in any organization: <strong>the human element</strong>. Their social engineering tactics are brazen, highly researched, and incredibly successful, leading to devastating ransomware deployments (often acting as affiliates for the ALPHV/BlackCat or DragonForce <Tooltip text="Ransomware-as-a-Service (RaaS) is a business model where ransomware developers lease their malware variants to affiliates who then perform the actual attacks.">RaaS operators</Tooltip>).
            </p>
            <p className="text-lg leading-relaxed text-foreground">
              They are notorious for their flawless <strong>Help Desk Impersonation (Vishing)</strong> campaigns. The group performs extensive open-source reconnaissance on a target company&apos;s employees, frequently leveraging LinkedIn data. They then call the corporate IT Help Desk, utilizing native-English speakers and spoofed phone numbers, impersonating the employee. Their goal is to convince the Help Desk agent to reset a password or, crucially, bypass an existing Multi-Factor Authentication (MFA) device by registering a new device controlled by the attackers.
            </p>
            <p className="text-lg leading-relaxed text-foreground">
              If they already possess compromised credentials but are blocked by an authenticator app, they utilize <strong>MFA Fatigue</strong> (also known as <Tooltip text="A technique where an attacker repeatedly triggers MFA push notifications to a user's phone, hoping the user will eventually approve the request out of annoyance or confusion.">Push Bombing</Tooltip>). They will spam the victim&apos;s mobile device with dozens of MFA approval requests. Often, they will concurrently call the victim, claiming to be from corporate IT, stating that there is a &quot;system sync error&quot; and urging them to simply accept the prompt on their phone to stop the notifications. Once inside, they eschew custom malware, instead deploying commercially available <strong>Remote Monitoring and Management (RMM)</strong> tools like AnyDesk, ScreenConnect, or Atera to guarantee persistent access.
            </p>
          </div>

          <div className="bg-muted border border-border rounded-xl p-8 mb-8 shadow-xl">
            <h3 className="text-foreground font-bold text-lg mb-6 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-amber-400" />
              Indicators of Compromise (IOCs) & Hunting Directives
            </h3>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex items-start gap-4">
                <span className="text-amber-400 shrink-0 font-bold min-w-[100px]">Behavioral:</span>
                <span className="text-muted-foreground leading-relaxed">Alert on the sudden registration of new MFA hardware tokens, FIDO2 keys, or authenticator apps to high-privilege accounts, especially if preceded by a password reset initiated by the Help Desk.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-amber-400 shrink-0 font-bold min-w-[100px]">Network:</span>
                <span className="text-muted-foreground leading-relaxed">Unexpected outbound connections to domains associated with legitimate RMM tools (`anydesk.com`, `ngrok.io`, `screenconnect.com`, `splashtop.com`) originating from internal application servers or domain controllers.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-amber-400 shrink-0 font-bold min-w-[100px]">Identity:</span>
                <span className="text-muted-foreground leading-relaxed">High volume of failed MFA attempts (push rejected) followed by a successful login, particularly if the successful login originates from a commercial VPN provider or anonymous proxy.</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-muted border border-border p-5 rounded-xl hover:border-amber-500/50 transition-colors">
              <div className="text-xs font-mono text-muted-foreground mb-2">MITRE: <a href="https://attack.mitre.org/techniques/T1566/002/" target="_blank" className="text-amber-400 hover:underline">T1566.002</a></div>
              <div className="font-bold text-foreground text-lg">Vishing & Social Eng</div>
              <p className="text-xs text-muted-foreground mt-2">Directly calling Help Desks to initiate password resets and MFA bypasses.</p>
            </div>
            <div className="bg-muted border border-border p-5 rounded-xl hover:border-amber-500/50 transition-colors">
              <div className="text-xs font-mono text-muted-foreground mb-2">MITRE: <a href="https://attack.mitre.org/techniques/T1556/006/" target="_blank" className="text-amber-400 hover:underline">T1556.006</a></div>
              <div className="font-bold text-foreground text-lg">MFA Manipulation</div>
              <p className="text-xs text-muted-foreground mt-2">Enrolling rogue devices via push-bombing and MFA fatigue tactics.</p>
            </div>
            <div className="bg-muted border border-border p-5 rounded-xl hover:border-amber-500/50 transition-colors">
              <div className="text-xs font-mono text-muted-foreground mb-2">MITRE: <a href="https://attack.mitre.org/techniques/T1219/" target="_blank" className="text-amber-400 hover:underline">T1219</a></div>
              <div className="font-bold text-foreground text-lg">Remote Access Software</div>
              <p className="text-xs text-muted-foreground mt-2">Deploying legitimate commercial RMM tools to maintain stealthy persistence.</p>
            </div>
          </div>

          {/* Scattered Spider KQL */}
          <div className="mt-8 mb-8">
            <h4 className="text-foreground font-bold mb-3 text-sm uppercase tracking-widest text-amber-400">Detection Engineering (KQL)</h4>
            <div className="bg-[#09090b] border border-amber-500/20 rounded-xl p-5 overflow-x-auto relative">
              <div className="absolute top-3 right-3 text-xs text-amber-500/50 font-mono">Microsoft Sentinel</div>
              <pre className="text-sm font-mono text-foreground">
<span className="text-amber-400">SigninLogs</span>
<br/>| <span className="text-blue-400">where</span> ResultType <span className="text-blue-400">==</span> <span className="text-green-400">&quot;500121&quot;</span> <span className="text-muted-foreground">{"//"} MFA Denied</span>
<br/>| <span className="text-blue-400">summarize</span> FailedMfaCount <span className="text-blue-400">=</span> count() <span className="text-blue-400">by</span> UserPrincipalName, bin(TimeGenerated, <span className="text-purple-400">10m</span>)
<br/>| <span className="text-blue-400">where</span> FailedMfaCount <span className="text-blue-400">&gt;</span> <span className="text-purple-400">5</span> <span className="text-muted-foreground">{"//"} Threshold for MFA Fatigue</span>
<br/>| <span className="text-blue-400">join</span> kind=inner (
<br/>    SigninLogs | <span className="text-blue-400">where</span> ResultType <span className="text-blue-400">==</span> <span className="text-green-400">&quot;0&quot;</span> <span className="text-muted-foreground">{"//"} Successful Login</span>
<br/>) <span className="text-blue-400">on</span> UserPrincipalName
              </pre>
            </div>
          </div>
        </section>

        {/* Actor 3: Midnight Blizzard */}
        <section className="mb-10 relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <Activity className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-foreground tracking-tight">Midnight Blizzard</h2>
              <p className="text-blue-400 font-mono text-sm uppercase tracking-widest mt-1">Russian SVR • APT29 • Cozy Bear</p>
            </div>
          </div>
          
          <div className="prose prose-invert prose-zinc max-w-none mb-10">
            <p className="text-lg leading-relaxed text-foreground">
              Midnight Blizzard, broadly attributed to the Russian Foreign Intelligence Service (SVR), is a highly patient, exceptionally resourced, and technologically advanced threat actor. While famous for orchestrating the historic SolarWinds supply-chain attack, their more recent campaigns demonstrate a profound shift toward exploiting cloud identity environments (specifically Azure AD / Microsoft Entra ID).
            </p>
            <p className="text-lg leading-relaxed text-foreground">
              They frequently gain initial access via meticulously planned, low-and-slow <strong>Password Spraying</strong> attacks. They will attempt a small handful of common passwords against thousands of legacy or non-production accounts across an organization, ensuring they stay well below account lockout thresholds and SIEM alerting thresholds. Once they compromise a non-MFA protected account, they immediately pivot to expanding their privileges.
            </p>
            <p className="text-lg leading-relaxed text-foreground">
              Their signature post-compromise maneuver is the abuse of <strong>OAuth applications</strong> and <Tooltip text="A Service Principal is the local representation, or application instance, of a global application object in a single tenant or directory. It acts as the identity for an application to access resources.">Service Principals</Tooltip>. Once they possess sufficient privileges, they create or modify malicious OAuth applications within the victim&apos;s cloud tenant. They grant these applications high-level API permissions (such as <code>Mail.Read</code> or <code>Directory.ReadWrite.All</code>). This grants them persistent, programmatic API access to siphon emails and documents silently in the background, entirely bypassing future MFA challenges or password resets. They have also been observed utilizing highly targeted spear-phishing emails containing malicious, cryptographically signed `.rdp` (Remote Desktop) files that automatically mount local drives to the attacker&apos;s server upon execution.
            </p>
          </div>

          <div className="bg-muted border border-border rounded-xl p-8 mb-8 shadow-xl">
            <h3 className="text-foreground font-bold text-lg mb-6 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-400" />
              Indicators of Compromise (IOCs) & Hunting Directives
            </h3>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex items-start gap-4">
                <span className="text-blue-400 shrink-0 font-bold min-w-[100px]">Identity:</span>
                <span className="text-muted-foreground leading-relaxed">Alert on the sudden assignment of highly privileged App Roles (e.g., `AppRoleAssignment.ReadWrite.All`, `RoleManagement.ReadWrite.Directory`) to previously dormant or newly created Azure AD Service Principals or Enterprise Applications.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-blue-400 shrink-0 font-bold min-w-[100px]">Network:</span>
                <span className="text-muted-foreground leading-relaxed">High volumes of Microsoft Graph API traffic querying specific user mailboxes, especially when the traffic originates from known residential proxy networks or ASN blocks not typical for business operations.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-blue-400 shrink-0 font-bold min-w-[100px]">Auth:</span>
                <span className="text-muted-foreground leading-relaxed">Successful authentications to cloud resources utilizing legacy authentication protocols (like IMAP or POP3) that deliberately bypass modern Conditional Access policies.</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-muted border border-border p-5 rounded-xl hover:border-blue-500/50 transition-colors">
              <div className="text-xs font-mono text-muted-foreground mb-2">MITRE: <a href="https://attack.mitre.org/techniques/T1110/003/" target="_blank" className="text-blue-400 hover:underline">T1110.003</a></div>
              <div className="font-bold text-foreground text-lg">Password Spraying</div>
              <p className="text-xs text-muted-foreground mt-2">Low-volume brute-forcing of legacy cloud accounts to avoid triggering rate limits.</p>
            </div>
            <div className="bg-muted border border-border p-5 rounded-xl hover:border-blue-500/50 transition-colors">
              <div className="text-xs font-mono text-muted-foreground mb-2">MITRE: <a href="https://attack.mitre.org/techniques/T1651/" target="_blank" className="text-blue-400 hover:underline">T1651</a></div>
              <div className="font-bold text-foreground text-lg">Cloud Admin Command</div>
              <p className="text-xs text-muted-foreground mt-2">Executing Microsoft Graph API calls via maliciously created OAuth applications.</p>
            </div>
            <div className="bg-muted border border-border p-5 rounded-xl hover:border-blue-500/50 transition-colors">
              <div className="text-xs font-mono text-muted-foreground mb-2">MITRE: <a href="https://attack.mitre.org/techniques/T1098/001/" target="_blank" className="text-blue-400 hover:underline">T1098.001</a></div>
              <div className="font-bold text-foreground text-lg">Account Manipulation</div>
              <p className="text-xs text-muted-foreground mt-2">Granting Exchange Full Access privileges to non-human Service Principals.</p>
            </div>
          </div>
        </section>

        {/* Strategic Outlook */}
        <section className="mb-24">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-border rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <h2 className="text-3xl font-extrabold text-foreground mb-6 tracking-tight">Strategic Outlook: Q3 2026 Predictions</h2>
            <div className="space-y-6 text-foreground text-lg leading-relaxed relative z-10">
              <p>
                As we transition into Q3 2026, the threat landscape will undeniably escalate. We assess with high confidence that <strong className="text-foreground">Scattered Spider</strong> will rapidly integrate AI-driven voice cloning (Deepfakes) into their vishing campaigns, making Help Desk impersonation nearly indistinguishable from legitimate employees.
              </p>
              <p>
                <strong className="text-foreground">Midnight Blizzard</strong> is expected to increase their focus on exploiting interconnected SaaS applications, moving beyond just Azure AD to target third-party integrations and CI/CD pipelines as initial entry vectors. Meanwhile, <strong className="text-foreground">Volt Typhoon</strong> will likely expand their pre-positioning efforts beyond the US, targeting allied critical infrastructure in the APAC region in response to shifting geopolitical dynamics.
              </p>
              <p className="font-bold text-foreground mt-8 border-l-4 border-indigo-500 pl-6 py-2 bg-indigo-500/5 rounded-r-lg">
                Defenders must pivot from signature-based detection to heavily investing in Identity Threat Detection and Response (ITDR) and robust behavioral analytics.
              </p>
            </div>
          </div>
        </section>

        {/* References Section */}
        <section className="mt-24 border-t border-border pt-10">
          <h2 className="text-xl font-bold text-foreground mb-6">References & Further Reading</h2>
          <ul className="space-y-3 text-sm text-muted-foreground list-disc list-inside">
            <li><a href="https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-144a" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 hover:underline transition-colors">CISA Advisory AA23-144A: PRC State-Sponsored Cyber Actor Living off the Land to Evade Detection</a></li>
            <li><a href="https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-320a" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 hover:underline transition-colors">CISA Advisory AA23-320A: Scattered Spider Threat Actor Profile</a></li>
            <li><a href="https://www.microsoft.com/en-us/security/blog/2024/01/25/midnight-blizzard-guidance-for-responders-on-nation-state-attack/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 hover:underline transition-colors">Microsoft Security Blog: Midnight Blizzard Guidance for Responders</a></li>
            <li><a href="https://attack.mitre.org/groups/G1017/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 hover:underline transition-colors">MITRE ATT&CK Group G1017 (Volt Typhoon)</a></li>
            <li><a href="https://attack.mitre.org/groups/G0016/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 hover:underline transition-colors">MITRE ATT&CK Group G0016 (APT29 / Midnight Blizzard)</a></li>
          </ul>
        </section>

      </main>
    </div>
  );
}
