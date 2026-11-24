"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { updateCaseField } from "@/app/actions";

const COLUMNS = ["Open", "Investigating", "Escalated", "Closed"];

function buildColumns(cases: any[]): Record<string, any[]> {
  const cols: Record<string, any[]> = { Open: [], Investigating: [], Escalated: [], Closed: [] };
  cases.forEach((c) => {
    const status = COLUMNS.includes(c.status) ? c.status : "Open";
    cols[status].push(c);
  });
  return cols;
}

export function KanbanBoard({ cases }: { cases: any[] }) {
  const [columns, setColumns] = useState<Record<string, any[]>>(() => buildColumns(cases));

  // Rebuild the columns whenever the cases prop changes (real-time updates). Adjusting state during
  // render, guarded by a previous-value check, is React's recommended alternative to an effect.
  const [prevCases, setPrevCases] = useState(cases);
  if (prevCases !== cases) {
    setPrevCases(cases);
    setColumns(buildColumns(cases));
  }

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistically update UI
    const sourceCol = [...columns[source.droppableId]];
    const destCol = [...columns[destination.droppableId]];
    const [movedCase] = sourceCol.splice(source.index, 1);
    
    // Update the status on the object for optimistic UI rendering
    movedCase.status = destination.droppableId;
    destCol.splice(destination.index, 0, movedCase);

    setColumns({
      ...columns,
      [source.droppableId]: sourceCol,
      [destination.droppableId]: destCol,
    });

    // Send update to server
    if (source.droppableId !== destination.droppableId) {
      await updateCaseField(draggableId, "status", destination.droppableId);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "Critical": return "bg-red-500/20 text-red-500 border-red-500/20";
      case "High": return "bg-orange-500/20 text-orange-500 border-orange-500/20";
      case "Medium": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/20";
      default: return "bg-zinc-500/20 text-muted-foreground border-zinc-500/20";
    }
  };

  return (
    <div className="flex gap-4 h-full min-h-[600px] overflow-x-auto pb-4 custom-scrollbar">
      <DragDropContext onDragEnd={onDragEnd}>
        {COLUMNS.map((colId) => (
          <div key={colId} className="flex-1 min-w-[280px] bg-card rounded-lg border border-border flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-medium text-foreground">{colId}</h3>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-muted-foreground">
                {columns[colId]?.length || 0}
              </span>
            </div>
            
            <Droppable droppableId={colId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-3 space-y-3 transition-colors ${
                    snapshot.isDraggingOver ? "bg-white/[0.04]" : ""
                  }`}
                >
                  {columns[colId]?.map((c, index) => (
                    <Draggable key={c.id} draggableId={c.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={provided.draggableProps.style as React.CSSProperties}
                          className={`bg-muted border ${
                            snapshot.isDragging ? "border-indigo-500 shadow-lg" : "border-border hover:border-border"
                          } rounded-md p-4 transition-colors group cursor-grab active:cursor-grabbing`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${getSeverityColor(c.severity)}`}>
                              {c.severity}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">CAS-{c.id.slice(0, 4)}</span>
                          </div>
                          
                          <Link href={`/dashboard/cases/${c.id}`}>
                            <h4 className="text-sm font-medium text-foreground hover:text-foreground transition-colors leading-snug mb-3">
                              {c.title}
                            </h4>
                          </Link>

                          <div className="flex items-center justify-between text-xs mt-auto pt-3 border-t border-white/5">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="w-5 h-5 rounded-full bg-[#111] border border-border flex items-center justify-center text-[9px] font-medium">
                                {c.analyst_id ? "A" : "U"}
                              </span>
                            </div>
                            <span className="text-muted-foreground">
                              {formatDistanceToNow(new Date(c.created_at))} ago
                            </span>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
}
