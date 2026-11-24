"use client";

import { useMemo } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

export default function ScanGraphView({ scan }: { scan: any }) {
  const { initialNodes, initialEdges, error } = useMemo(() => {
    try {
      const nodes: any[] = [];
      const edges: any[] = [];
      
      const domainName = Array.isArray(scan.threatlens_domains) 
        ? scan.threatlens_domains[0]?.domain 
        : scan.threatlens_domains?.domain || "Target";

    // Root Node (Domain)
    nodes.push({
      id: 'root',
      data: { label: domainName },
      position: { x: 400, y: 50 },
      style: { backgroundColor: '#18181b', color: 'white', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', boxShadow: '0 0 10px #3b82f640' }
    });

    const currentY = 150;

    // A Records
    if (scan.dns_data?.a_records && scan.dns_data.a_records.length > 0) {
      const aGroupId = 'group-a';
      nodes.push({
        id: aGroupId,
        data: { label: 'A Records (IPs)' },
        position: { x: 100, y: currentY },
        style: { backgroundColor: '#27272a', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: '8px', padding: '8px 16px', fontSize: '12px' }
      });
      edges.push({ id: `e-root-${aGroupId}`, source: 'root', target: aGroupId, animated: true, style: { stroke: '#52525b' } });

      scan.dns_data.a_records.forEach((ip: string, i: number) => {
        const ipId = `ip-${i}`;
        nodes.push({
          id: ipId,
          data: { label: ip },
          position: { x: 100 + ((i * 17) % 40 - 20), y: currentY + 70 + (i * 50) },
          style: { backgroundColor: '#09090b', color: '#22d3ee', border: '1px solid #0891b2', borderRadius: '4px', padding: '6px 12px', fontSize: '10px', fontFamily: 'monospace' }
        });
        edges.push({ id: `e-${aGroupId}-${ipId}`, source: aGroupId, target: ipId, markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' }, style: { stroke: '#52525b' } });
      });
    }

    // MX Records
    if (scan.dns_data?.mx_records && scan.dns_data.mx_records.length > 0) {
      const mxGroupId = 'group-mx';
      nodes.push({
        id: mxGroupId,
        data: { label: 'MX Records' },
        position: { x: 300, y: currentY },
        style: { backgroundColor: '#27272a', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: '8px', padding: '8px 16px', fontSize: '12px' }
      });
      edges.push({ id: `e-root-${mxGroupId}`, source: 'root', target: mxGroupId, animated: true, style: { stroke: '#52525b' } });

      scan.dns_data.mx_records.forEach((mx: string, i: number) => {
        const mxId = `mx-${i}`;
        nodes.push({
          id: mxId,
          data: { label: mx },
          position: { x: 300 + ((i * 17) % 40 - 20), y: currentY + 70 + (i * 50) },
          style: { backgroundColor: '#09090b', color: '#c084fc', border: '1px solid #9333ea', borderRadius: '4px', padding: '6px 12px', fontSize: '10px', fontFamily: 'monospace' }
        });
        edges.push({ id: `e-${mxGroupId}-${mxId}`, source: mxGroupId, target: mxId, markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' }, style: { stroke: '#52525b' } });
      });
    }

    // Subdomains
    if (scan.dns_data?.subdomains && scan.dns_data.subdomains.length > 0) {
      const subGroupId = 'group-sub';
      nodes.push({
        id: subGroupId,
        data: { label: `Subdomains (${scan.dns_data.subdomains.length})` },
        position: { x: 500, y: currentY },
        style: { backgroundColor: '#27272a', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: '8px', padding: '8px 16px', fontSize: '12px' }
      });
      edges.push({ id: `e-root-${subGroupId}`, source: 'root', target: subGroupId, animated: true, style: { stroke: '#52525b' } });

      // Only show top 5 in graph to prevent clutter
      scan.dns_data.subdomains.slice(0, 5).forEach((sub: any, i: number) => {
        const subId = `sub-${i}`;
        nodes.push({
          id: subId,
          data: { label: sub.host },
          position: { x: 500 + ((i * 23) % 60 - 30), y: currentY + 70 + (i * 60) },
          style: { backgroundColor: '#09090b', color: '#a3e635', border: '1px solid #65a30d', borderRadius: '4px', padding: '6px 12px', fontSize: '10px', fontFamily: 'monospace' }
        });
        edges.push({ id: `e-${subGroupId}-${subId}`, source: subGroupId, target: subId, markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' }, style: { stroke: '#52525b' } });
      });
    }

    // Findings
    if (scan.threatlens_findings && scan.threatlens_findings.length > 0) {
      const findGroupId = 'group-find';
      nodes.push({
        id: findGroupId,
        data: { label: `Findings (${scan.threatlens_findings.length})` },
        position: { x: 700, y: currentY },
        style: { backgroundColor: '#27272a', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: '8px', padding: '8px 16px', fontSize: '12px' }
      });
      edges.push({ id: `e-root-${findGroupId}`, source: 'root', target: findGroupId, animated: true, style: { stroke: '#52525b' } });

      scan.threatlens_findings.forEach((finding: any, i: number) => {
        const findId = `find-${i}`;
        let color = '#ef4444'; // red for critical/high
        if (finding.severity === 'Medium') color = '#eab308';
        if (finding.severity === 'Low') color = '#3b82f6';
        
        nodes.push({
          id: findId,
          data: { label: finding.title },
          position: { x: 700 + ((i * 23) % 60 - 30), y: currentY + 70 + (i * 60) },
          style: { backgroundColor: '#09090b', color: 'white', border: `1px solid ${color}`, borderRadius: '4px', padding: '6px 12px', fontSize: '10px', maxWidth: '150px' }
        });
        edges.push({ id: `e-${findGroupId}-${findId}`, source: findGroupId, target: findId, markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' }, style: { stroke: '#52525b' } });
      });
    }

      return { initialNodes: nodes, initialEdges: edges, error: null as string | null };
    } catch (err: any) {
      console.error("Graph Error:", err);
      return { initialNodes: [] as any[], initialEdges: [] as any[], error: (err.message || String(err)) as string | null };
    }
  }, [scan]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  if (error) {
    return (
      <div className="w-full h-[600px] border border-red-500/20 rounded-xl overflow-hidden bg-card flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-red-400 font-medium mb-2">Failed to render graph</div>
          <div className="text-muted-foreground font-mono text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full rounded-xl overflow-hidden bg-card animate-in fade-in slide-in-from-bottom-2"
      style={{ width: '100%', height: '600px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
        className="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
        <Controls style={{ backgroundColor: '#18181b', border: '1px solid #27272a', fill: 'white' }} />
        <MiniMap 
          nodeColor={(n) => {
            if (n.id === 'root') return '#3b82f6'; 
            if (n.id.startsWith('group-')) return '#3f3f46';
            if (n.id.startsWith('find-')) return '#ef4444';
            return '#22c55e';
          }}
          maskColor="#00000080"
          style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
        />
      </ReactFlow>
    </div>
  );
}
