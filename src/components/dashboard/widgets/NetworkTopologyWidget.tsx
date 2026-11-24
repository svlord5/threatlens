"use client";

import { useEffect, useState } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import { Server, Database, Cloud, ShieldAlert, Laptop, Activity } from "lucide-react";

const NODES = [
  { id: "internet", icon: Cloud, label: "Internet", x: 10, y: 50 },
  { id: "fw", icon: ShieldAlert, label: "WAF / FW", x: 30, y: 50 },
  { id: "lb", icon: Server, label: "Load Balancer", x: 50, y: 50 },
  { id: "api", icon: Server, label: "API Gateway", x: 70, y: 30 },
  { id: "auth", icon: Server, label: "Auth Service", x: 70, y: 70 },
  { id: "db", icon: Database, label: "Main DB", x: 90, y: 30 },
  { id: "cache", icon: Database, label: "Redis Cache", x: 90, y: 70 },
  { id: "worker", icon: Laptop, label: "Background Workers", x: 50, y: 85 },
];

const EDGES = [
  { source: "internet", target: "fw" },
  { source: "fw", target: "lb" },
  { source: "lb", target: "api" },
  { source: "lb", target: "auth" },
  { source: "api", target: "db" },
  { source: "auth", target: "cache" },
  { source: "api", target: "cache" },
  { source: "lb", target: "worker" },
];

export default function NetworkTopologyWidget() {
  const mounted = useIsClient();
  const [compromisedNode, setCompromisedNode] = useState<string | null>(null);

  useEffect(() => {
    // Simulate attack moving through the network
    const sequence = ["internet", "fw", "api", "db", null, null];
    let step = 0;
    
    const interval = setInterval(() => {
      setCompromisedNode(sequence[step]);
      step = (step + 1) % sequence.length;
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-card border border-border p-5 rounded-md flex flex-col h-full group hover:border-border transition-colors relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 z-10 relative">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" />
          Network Topology & Blast Radius
        </h2>
        {compromisedNode && (
          <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-mono animate-pulse">
            BREACH DETECTED
          </span>
        )}
      </div>

      <div className="flex-1 relative min-h-[200px] w-full mt-2">
        {/* SVG Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {EDGES.map((edge, i) => {
            const sourceNode = NODES.find(n => n.id === edge.source)!;
            const targetNode = NODES.find(n => n.id === edge.target)!;
            
            // Check if edge is active in the breach
            const isCompromised = (compromisedNode === edge.source) || (compromisedNode === edge.target && sourceNode.id !== "internet");

            return (
              <line
                key={i}
                x1={`${sourceNode.x}%`}
                y1={`${sourceNode.y}%`}
                x2={`${targetNode.x}%`}
                y2={`${targetNode.y}%`}
                stroke={isCompromised ? "#ef4444" : "#27272a"}
                strokeWidth="2"
                strokeDasharray={isCompromised ? "none" : "4 4"}
                className="transition-colors duration-500"
              />
            );
          })}
          
          {/* Animated data packets */}
          {EDGES.map((edge, i) => {
            const sourceNode = NODES.find(n => n.id === edge.source)!;
            const targetNode = NODES.find(n => n.id === edge.target)!;
            const isCompromised = (compromisedNode === edge.source);
            
            return (
              <circle key={`packet-${i}`} r="3" fill={isCompromised ? "#ef4444" : "#6366f1"}>
                <animateMotion
                  dur={`${(1.5 + ((i * 37) % 100) / 100).toFixed(2)}s`}
                  repeatCount="indefinite"
                  path={`M ${sourceNode.x * 8} ${sourceNode.y * 2} L ${targetNode.x * 8} ${targetNode.y * 2}`} // Approximation for path length
                  // The exact math for SVG path percentage is complex, we'll use a CSS hack on the node instead for simpler animation
                />
              </circle>
            );
          })}
        </svg>

        {/* Nodes */}
        {NODES.map((node) => {
          const isCompromised = compromisedNode === node.id;
          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              {/* Blast Radius Animation */}
              {isCompromised && (
                <>
                  <div className="absolute w-16 h-16 rounded-full border border-red-500/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                  <div className="absolute w-24 h-24 rounded-full border border-red-500/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                </>
              )}
              
              <div className={`relative z-10 w-10 h-10 rounded-lg border ${isCompromised ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-[#111] border-border text-muted-foreground'} flex items-center justify-center transition-colors duration-500`}>
                <node.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-mono whitespace-nowrap ${isCompromised ? 'text-red-400' : 'text-muted-foreground'} transition-colors duration-500`}>
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
