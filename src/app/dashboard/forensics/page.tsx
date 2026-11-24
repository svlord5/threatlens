"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Activity, Clock, Shield, Terminal, Filter, Server, Laptop, Cpu, Smartphone, ArrowRight, Globe, Mail } from "lucide-react";
import { motion } from "framer-motion";

type OS = "Windows" | "Linux" | "macOS";

interface ForensicModule {
  id: string;
  name: string;
  description: string;
  os: OS[];
  icon: any;
  difficulty: "Easy" | "Medium" | "Hard";
}

const FORENSIC_MODULES: ForensicModule[] = [
  {
    id: "network-connections",
    name: "Live Network Connections",
    description: "Extract and analyze active TCP/UDP connections to hunt for C2 beacons and reverse shells.",
    os: ["Windows", "Linux", "macOS"],
    icon: Activity,
    difficulty: "Easy"
  },
  {
    id: "scheduled-tasks",
    name: "Scheduled Tasks & Cron",
    description: "Identify malware persistence mechanisms by extracting non-standard scheduled tasks.",
    os: ["Windows", "Linux"],
    icon: Clock,
    difficulty: "Medium"
  },
  {
    id: "auth-logs",
    name: "Authentication Logs",
    description: "Analyze login attempts, RDP brute forcing, and SSH key usage to detect unauthorized access.",
    os: ["Windows", "Linux"],
    icon: Shield,
    difficulty: "Easy"
  },
  {
    id: "process-list",
    name: "Running Processes",
    description: "Extract current process list with command-line arguments to find memory-resident threats.",
    os: ["Windows", "Linux", "macOS"],
    icon: Cpu,
    difficulty: "Medium"
  },
  {
    id: "browser-history",
    name: "Browser Artifacts",
    description: "Extract malicious extensions, downloads, and browsing history from Chromium/Firefox browsers.",
    os: ["Windows", "macOS"],
    icon: Search,
    difficulty: "Hard"
  }
];

export default function ForensicsLibrary() {
  const [selectedOS, setSelectedOS] = useState<OS>("Windows");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredModules = FORENSIC_MODULES.filter(m => 
    m.os.includes(selectedOS) && 
    (m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Forensics Library</h1>
          <p className="text-muted-foreground mt-1">Guided artifact extraction and AI-powered log analysis.</p>
        </div>
        
        {/* OS Selector */}
        <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
          <button 
            onClick={() => setSelectedOS("Windows")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedOS === "Windows" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Server className="w-4 h-4" /> Windows
          </button>
          <button 
            onClick={() => setSelectedOS("Linux")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedOS === "Linux" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Terminal className="w-4 h-4" /> Linux
          </button>
          <button 
            onClick={() => setSelectedOS("macOS")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedOS === "macOS" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Laptop className="w-4 h-4" /> macOS
          </button>
        </div>
      </div>

      {/* Featured Forensic Analyzers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/dashboard/forensics/app" 
          className="group p-4 rounded-xl bg-gradient-to-br from-rose-950/20 to-card border border-rose-500/30 hover:border-rose-500/60 transition-all flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Smartphone className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                Featured: GhostBat RAT
              </span>
            </div>
            <h3 className="font-semibold text-foreground text-sm group-hover:text-rose-400 transition-colors">
              App Malware Hunter & Dissector
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Dissect APK/mobile droppers, forged ZIP headers, native loaders, and C2 exfil infrastructure.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-rose-400 mt-3 group-hover:translate-x-0.5 transition-transform">
            Open Dissector <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link 
          href="/dashboard/forensics/website" 
          className="group p-4 rounded-xl bg-card border border-border hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Globe className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Web Recon
              </span>
            </div>
            <h3 className="font-semibold text-foreground text-sm group-hover:text-indigo-400 transition-colors">
              Website Forensics
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Scan live suspicious domains, uncover hidden phishing kits, forms, and network infrastructure.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-indigo-400 mt-3 group-hover:translate-x-0.5 transition-transform">
            Open Scanner <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link 
          href="/dashboard/forensics/email" 
          className="group p-4 rounded-xl bg-card border border-border hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Mail className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Phishing Triage
              </span>
            </div>
            <h3 className="font-semibold text-foreground text-sm group-hover:text-emerald-400 transition-colors">
              Email Forensics
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Analyze raw EML/MSG headers, SPF/DKIM/DMARC authentication, and malicious attachment IOCs.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 mt-3 group-hover:translate-x-0.5 transition-transform">
            Open Analyzer <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder={`Search ${selectedOS} modules...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      {filteredModules.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No modules found</h3>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((module, idx) => (
            <motion.div 
              key={module.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link 
                href={`/dashboard/forensics/analyze?module=${module.id}&os=${selectedOS}`}
                className="group flex flex-col h-full p-5 bg-card rounded-xl border border-border hover:border-indigo-500/50 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <module.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${
                    module.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    module.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {module.difficulty}
                  </span>
                </div>
                
                <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-indigo-400 transition-colors">
                  {module.name}
                </h3>
                <p className="text-sm text-muted-foreground flex-1">
                  {module.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
