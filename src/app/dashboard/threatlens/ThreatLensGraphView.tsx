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

export default function ThreatLensGraphView({ domains }: { domains: any[] }) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Root Node
    nodes.push({
      id: 'root',
      data: { label: 'Attack Surface' },
      position: { x: 400, y: 50 },
      style: { backgroundColor: '#18181b', color: 'white', border: '1px solid #27272a', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold' }
    });

    domains.forEach((domain: any, index: number) => {
      const domainId = `domain-${domain.id}`;
      const latestScan = domain.threatlens_scans?.sort((a:any,b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      let color = '#22c55e'; // green
      if (latestScan) {
        if (latestScan.risk_score >= 80) color = '#ef4444'; // red
        else if (latestScan.risk_score >= 50) color = '#eab308'; // yellow
      } else {
        color = '#52525b'; // gray if unscanned
      }

      // Domain Node
      nodes.push({
        id: domainId,
        data: { label: domain.domain },
        position: { x: index * 250 + 100, y: 200 },
        style: { 
          backgroundColor: '#09090b', 
          color: 'white', 
          border: `1px solid ${color}`, 
          borderRadius: '8px', 
          padding: '8px 16px', 
          fontSize: '12px',
          boxShadow: `0 0 10px ${color}20`
        }
      });

      edges.push({
        id: `e-root-${domainId}`,
        source: 'root',
        target: domainId,
        animated: true,
        style: { stroke: '#52525b' }
      });

      // Status Node if scanned
      if (latestScan) {
        const scanId = `scan-${latestScan.id}`;
        nodes.push({
          id: scanId,
          data: { label: `Risk: ${latestScan.risk_score}/100\n${latestScan.status}` },
          position: { x: index * 250 + 100, y: 300 },
          style: { 
            backgroundColor: '#18181b', 
            color: '#a1a1aa', 
            border: '1px solid #27272a', 
            borderRadius: '4px', 
            padding: '6px 12px',
            fontSize: '10px',
            textAlign: 'center'
          }
        });

        edges.push({
          id: `e-${domainId}-${scanId}`,
          source: domainId,
          target: scanId,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' },
          style: { stroke: '#52525b' }
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [domains]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[600px] border border-border rounded-xl overflow-hidden bg-card">
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
            if (n.id === 'root') return '#3b82f6'; // blue
            if (n.id.startsWith('domain-')) return '#ffffff';
            return '#3f3f46';
          }}
          maskColor="#00000080"
          style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
        />
      </ReactFlow>
    </div>
  );
}
