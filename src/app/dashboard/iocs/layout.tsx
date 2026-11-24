import Link from "next/link";
import { Database, Target } from "lucide-react";

export default function IocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Sub-Navigation for IOCs Module */}
      <div className="flex items-center gap-1 bg-background/40 border border-white/5 p-1 rounded-lg w-fit mb-6">
        <Link 
          href="/dashboard/iocs" 
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-muted data-[active=true]:bg-indigo-500/10 data-[active=true]:text-indigo-400"
          // In a real app we'd use usePathname to set data-active, but we'll let CSS handle focus or basic state for now
        >
          <Database className="w-4 h-4" />
          IOC Database
        </Link>
        <Link 
          href="/dashboard/iocs/hunting" 
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-muted data-[active=true]:bg-rose-500/10 data-[active=true]:text-rose-400"
        >
          <Target className="w-4 h-4" />
          Hunting Engine
        </Link>
      </div>

      {children}
    </div>
  );
}
