"use client";

import { useCallback, useState, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  ReactFlowProvider
} from "reactflow";
import "reactflow/dist/style.css";
import { SidebarPalette } from "./SidebarPalette";

import { TriggerNode } from "./nodes/TriggerNode";
import { ActionNode } from "./nodes/ActionNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { savePlaybook } from "@/app/actions/automation";
import { toast } from "sonner";
import { Save, Loader2, Trash2 } from "lucide-react";

let id = 0;
const getId = () => `dndnode_${id++}`;

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

const initialNodesTemplate = [
  {
    id: "trigger_1",
    type: "trigger",
    data: { label: "High Severity Alert" },
    position: { x: 250, y: 50 },
  },
];

const initialEdgesTemplate: Edge[] = [];

function PlaybookCanvas({ initialPlaybook }: { initialPlaybook?: any }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Use the playbook's saved nodes/edges if available, otherwise use defaults
  const [nodes, setNodes, onNodesChange] = useNodesState(initialPlaybook?.nodes || initialNodesTemplate);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialPlaybook?.edges || initialEdgesTemplate);
  
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!reactFlowInstance) return;
    
    setIsSaving(true);
    const flow = reactFlowInstance.toObject();
    
    // Auto-generate a name for this playbook based on the trigger node if present
    const triggerNode = flow.nodes.find((n: any) => n.type === 'trigger');
    const playbookName = initialPlaybook?.name || (triggerNode ? `Playbook: ${triggerNode.data.label}` : `Untitled Playbook ${new Date().getTime()}`);
    
    // We update if we have an initialPlaybook ID
    const res = await savePlaybook(
      playbookName,
      initialPlaybook?.description || "Automatically generated SOAR playbook from visual builder.",
      flow.nodes,
      flow.edges,
      initialPlaybook?.id
    );
    
    if (res.success) {
      toast.success("Playbook saved successfully!");
    } else {
      toast.error(res.error || "Failed to save playbook.");
    }
    
    setIsSaving(false);
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1' } }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type, // Maps to 'trigger', 'action', or 'condition'
        position,
        data: { label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="flex w-full h-[800px] border border-border rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm shadow-2xl relative">
      <SidebarPalette />
      
      <div className="flex-1 h-full" ref={reactFlowWrapper}>
        <div className="absolute top-4 left-[280px] z-10 bg-muted border border-border px-4 py-3 rounded-md shadow-lg flex items-center justify-between min-w-[400px]">
          <div>
            <h2 className="text-foreground font-semibold text-sm">Playbook Canvas</h2>
            <p className="text-muted-foreground text-xs mt-0.5">Drag and drop nodes to build SOAR workflows.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNodes([]);
                setEdges([]);
              }}
              className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-foreground px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#ffffff" gap={20} size={1} className="opacity-5" />
          <Controls className="bg-muted border-border fill-white" />
          <MiniMap 
            nodeColor={(node) => "rgba(99, 102, 241, 0.5)"}
            maskColor="rgba(0,0,0,0.7)"
            className="bg-muted border-border rounded-lg"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function PlaybookEditor({ initialPlaybook }: { initialPlaybook?: any }) {
  return (
    <ReactFlowProvider>
      <PlaybookCanvas initialPlaybook={initialPlaybook} />
    </ReactFlowProvider>
  );
}
